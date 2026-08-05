"""Pure page-range batch driver: math + retry + aggregation, no I/O.

The caller (reprocess_mineru_batched.py) supplies `run_range(start, end)`, which
does the real MinerU subprocess + parse + per-batch temp cleanup. This module
never touches the filesystem or a subprocess, and never shares state between
`run_range` calls — that's what gives each batch isolation. A batch that raises
is retried up to `max_retries` times; if it still fails, `on_batch_error='skip'`
records the failed range and continues (a large PDF must not crash the whole
build), or `on_batch_error='raise'` re-raises.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from ..models import Block


@dataclass
class BatchedResult:
    markdown: str
    blocks: list[Block]
    completed_ranges: list[tuple[int, int]]
    failed_ranges: list[tuple[int, int]]


def batched_parse(
    total_pages: int,
    run_range: Callable[[int, int], tuple[str, list[Block]]],
    *,
    batch_pages: int = 48,
    max_retries: int = 2,
    on_batch_error: str = "skip",
) -> BatchedResult:
    if on_batch_error not in ("skip", "raise"):
        raise ValueError(
            f"on_batch_error must be 'skip' or 'raise', got {on_batch_error!r}")
    markdown_parts: list[str] = []
    blocks: list[Block] = []
    completed: list[tuple[int, int]] = []
    failed: list[tuple[int, int]] = []

    for start in range(0, total_pages, batch_pages):
        end = min(total_pages - 1, start + batch_pages - 1)
        for attempt in range(max_retries + 1):
            try:
                md, batch_blocks = run_range(start, end)
            except Exception:
                if attempt == max_retries:
                    if on_batch_error == "raise":
                        raise
                    failed.append((start, end))
                continue
            markdown_parts.append(md)
            blocks.extend(batch_blocks)
            completed.append((start, end))
            break

    return BatchedResult(markdown="\n".join(markdown_parts), blocks=blocks,
                         completed_ranges=completed, failed_ranges=failed)
