"""Roda um alvo sobre um dataset e grava resultados retomáveis.

Uso:
    python run.py --target simvera --data data/medqa-20.jsonl
    python run.py --target rag --data data/medqa-20.jsonl --no-forced-choice
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import targets as T

ROOT = Path(__file__).resolve().parent


def load_done(out: Path) -> tuple[list[dict], set[str]]:
    if not out.exists():
        return [], set()
    got = json.loads(out.read_text(encoding="utf-8"))
    return got, {g["id"] for g in got}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", choices=sorted(T.TARGETS), required=True)
    ap.add_argument("--data", required=True, help="ex: data/medqa-20.jsonl")
    ap.add_argument(
        "--no-forced-choice",
        action="store_true",
        help="deixa o alvo recusar; usado para medir taxa de recusa",
    )
    args = ap.parse_args()

    data = Path(args.data)
    if not data.is_absolute():
        data = ROOT / data
    items = [
        json.loads(l)
        for l in data.read_text(encoding="utf-8").splitlines()
        if l.strip()
    ]
    if not items:
        raise SystemExit(f"dataset vazio: {data}")
    bench = items[0]["bench"]

    suffix = "" if not args.no_forced_choice else "-free"
    outdir = ROOT / "results" / f"{args.target}{suffix}"
    outdir.mkdir(parents=True, exist_ok=True)
    out = outdir / f"{bench}.json"

    done, seen = load_done(out)
    todo = [i for i in items if i["id"] not in seen]
    print(f"{args.target}{suffix} / {bench}: {len(done)} feitos, {len(todo)} restantes")

    fn = T.TARGETS[args.target]
    t_start = time.time()
    for n, item in enumerate(todo, 1):
        rec = {
            "id": item["id"],
            "label": item["label"],
            "difficulty": item["difficulty"],
            "response": "",
            "latency_s": 0.0,
            "citations": [],
            "abstained": False,
            "error": None,
        }
        try:
            r = fn(item, forced_choice=not args.no_forced_choice)
            rec.update(
                response=r["text"],
                latency_s=r["latency_s"],
                citations=r["citations"],
                abstained=r["abstained"],
            )
        except Exception as exc:
            rec["error"] = f"{type(exc).__name__}: {exc}"
        done.append(rec)
        out.write_text(json.dumps(done, ensure_ascii=False, indent=1), encoding="utf-8")
        eta = (time.time() - t_start) / n * (len(todo) - n) if n else 0
        print(
            f"  [{n}/{len(todo)}] {rec['latency_s']:5.1f}s "
            f"{'ERRO' if rec['error'] else ('ABST' if rec['abstained'] else 'ok')}  "
            f"eta {eta/60:.0f}min",
            file=sys.stderr,
            flush=True,
        )

    errs = sum(1 for d in done if d.get("error"))
    print(f"{out}: {len(done)} itens, {errs} erros")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
