#!/usr/bin/env bash
# Background install of the real retrieval stack into the rag-gateway venv (Phase 2).
# bge-m3 (dense+sparse) via FlagEmbedding, bge-reranker-v2-m3 via onnxruntime (CPU),
# LanceDB for ANN vectors. Degrades gracefully: retrieval logic is tested with fakes.
set -u
cd "$(dirname "$0")/.." || exit 1
PY=.venv/bin/python
mkdir -p data
LOG=data/install_embeddings.log
echo "[install_embeddings] start $(date -Is)" | tee "$LOG"

for pkg in numpy onnxruntime lancedb FlagEmbedding; do
  echo "[install_embeddings] installing $pkg..." | tee -a "$LOG"
  uv pip install --python "$PY" "$pkg" >>"$LOG" 2>&1 \
    && echo "[install_embeddings] $pkg OK" | tee -a "$LOG" \
    || echo "[install_embeddings] $pkg FAILED" | tee -a "$LOG"
done

echo "[install_embeddings] done $(date -Is)" | tee -a "$LOG"
"$PY" - <<'PYEOF' | tee -a "$LOG"
for m in ("numpy", "onnxruntime", "lancedb", "FlagEmbedding"):
    try:
        __import__(m); print(f"[install_embeddings] import {m}: OK")
    except Exception as e:
        print(f"[install_embeddings] import {m}: NO ({type(e).__name__})")
PYEOF
