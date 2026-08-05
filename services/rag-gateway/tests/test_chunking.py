"""Chunker: blocks -> citable chunks with page range, section, overlap, token bounds."""
from __future__ import annotations

from raggw.chunking import _is_separator_row, chunk_document
from raggw.models import Block, ParsedDoc


def _doc(blocks: list[Block]) -> ParsedDoc:
    return ParsedDoc(markdown="", blocks=blocks, page_count=max(b.page for b in blocks))


def test_packs_blocks_into_token_bounded_chunks():
    blocks = [Block(text=" ".join(["w"] * 8), page=1, section_path="Sepse > Tratamento")
              for _ in range(6)]
    chunks = chunk_document(_doc(blocks), min_tokens=10, max_tokens=20, overlap_tokens=0)
    assert len(chunks) >= 2
    assert all(c.token_count <= 20 for c in chunks)
    assert [c.chunk_index for c in chunks] == list(range(len(chunks)))


def test_chunk_carries_page_range_and_section():
    blocks = [Block(" ".join(["a"] * 8), page=1, section_path="A > B"),
              Block(" ".join(["b"] * 8), page=2, section_path="A > B")]
    chunks = chunk_document(_doc(blocks), min_tokens=1, max_tokens=100, overlap_tokens=0)
    assert len(chunks) == 1
    c = chunks[0]
    assert c.page_start == 1 and c.page_end == 2
    assert c.section_path == "A > B"
    assert c.contextual_text.startswith("A > B")
    assert "p. 1" in c.citation_label and "2" in c.citation_label


def test_section_change_starts_new_chunk():
    blocks = [
        Block("bibliografia embolia pulmonar " * 10, page=10, section_path="BIBLIOGRAFIA"),
        Block("sindromes aorticas agudas tratamento " * 10, page=11,
              section_path="SÍNDROMES AÓRTICAS AGUDAS"),
    ]
    chunks = chunk_document(_doc(blocks), min_tokens=1, max_tokens=100, overlap_tokens=0)

    assert len(chunks) == 2
    assert chunks[0].section_path == "BIBLIOGRAFIA"
    assert chunks[1].section_path == "SÍNDROMES AÓRTICAS AGUDAS"
    assert "sindromes aorticas" not in chunks[0].chunk_text


def test_overlap_shares_boundary_text():
    blocks = [Block(f"block{i} " + " ".join(["w"] * 8), page=1, section_path="S")
              for i in range(4)]
    chunks = chunk_document(_doc(blocks), min_tokens=9, max_tokens=18, overlap_tokens=8)
    assert len(chunks) >= 2
    prev_tail = " ".join(chunks[0].chunk_text.split()[-8:])
    assert chunks[1].chunk_text.startswith(prev_tail)
    assert all(c.token_count <= 18 for c in chunks)


def test_overlap_is_token_budgeted_tail_not_whole_block():
    blocks = [
        Block("alpha " + " ".join(f"a{i}" for i in range(12)), page=1, section_path="S"),
        Block("beta " + " ".join(f"b{i}" for i in range(12)), page=1, section_path="S"),
        Block("gamma " + " ".join(f"c{i}" for i in range(12)), page=1, section_path="S"),
    ]
    chunks = chunk_document(_doc(blocks), min_tokens=10, max_tokens=20, overlap_tokens=4)

    assert len(chunks) == 3
    assert chunks[1].chunk_text.startswith("a8 a9 a10 a11")
    assert "alpha" not in chunks[1].chunk_text
    assert chunks[2].chunk_text.startswith("b8 b9 b10 b11")
    assert all(c.token_count <= 20 for c in chunks)


def test_oversized_block_is_split():
    big = Block(" ".join(["x"] * 50), page=3, section_path="Big")
    chunks = chunk_document(_doc([big]), min_tokens=10, max_tokens=20, overlap_tokens=5)
    assert len(chunks) >= 2
    assert all(c.page_start == 3 and c.page_end == 3 for c in chunks)
    assert all(c.token_count <= 20 for c in chunks)


def test_oversized_block_prefers_sentence_windows():
    big = Block(
        "Primeira frase com tratamento inicial. "
        "Segunda frase com dose e monitorizacao. "
        "Terceira frase com reavaliacao clinica. "
        "Quarta frase com alta segura.",
        page=3,
        section_path="Conduta",
    )
    chunks = chunk_document(_doc([big]), min_tokens=5, max_tokens=12, overlap_tokens=3)

    assert len(chunks) >= 2
    assert "Primeira frase" in chunks[0].chunk_text
    assert "Segunda frase" in chunks[0].chunk_text
    assert "Terceira frase" in chunks[1].chunk_text
    assert all(c.token_count <= 12 for c in chunks)


def test_table_blocks_are_isolated_chunks():
    blocks = [
        Block("texto antes " * 20, page=1, section_path="S"),
        Block("<table><tr><td>A</td></tr></table>", page=1, section_path="S",
              block_type="table"),
        Block("texto depois " * 20, page=2, section_path="S"),
    ]
    chunks = chunk_document(_doc(blocks), min_tokens=10, max_tokens=80, overlap_tokens=5)

    table_chunks = [c for c in chunks if c.chunk_type == "table"]
    assert len(table_chunks) == 1
    assert table_chunks[0].chunk_text.startswith("<table>")
    assert "texto antes" not in table_chunks[0].chunk_text
    assert "texto depois" not in table_chunks[0].chunk_text


def test_chunk_never_crosses_section_boundary():
    blocks = [
        Block("Introducao ao tema com bastante contexto clinico relevante " * 6,
              page=1, section_path="SECAO A"),
        Block("Conduta detalhada e recomendacoes de manejo para o paciente " * 6,
              page=2, section_path="SECAO B"),
    ]
    chunks = chunk_document(_doc(blocks), min_tokens=10, max_tokens=100, overlap_tokens=0)

    assert len(chunks) >= 2
    sections = {c.section_path for c in chunks}
    assert sections == {"SECAO A", "SECAO B"}
    for chunk in chunks:
        # a single chunk must map to exactly one section (invariant: no cross-boundary chunk)
        assert chunk.section_path in ("SECAO A", "SECAO B")
    a_chunks = [c for c in chunks if c.section_path == "SECAO A"]
    b_chunks = [c for c in chunks if c.section_path == "SECAO B"]
    assert all("Conduta detalhada" not in c.chunk_text for c in a_chunks)
    assert all("Introducao ao tema" not in c.chunk_text for c in b_chunks)


def test_large_table_splits_with_header_repeated_and_no_row_lost():
    header = "| Drug | Dose |"
    sep = "|---|---|"
    body_rows = [f"| drug{i} | {i}mg |" for i in range(10)]
    table_text = "\n".join([header, sep] + body_rows)
    big_table = Block(table_text, page=4, section_path="Doses", block_type="table")

    chunks = chunk_document(_doc([big_table]), min_tokens=1, max_tokens=20, overlap_tokens=0)

    assert len(chunks) > 1, "table should have been split into multiple parts"
    seen_rows: list[str] = []
    for c in chunks:
        assert c.chunk_type == "table"
        assert c.page_start == 4 and c.page_end == 4
        assert c.section_path == "Doses"
        lines = c.chunk_text.split("\n")
        assert lines[0] == header, "every part must repeat the exact header line"
        assert lines[1] == sep, "every part must repeat the separator line"
        seen_rows.extend(lines[2:])

    # union of body rows across parts == original body rows; none lost, none duplicated
    assert seen_rows == body_rows


def test_single_table_row_wider_than_max_tokens_is_kept_whole():
    header = "| Drug | Dose | Notes |"
    huge_row = "| epinefrina | " + " ".join(f"detail{i}" for i in range(30)) + " | note |"
    other_row = "| amiodarona | 300mg | bolus |"
    table_text = "\n".join([header, huge_row, other_row])
    big_table = Block(table_text, page=7, section_path="Emergencia", block_type="table")

    chunks = chunk_document(_doc([big_table]), min_tokens=1, max_tokens=10, overlap_tokens=0)

    table_chunks = [c for c in chunks if c.chunk_type == "table"]
    huge_row_chunks = [c for c in table_chunks if huge_row in c.chunk_text]
    assert len(huge_row_chunks) == 1, "the oversized row must appear whole, not truncated"
    assert huge_row_chunks[0].chunk_text.split("\n")[0] == header
    # every original row is present somewhere, unbroken
    all_text = "\n".join(c.chunk_text for c in table_chunks)
    assert huge_row in all_text
    assert other_row in all_text


def test_is_separator_row_requires_a_real_dash_run():
    assert _is_separator_row("|---|---|") is True
    assert _is_separator_row("| -- | -- |") is False, \
        "dash placeholders (< 3 consecutive dashes) are data, not a header separator"
    assert _is_separator_row("| -5 | -3 |") is False
    assert _is_separator_row("| 1-2 | 3-4 |") is False


def test_dash_placeholder_row_is_treated_as_body_not_separator():
    header = "| Drug | Dose |"
    placeholder_row = "| -- | -- |"
    body_rows = [placeholder_row] + [f"| drug{i} | {i}mg |" for i in range(8)]
    table_text = "\n".join([header] + body_rows)
    table = Block(table_text, page=2, section_path="Doses", block_type="table")

    chunks = chunk_document(_doc([table]), min_tokens=1, max_tokens=20, overlap_tokens=0)

    table_chunks = [c for c in chunks if c.chunk_type == "table"]
    assert len(table_chunks) > 1, "table should have been split into multiple parts"
    seen_rows: list[str] = []
    for c in table_chunks:
        lines = c.chunk_text.split("\n")
        assert lines[0] == header, "every part must repeat the exact header line"
        seen_rows.extend(lines[1:])
    # placeholder row is ordinary body data: appears exactly once, in original position
    assert seen_rows == body_rows


def test_small_table_fits_in_single_unchanged_chunk():
    header = "| A | B |"
    sep = "|---|---|"
    row = "| 1 | 2 |"
    table_text = "\n".join([header, sep, row])
    small_table = Block(table_text, page=1, section_path="S", block_type="table")

    chunks = chunk_document(_doc([small_table]), min_tokens=1, max_tokens=100, overlap_tokens=0)

    table_chunks = [c for c in chunks if c.chunk_type == "table"]
    assert len(table_chunks) == 1
    assert table_chunks[0].chunk_text == table_text


def test_citation_label_includes_title_when_given():
    blocks = [Block("hello world", page=5, section_path="Cap 1")]
    chunks = chunk_document(_doc(blocks), min_tokens=1, max_tokens=50,
                            overlap_tokens=0, title="Surviving Sepsis 2025")
    assert "Surviving Sepsis 2025" in chunks[0].citation_label
    assert "p. 5" in chunks[0].citation_label
