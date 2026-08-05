"""Baixa MedQA e PubMedQA e normaliza para um formato único de item.

Usa a API REST do datasets-server (JSON pronto) em vez da lib `datasets` do HF.

Uso:
    python datasets.py --bench medqa --n 100
    python datasets.py --bench pubmedqa --n 20
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"

BENCHES = {
    "medqa": {
        "dataset": "GBaker/MedQA-USMLE-4-options",
        "config": "default",
        "split": "test",
    },
    "pubmedqa": {
        "dataset": "qiaojin/PubMedQA",
        "config": "pqa_labeled",
        "split": "train",
    },
}

API = "https://datasets-server.huggingface.co/rows"


def norm_medqa(row: dict) -> dict:
    return {
        "id": "",
        "bench": "medqa",
        "question": row["question"],
        "options": row.get("options") or {},
        "label": str(row.get("answer_idx") or "").strip().upper(),
        "difficulty": (row.get("meta_info") or "unknown"),
    }


def norm_pubmedqa(row: dict) -> dict:
    """Descarta context/long_answer: com o contexto dado, o harness mediria geração, não recuperação."""
    return {
        "id": str(row.get("pubid") or ""),
        "bench": "pubmedqa",
        "question": row["question"],
        "options": None,
        "label": str(row.get("final_decision") or "").strip().lower(),
        "difficulty": "unknown",
    }


def _fetch_page(bench: str, offset: int, length: int) -> list[dict]:
    meta = BENCHES[bench]
    params = {
        "dataset": meta["dataset"],
        "config": meta["config"],
        "split": meta["split"],
        "offset": offset,
        "length": length,
    }
    with httpx.Client(timeout=60.0) as c:
        r = c.get(API, params=params)
        r.raise_for_status()
        body = r.json()
    rows = []
    for entry in body.get("rows") or []:
        row = entry.get("row") if isinstance(entry, dict) else entry
        if not isinstance(row, dict):
            continue
        item = norm_medqa(row) if bench == "medqa" else norm_pubmedqa(row)
        rows.append(item)
    return rows


def fetch(bench: str, n: int) -> list[dict]:
    if bench not in BENCHES:
        raise ValueError(f"bench desconhecido: {bench}")
    out: list[dict] = []
    page = 100  # API max típico
    offset = 0
    while len(out) < n:
        need = min(page, n - len(out))
        batch = _fetch_page(bench, offset, need)
        if not batch:
            break
        for i, item in enumerate(batch):
            if not item["id"]:
                item["id"] = f"{bench}-{offset + i}"
            out.append(item)
            if len(out) >= n:
                break
        offset += len(batch)
        if len(batch) < need:
            break
    return out[:n]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bench", choices=sorted(BENCHES), required=True)
    ap.add_argument("--n", type=int, required=True)
    args = ap.parse_args()

    DATA.mkdir(parents=True, exist_ok=True)
    items = fetch(args.bench, args.n)
    path = DATA / f"{args.bench}-{args.n}.jsonl"
    path.write_text(
        "\n".join(json.dumps(it, ensure_ascii=False) for it in items) + ("\n" if items else ""),
        encoding="utf-8",
    )
    print(f"{path}: {len(items)} itens")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
