"""CLI to record a production false-negative as a permanent regression testset item.

When the live gateway misses something it should have caught (a citation it should
have found, a query it should have abstained on), this appends one item with
source="production_regression" to the given testset JSON -- so the next eval run
holds the line and the miss can never silently regress again.

Idempotent on --id: re-running the same command is a no-op, it never duplicates.

    python -m raggw.scripts.record_regression --testset evals/testset.json \\
        --id sepse-choque-refratario-2026-07-10 --cohort sepse --risk-class high_risk \\
        --query "sepse choque refratario vasopressor" --expect-abstain \\
        --gold-source "Surviving Sepsis" --supporting-passage "choque refratario"

No model downloads, no network. All local, zero egress.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# FROZEN testset item schema (Track A/B own the content; this only appends to it).
_ALLOWED_RISK_CLASS = {"high_risk", "normal"}
_SOURCE = "production_regression"
_SCHEMA_KEYS = {
    "id", "cohort", "risk_class", "query", "expect_abstain",
    "gold_source_substrings", "supporting_passage_substrings", "source",
}


def build_item(*, item_id: str, cohort: str, query: str, risk_class: str,
               expect_abstain: bool, gold_source_substrings: list[str],
               supporting_passage_substrings: list[str]) -> dict:
    """Build one testset item against the frozen schema. Raises ValueError if invalid."""
    if not item_id or not item_id.strip():
        raise ValueError("--id must be non-empty")
    if not cohort or not cohort.strip():
        raise ValueError("--cohort must be non-empty")
    if not query or not query.strip():
        raise ValueError("--query must be non-empty")
    if risk_class not in _ALLOWED_RISK_CLASS:
        raise ValueError(f"--risk-class must be one of {sorted(_ALLOWED_RISK_CLASS)}, "
                         f"got {risk_class!r}")
    item = {
        "id": item_id,
        "cohort": cohort,
        "risk_class": risk_class,
        "query": query,
        "expect_abstain": bool(expect_abstain),
        "gold_source_substrings": list(gold_source_substrings or []),
        "supporting_passage_substrings": list(supporting_passage_substrings or []),
        "source": _SOURCE,
    }
    assert set(item) == _SCHEMA_KEYS  # frozen schema -- fail loud on drift
    return item


def append_item(testset_path: Path, item: dict) -> bool:
    """Append item to the testset JSON unless its id already exists.

    Returns True if appended, False if skipped as a duplicate (idempotent)."""
    data = json.loads(testset_path.read_text("utf-8"))
    items = data.setdefault("items", [])
    if any(existing.get("id") == item["id"] for existing in items):
        return False
    items.append(item)
    testset_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", "utf-8")
    return True


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(
        description="Append a production false-negative as a permanent regression "
                    "item in the eval testset (idempotent on --id).")
    ap.add_argument("--testset", required=True, help="testset JSON path to append to")
    ap.add_argument("--id", required=True, dest="item_id", help="unique item id")
    ap.add_argument("--cohort", required=True, help="cohort label")
    ap.add_argument("--query", required=True, help="the query that was missed")
    ap.add_argument("--risk-class", default="normal", choices=sorted(_ALLOWED_RISK_CLASS),
                    help="default: normal")
    ap.add_argument("--expect-abstain", action="store_true",
                    help="correct behavior for this query is to abstain")
    ap.add_argument("--gold-source", action="append", dest="gold_source_substrings",
                    default=[], help="expected gold source substring (repeatable)")
    ap.add_argument("--supporting-passage", action="append",
                    dest="supporting_passage_substrings", default=[],
                    help="expected supporting passage substring (repeatable)")
    args = ap.parse_args(argv)

    try:
        item = build_item(
            item_id=args.item_id, cohort=args.cohort, query=args.query,
            risk_class=args.risk_class, expect_abstain=args.expect_abstain,
            gold_source_substrings=args.gold_source_substrings,
            supporting_passage_substrings=args.supporting_passage_substrings,
        )
    except ValueError as exc:
        print(f"invalid regression item: {exc}", file=sys.stderr)
        return 1

    testset_path = Path(args.testset)
    if append_item(testset_path, item):
        print(f"added regression item {item['id']!r} to {testset_path}")
    else:
        print(f"skipped: id {item['id']!r} already present in {testset_path}",
              file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
