"""Regression: .md/.txt must NOT be routed to PDF parsers (they raise CalledProcessError).
The root-cause fix routes text-native formats to TextParser."""
from raggw.parsing.router import parse_file
from raggw.parsing.text_parser import TextParser


def test_markdown_routes_to_text_parser(tmp_path):
    f = tmp_path / "note.md"
    f.write_text("# Title\n\nBody paragraph one.\n\nBody two.\n", encoding="utf-8")
    doc = parse_file(str(f))
    assert doc.parser == "text"
    assert "Body paragraph one." in doc.markdown
    assert any(b.block_type == "heading" for b in doc.blocks)


def test_txt_routes_to_text_parser(tmp_path):
    f = tmp_path / "plain.txt"
    f.write_text("just some plain text\n\nsecond para", encoding="utf-8")
    doc = parse_file(str(f))
    assert doc.parser == "text"
    assert "plain text" in doc.markdown


def test_text_parser_reads_utf8_directly(tmp_path):
    f = tmp_path / "acentuação.md"
    f.write_text("Intoxicação por metanol — µg/dL", encoding="utf-8")
    doc = TextParser().parse(str(f))
    assert "Intoxicação" in doc.markdown and "µg/dL" in doc.markdown
