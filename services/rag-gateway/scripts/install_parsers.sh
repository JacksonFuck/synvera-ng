#!/usr/bin/env bash
# Background install of the heavy parser tiers into the rag-gateway venv.
# liteparse = simple/fast docs; MinerU = complex docs. Both emit high-quality Markdown.
# Degrades gracefully: if either fails, the pdftotext tier keeps ingestion working.
set -u
cd "$(dirname "$0")/.." || exit 1
PY=.venv/bin/python
mkdir -p data
LOG=data/install_parsers.log
echo "[install_parsers] start $(date -Is)" | tee "$LOG"

echo "[install_parsers] installing liteparse (simple/fast tier)..." | tee -a "$LOG"
uv pip install --python "$PY" liteparse >>"$LOG" 2>&1 \
  && echo "[install_parsers] liteparse OK" | tee -a "$LOG" \
  || echo "[install_parsers] liteparse FAILED (fallback: pdftotext)" | tee -a "$LOG"

# MinerU + the layout/paddle-OCR deps its wheel underspecifies (else ModuleNotFoundError at
# parse time -> silent pdftotext fallback). Validated 2026-07-11 on torch 2.13+cu130.
echo "[install_parsers] installing MinerU + pipeline deps (may pull torch)..." | tee -a "$LOG"
uv pip install --python "$PY" mineru torchvision shapely ftfy pyclipper >>"$LOG" 2>&1 \
  && echo "[install_parsers] mineru OK" | tee -a "$LOG" \
  || echo "[install_parsers] mineru FAILED (fallback: pdftotext)" | tee -a "$LOG"

echo "[install_parsers] done $(date -Is)" | tee -a "$LOG"
"$PY" - <<'PYEOF' | tee -a "$LOG"
for m in ("liteparse", "mineru"):
    try:
        __import__(m); print(f"[install_parsers] import {m}: OK")
    except Exception as e:
        print(f"[install_parsers] import {m}: NO ({type(e).__name__})")
PYEOF
