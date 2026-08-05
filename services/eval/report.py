"""Citação, recusa e latência a partir de results/.

Uso:
    python report.py --dir results/simvera --bench medqa
"""
from __future__ import annotations

import argparse
import json
import statistics
from pathlib import Path


def pct(xs: list[float], p: float) -> float:
    if not xs:
        return 0.0
    s = sorted(xs)
    k = (len(s) - 1) * p / 100
    f = int(k)
    c = min(f + 1, len(s) - 1)
    if f == c:
        return s[f]
    return s[f] + (s[c] - s[f]) * (k - f)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--bench", choices=("medqa", "pubmedqa"), required=True)
    args = ap.parse_args()

    path = Path(args.dir) / f"{args.bench}.json"
    items = json.loads(path.read_text(encoding="utf-8"))
    ok = [i for i in items if not i.get("error")]
    n = len(ok)
    with_cite = sum(1 for i in ok if i.get("citations"))
    abst = sum(1 for i in ok if i.get("abstained"))
    lats = [float(i.get("latency_s") or 0) for i in ok]

    print(f"{args.dir}  {args.bench}  (n={n}, errors={len(items)-n})")
    print(f"  citation_recall  {with_cite/n*100:6.2f}%  ({with_cite}/{n})" if n else "  citation_recall  n/a")
    print(f"  abstain_rate     {abst/n*100:6.2f}%  ({abst}/{n})" if n else "  abstain_rate     n/a")
    if lats:
        print(f"  latency_p50      {pct(lats, 50):6.2f}s")
        print(f"  latency_p95      {pct(lats, 95):6.2f}s")
        print(f"  latency_mean     {statistics.mean(lats):6.2f}s")
        print(f"  latency_max      {max(lats):6.2f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
