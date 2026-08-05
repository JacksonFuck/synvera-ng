#!/usr/bin/env bash
# DISK GUARD: abort if >85%
[ $(df / | awk NR==2{print } | tr -d %) -ge 85 ] && echo DISK FULL — aborting seed && exit 1
# Liteparse-only corpus seed. Skips complex PDFs so MinerU can handle them separately.
set -u

export RAG_SEED_MODE=simple-only
export RAG_ENABLE_MINERU=0
export RAG_EMBED_BATCH_SIZE="${RAG_EMBED_BATCH_SIZE:-12}"
export RAG_SEED_LOG="${RAG_SEED_LOG:-/home/jackson-fuck/Projetos/Apppocus-2.0/rag-gateway/data/seed_liteparse_only.jsonl}"
export RAG_SEED_OUT="${RAG_SEED_OUT:-/home/jackson-fuck/Projetos/Apppocus-2.0/rag-gateway/data/seed_liteparse_only.out}"

exec /home/jackson-fuck/Projetos/Apppocus-2.0/rag-gateway/scripts/seed_until_done_gpu.sh
