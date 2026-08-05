"""Pure batch driver: page-range math + retry + skip-on-failure isolation.
No real MinerU here — run_range is always a fake."""
from __future__ import annotations

from raggw.models import Block
from raggw.parsing.mineru_batch import batched_parse


def test_batches_100_pages_into_3_ranges_in_order():
    calls: list[tuple[int, int]] = []

    def run_range(start: int, end: int) -> tuple[str, list[Block]]:
        calls.append((start, end))
        return f"md-{start}-{end}", [Block(f"block-{start}", start, None, "text")]

    result = batched_parse(100, run_range, batch_pages=48)

    assert calls == [(0, 47), (48, 95), (96, 99)]
    assert result.completed_ranges == [(0, 47), (48, 95), (96, 99)]
    assert result.failed_ranges == []
    assert [b.text for b in result.blocks] == ["block-0", "block-48", "block-96"]
    assert result.markdown == "md-0-47\nmd-48-95\nmd-96-99"


def test_retries_a_failing_range_then_succeeds():
    call_count = {"n": 0}

    def run_range(start: int, end: int) -> tuple[str, list[Block]]:
        call_count["n"] += 1
        if call_count["n"] == 1:
            raise RuntimeError("transient mineru failure")
        return "md-ok", [Block("recovered", start, None, "text")]

    result = batched_parse(40, run_range, batch_pages=48, max_retries=2)

    assert call_count["n"] == 2
    assert result.completed_ranges == [(0, 39)]
    assert result.failed_ranges == []
    assert result.blocks[0].text == "recovered"


def test_always_failing_range_is_skipped_others_still_complete():
    def run_range(start: int, end: int) -> tuple[str, list[Block]]:
        if start == 48:
            raise RuntimeError("this range always fails")
        return f"md-{start}", [Block(f"block-{start}", start, None, "text")]

    result = batched_parse(100, run_range, batch_pages=48, max_retries=2,
                           on_batch_error="skip")

    assert result.failed_ranges == [(48, 95)]
    assert result.completed_ranges == [(0, 47), (96, 99)]
    assert [b.text for b in result.blocks] == ["block-0", "block-96"]


def test_on_batch_error_raise_propagates_after_retries_exhausted():
    def run_range(start: int, end: int) -> tuple[str, list[Block]]:
        raise RuntimeError("always fails")

    try:
        batched_parse(48, run_range, batch_pages=48, max_retries=1,
                      on_batch_error="raise")
        assert False, "expected RuntimeError to propagate"
    except RuntimeError:
        pass


def test_unknown_on_batch_error_value_rejected_loudly():
    def run_range(start: int, end: int) -> tuple[str, list[Block]]:
        return "md", [Block("b", start, None, "text")]

    try:
        batched_parse(10, run_range, on_batch_error="ignore")
        assert False, "expected ValueError for unknown on_batch_error"
    except ValueError:
        pass
