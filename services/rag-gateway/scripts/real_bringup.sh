#!/usr/bin/env bash
# 1ª subida REAL: baixa bge-m3 + bge-reranker, embeda um sample real,
# roda o smoke real e mede latência. CPU é o default; GPU é opt-in por env.
set -u
cd "$(dirname "$0")/.." || exit 1
PY=.venv/bin/python
mkdir -p data
LOG=data/real_bringup.log
export RAG_REAL_MODELS=1
: "${RAG_EMBED_DEVICE:=cpu}"
: "${RAG_EMBED_FP16:=0}"
: "${RAG_EMBED_BATCH_SIZE:=12}"
export RAG_EMBED_DEVICE RAG_EMBED_FP16 RAG_EMBED_BATCH_SIZE
if [ "$RAG_EMBED_DEVICE" = "cpu" ]; then
  export CUDA_VISIBLE_DEVICES=""        # CPU: 0 VRAM, sem contenção com os LLMs.
fi
CORPUS="data/real_corpus"
DB="data/real_bringup.db"
rm -f "$DB"
mkdir -p "$CORPUS"

echo "[bringup] start $(date -Is) (embed_device=$RAG_EMBED_DEVICE fp16=$RAG_EMBED_FP16 batch=$RAG_EMBED_BATCH_SIZE)" | tee "$LOG"

# Popula um sample pequeno do corpus real se vazio (5 PDFs digitais).
$PY - "$CORPUS" >>"$LOG" 2>&1 <<'PYEOF'
import glob, os, shutil, sys
dst = sys.argv[1]
if not any(f.lower().endswith(".pdf") for f in os.listdir(dst)):
    pdfs = [p for p in glob.glob("/home/jackson-fuck/fine-tuning-data/**/*.pdf", recursive=True)
            if 150_000 < os.path.getsize(p) < 1_500_000]
    pdfs.sort(key=os.path.getsize)
    for p in pdfs[:5]:
        shutil.copy(p, dst)
    print("[bringup] sample:", os.listdir(dst))
PYEOF

echo "[bringup] seeding (downloads bge-m3 ~2.5GB on first run)..." | tee -a "$LOG"
SECONDS=0
$PY -m raggw.scripts.seed_corpus "$CORPUS" --db "$DB" >>"$LOG" 2>&1
echo "[bringup] seed rc=$? in ${SECONDS}s" | tee -a "$LOG"

$PY -m pytest tests/test_real_models.py >>"$LOG" 2>&1 \
  && echo "[bringup] real smoke OK" | tee -a "$LOG" \
  || echo "[bringup] real smoke FAIL" | tee -a "$LOG"

echo "[bringup] real hybrid search latency:" | tee -a "$LOG"
$PY - >>"$LOG" 2>&1 <<'PYEOF'
import time
from raggw import db, retrieval
from raggw.config import get_settings
from raggw.embedding import BgeM3Embedder
from raggw.reranking import OnnxReranker
conn = db.connect("data/real_bringup.db")
n = conn.execute("SELECT COUNT(*) c FROM document_chunks").fetchone()["c"]
settings = get_settings()
emb = BgeM3Embedder(dim=settings.embed_dim, device=settings.embed_device,
                    use_fp16=settings.embed_use_fp16,
                    batch_size=settings.embed_batch_size)
rr = OnnxReranker()
emb.embed(["warmup"]); rr.rerank("warmup", ["x"])           # carrega modelos
t = time.time()
hits = retrieval.hybrid_search(conn, "tratamento de sepse grave",
                               embedder=emb, reranker=rr, top_k=5)
dt = time.time() - t
print(f"[bringup] chunks={n} | hybrid_search={len(hits)} hits in {dt:.2f}s")
for h in hits[:3]:
    print("  -", round(h.rerank_score, 3), h.citation_label)
PYEOF
echo "[bringup] done $(date -Is)" | tee -a "$LOG"
