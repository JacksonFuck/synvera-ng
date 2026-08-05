#!/usr/bin/env bash
# DISK GUARD: abort if >85%
[ $(df / | awk NR==2{print } | tr -d %) -ge 85 ] && echo DISK FULL — aborting seed && exit 1
# Resilient full-corpus seed. Keeps restarting the scanner until it exits cleanly.
set -u

cd "$(dirname "$0")/.." || exit 1

PY="${PY:-/home/jackson-fuck/Projetos/Apppocus-2.0/rag-gateway/.venv/bin/python}"
CORPUS="${CORPUS:-/home/jackson-fuck/fine-tuning-data}"
DB="${RAG_DB_PATH:-/home/jackson-fuck/Projetos/Apppocus-2.0/rag-gateway/data/rag_corpus.db}"
LOG="${RAG_SEED_LOG:-/home/jackson-fuck/Projetos/Apppocus-2.0/rag-gateway/data/seed_until_done.jsonl}"
OUT="${RAG_SEED_OUT:-/home/jackson-fuck/Projetos/Apppocus-2.0/rag-gateway/data/seed_until_done.out}"
MARKDOWN_DIR="${RAG_MARKDOWN_DIR:-/home/jackson-fuck/Projetos/Apppocus-2.0/rag-gateway/data/parsed_markdown}"
TMPDIR="${TMPDIR:-/home/jackson-fuck/Projetos/Apppocus-2.0/rag-gateway/data/tmp}"
SEED_MODE="${RAG_SEED_MODE:-all}"

export PYTHONPATH="/home/jackson-fuck/Projetos/Apppocus-2.0/rag-gateway${PYTHONPATH:+:$PYTHONPATH}"
export HF_HUB_OFFLINE="${HF_HUB_OFFLINE:-1}"
export TRANSFORMERS_OFFLINE="${TRANSFORMERS_OFFLINE:-1}"
export RAG_REAL_MODELS="${RAG_REAL_MODELS:-1}"
export RAG_EMBED_DEVICE="${RAG_EMBED_DEVICE:-cuda}"
export RAG_EMBED_FP16="${RAG_EMBED_FP16:-1}"
export RAG_EMBED_BATCH_SIZE="${RAG_EMBED_BATCH_SIZE:-48}"
export RAG_ENABLE_MINERU="${RAG_ENABLE_MINERU:-1}"
export RAG_DB_PATH="$DB"
export RAG_MARKDOWN_DIR="$MARKDOWN_DIR"
export TMPDIR

mkdir -p "$(dirname "$LOG")" "$(dirname "$OUT")" "$MARKDOWN_DIR" "$TMPDIR"

echo "[seed-wrapper] start $(date -Is) corpus=$CORPUS db=$DB log=$LOG markdown_dir=$MARKDOWN_DIR tmpdir=$TMPDIR mineru=$RAG_ENABLE_MINERU mode=$SEED_MODE" >>"$OUT"

while true; do
  "$PY" -m raggw.scripts.seed_until_done "$CORPUS" --db "$DB" --log "$LOG" --mode "$SEED_MODE" >>"$OUT" 2>&1
  rc=$?
  echo "[seed-wrapper] exit rc=$rc at $(date -Is)" >>"$OUT"
  if [ "$rc" -eq 0 ]; then
    break
  fi
  sleep 30
done

echo "[seed-wrapper] done $(date -Is)" >>"$OUT"
