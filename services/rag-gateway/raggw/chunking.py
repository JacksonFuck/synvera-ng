"""Blocks -> citable chunks.

The chunker keeps parser-provided structure, but refines oversized text into
sentence windows and carries a token-budgeted semantic tail between chunks.
Provenance (page/section) flows into each chunk.
"""
from __future__ import annotations

import re

from .models import Block, Chunk, ParsedDoc


_SENTENCE_BOUNDARY = re.compile(r"(?<=[.!?;:])\s+(?=[A-ZÀ-Ú0-9])")
_SOFT_BOUNDARY = re.compile(r"\n\s*(?=(?:[-*•]|\d+[.)])\s+|[A-ZÀ-Ú][^\n]{0,90}:)")


def count_tokens(text: str) -> int:
    # ponytail: whitespace word-count as a token proxy. Swap for tiktoken/HF tokenizer
    # if exact budgeting matters; word-count is within ~25% and needs no dep for Phase 1.
    return len(text.split())


def _citation(title: str | None, section: str | None, p0: int, p1: int) -> str:
    parts: list[str] = []
    if title:
        parts.append(title)
    if section:
        parts.append(section)
    parts.append(f"p. {p0}" if p0 == p1 else f"p. {p0}–{p1}")
    return " — ".join(parts)


def _make_chunk(index: int, blocks: list[Block], title: str | None) -> Chunk:
    text = "\n\n".join(b.text for b in blocks)
    pages = [b.page for b in blocks]
    section = next((b.section_path for b in blocks if b.section_path), None)
    contextual = f"{section}\n\n{text}" if section else text
    p0, p1 = min(pages), max(pages)
    return Chunk(
        chunk_index=index,
        chunk_text=text,
        contextual_text=contextual,
        section_path=section,
        page_start=p0,
        page_end=p1,
        token_count=count_tokens(text),
        chunk_type=blocks[0].block_type,
        citation_label=_citation(title, section, p0, p1),
    )


def _word_windows(block: Block, *, max_tokens: int, overlap_tokens: int) -> list[Block]:
    words = block.text.split()
    step = max(1, max_tokens - overlap_tokens)
    out: list[Block] = []
    i = 0
    while i < len(words):
        seg = words[i:i + max_tokens]
        out.append(Block(" ".join(seg), block.page, block.section_path, block.block_type))
        if i + max_tokens >= len(words):
            break
        i += step
    return out


def _sentences(text: str) -> list[str]:
    parts: list[str] = []
    for soft in _SOFT_BOUNDARY.split(text):
        soft = soft.strip()
        if not soft:
            continue
        parts.extend(s.strip() for s in _SENTENCE_BOUNDARY.split(soft) if s.strip())
    return parts or [text.strip()]


def _split_oversized(block: Block, max_tokens: int, overlap_tokens: int) -> list[Block]:
    units = [Block(s, block.page, block.section_path, block.block_type)
             for s in _sentences(block.text)]
    if len(units) == 1 and count_tokens(units[0].text) > max_tokens:
        return _word_windows(block, max_tokens=max_tokens, overlap_tokens=overlap_tokens)

    out: list[Block] = []
    cur: list[Block] = []
    cur_tokens = 0

    def flush() -> None:
        nonlocal cur, cur_tokens
        if cur:
            out.append(Block(" ".join(u.text for u in cur), block.page,
                             block.section_path, block.block_type))
            cur = []
            cur_tokens = 0

    for unit in units:
        unit_tokens = count_tokens(unit.text)
        if unit_tokens > max_tokens:
            flush()
            out.extend(_word_windows(unit, max_tokens=max_tokens,
                                     overlap_tokens=overlap_tokens))
            continue
        if cur and cur_tokens + unit_tokens > max_tokens:
            flush()
        cur.append(unit)
        cur_tokens += unit_tokens
    flush()

    if overlap_tokens <= 0 or len(out) < 2:
        return out

    overlapped: list[Block] = [out[0]]
    for prev, cur_block in zip(out, out[1:]):
        room = max(0, max_tokens - count_tokens(cur_block.text))
        tail = _tail_text(prev.text, min(overlap_tokens, room))
        text = f"{tail} {cur_block.text}".strip() if tail else cur_block.text
        overlapped.append(Block(text, cur_block.page, cur_block.section_path,
                                cur_block.block_type))
    return overlapped


def _tail_blocks(blocks: list[Block], overlap_tokens: int) -> list[Block]:
    if overlap_tokens <= 0:
        return []
    out: list[Block] = []
    used = 0
    for block in reversed(blocks):
        block_tokens = count_tokens(block.text)
        if used + block_tokens <= overlap_tokens:
            out.append(block)
            used += block_tokens
            continue
        remaining = overlap_tokens - used
        if remaining > 0:
            tail = _tail_text(block.text, remaining)
            if tail:
                out.append(Block(tail, block.page, block.section_path, block.block_type))
        break
    return list(reversed(out))


def _tail_text(text: str, max_tokens: int) -> str:
    words = text.split()
    if max_tokens <= 0:
        return ""
    if len(words) <= max_tokens:
        return text
    sentence_tail: list[str] = []
    used = 0
    for sentence in reversed(_sentences(text)):
        n = count_tokens(sentence)
        if sentence_tail and used + n > max_tokens:
            break
        sentence_tail.append(sentence)
        used += n
        if used >= max_tokens:
            break
    if sentence_tail and used <= max_tokens:
        return " ".join(reversed(sentence_tail))
    return " ".join(words[-max_tokens:])


def _is_separator_row(row: str) -> bool:
    s = row.strip()
    # Require a real dash run (>=3), like markdown's "---"/"----" separators. Dash
    # placeholders in data rows (e.g. "| -- | -- |") have at most 2 in a row and
    # must stay classified as body, not folded into the repeated header.
    return bool(s) and "---" in s and all(c in "-|: \t" for c in s)


def _split_table(block: Block, max_tokens: int) -> list[Block]:
    rows = block.text.split("\n")
    header_lines = [rows[0]]
    body_start = 1
    if len(rows) > 1 and _is_separator_row(rows[1]):
        header_lines.append(rows[1])
        body_start = 2
    body = rows[body_start:]

    if len(body) <= 1 or count_tokens(block.text) <= max_tokens:
        return [block]

    header_tokens = count_tokens("\n".join(header_lines))
    parts: list[Block] = []
    cur_rows: list[str] = []
    cur_tokens = header_tokens

    def flush() -> None:
        nonlocal cur_rows, cur_tokens
        if cur_rows:
            text = "\n".join(header_lines + cur_rows)
            parts.append(Block(text, block.page, block.section_path, "table"))
            cur_rows = []
            cur_tokens = header_tokens

    for row in body:
        row_tokens = count_tokens(row)
        # NEVER drop a body row: a single oversized row still gets its own part,
        # kept whole (intact-but-oversized beats lost data — medical tables carry dosing).
        if cur_rows and cur_tokens + row_tokens > max_tokens:
            flush()
        cur_rows.append(row)
        cur_tokens += row_tokens
    flush()

    return parts


def chunk_document(
    doc: ParsedDoc,
    *,
    min_tokens: int,
    max_tokens: int,
    overlap_tokens: int,
    title: str | None = None,
) -> list[Chunk]:
    chunks: list[Chunk] = []
    cur: list[Block] = []
    cur_tokens = 0

    def flush() -> None:
        nonlocal cur, cur_tokens
        if cur:
            chunks.append(_make_chunk(len(chunks), cur, title))
            cur, cur_tokens = [], 0

    for block in doc.blocks:
        bt = count_tokens(block.text)
        if cur and block.section_path != cur[-1].section_path:
            flush()
        if block.block_type == "table":
            flush()
            for sub in _split_table(block, max_tokens):
                chunks.append(_make_chunk(len(chunks), [sub], title))
            continue
        if bt > max_tokens:
            flush()
            for sub in _split_oversized(block, max_tokens, overlap_tokens):
                chunks.append(_make_chunk(len(chunks), [sub], title))
            continue
        if cur_tokens + bt > max_tokens and cur_tokens >= min_tokens:
            tail = _tail_blocks(cur, overlap_tokens)
            flush()
            cur = list(tail)
            cur_tokens = sum(count_tokens(b.text) for b in cur)
        cur.append(block)
        cur_tokens += bt

    flush()
    return chunks
