"""Extrai a resposta do texto bruto e calcula acurácia.

Scorer próprio (os do Meissa importam eval_helpers ausente).

Uso:
    python score.py --dir results/simvera --bench medqa
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

_MEDQA = [
    re.compile(p, re.IGNORECASE | re.MULTILINE)
    for p in (
        r"Answer:\s*\(?([A-E])\)?",
        r"The correct answer is\s*\(?([A-E])\)?",
        r"Final Answer:\s*\(?([A-E])\)?",
        r"Correct Answer:\s*\(?([A-E])\)?",
        r"\*\*Answer:\s*\(?([A-E])\)?\*\*",
        r"\(([A-E])\)",
        r"(?:^|\n)\s*([A-E])\)\s",
        r"^([A-E])$",
        # forced-choice: resposta que é só a letra (linha inteira)
        r"(?m)^\s*([A-D])\s*$",
    )
]


_REFUSAL = re.compile(
    r"(n[aã]o\s+h[aá]\s+evid|sem\s+fonte|recus|insufficient|cannot\s+answer|"
    r"n[aã]o\s+posso\s+responder|evid[eê]ncia\s+n[aã]o\s+fornece)",
    re.IGNORECASE,
)


def extract(text: str, bench: str) -> str | None:
    """Rótulo extraído, ou None quando nenhum padrão casa (recusa ou divagação)."""
    if not isinstance(text, str) or not text.strip():
        return None
    if _REFUSAL.search(text):
        return None
    if bench == "medqa":
        # Última ocorrência *no texto* (posição), não a última regex da lista —
        # senão "(A)" no raciocínio sobrescreve "Final Answer: D".
        best_pos, best = -1, None
        for pat in _MEDQA:
            for m in pat.finditer(text):
                if m.start() >= best_pos:
                    best_pos, best = m.start(), m.group(1)
        return best.upper() if best else None
    # pubmedqa: última menção com boundary (evita "no" em "not" / "knowledge").
    last, best = -1, None
    low = text.lower()
    for label in ("yes", "no", "maybe"):
        for m in re.finditer(rf"\b{label}\b", low):
            if m.start() > last:
                last, best = m.start(), label
    return best


def tally(items: list[dict], bench: str) -> dict:
    """Acurácia sobre os itens sem erro de execução, com quebra por difficulty."""
    ok = [i for i in items if not i.get("error")]
    by_diff: dict[str, dict] = defaultdict(lambda: {"total": 0, "correct": 0})
    correct = extraction_fail = 0
    for it in ok:
        pred = extract(it.get("response", ""), bench)
        d = by_diff[it.get("difficulty") or "unknown"]
        d["total"] += 1
        if pred is None:
            extraction_fail += 1
            continue
        if pred.lower() == str(it["label"]).lower():
            correct += 1
            d["correct"] += 1
    total = len(ok)
    return {
        "total": total,
        "correct": correct,
        "errors": len(items) - total,
        "extraction_fail": extraction_fail,
        "accuracy": round(correct / total * 100, 2) if total else 0.0,
        "by_difficulty": {k: dict(v) for k, v in sorted(by_diff.items())},
    }


def load(dirpath: Path, bench: str) -> list[dict]:
    path = dirpath / f"{bench}.json"
    if not path.exists():
        raise SystemExit(f"não encontrado: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help="ex: results/simvera")
    ap.add_argument("--bench", choices=("medqa", "pubmedqa"), required=True)
    args = ap.parse_args()

    r = tally(load(Path(args.dir), args.bench), args.bench)
    print(f"{args.dir}  {args.bench}")
    print(f"  acurácia          {r['accuracy']:6.2f}%  ({r['correct']}/{r['total']})")
    print(f"  falha de extração {r['extraction_fail']:6d}")
    print(f"  erro de execução  {r['errors']:6d}")
    for d, v in r["by_difficulty"].items():
        acc = v["correct"] / v["total"] * 100 if v["total"] else 0
        print(f"    {d:14s} {acc:6.2f}%  ({v['correct']}/{v['total']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
