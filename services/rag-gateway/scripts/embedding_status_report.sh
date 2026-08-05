#!/usr/bin/env bash
# Append a compact embedding status report. Intended for cron every 5 minutes.
set -u

DB="${RAG_DB_PATH:-/home/jackson-fuck/Projetos/apppocus-rag-wt/rag-gateway/data/rag_corpus.db}"
SEED_LOG="${RAG_SEED_LOG:-/home/jackson-fuck/Projetos/apppocus-rag-wt/rag-gateway/data/seed_until_done.jsonl}"
SEED_OUT="${RAG_SEED_OUT:-/home/jackson-fuck/Projetos/apppocus-rag-wt/rag-gateway/data/seed_until_done.out}"
STATUS_LOG="${RAG_STATUS_LOG:-/home/jackson-fuck/Projetos/apppocus-rag-wt/rag-gateway/data/embedding_status.log}"
PY="${PY:-/home/jackson-fuck/Projetos/apppocus-rag-wt/rag-gateway/.venv/bin/python}"

mkdir -p "$(dirname "$STATUS_LOG")"

{
  echo "===== $(date -Is) ====="
  echo "db=$DB"
  "$PY" - "$DB" <<'PY'
import sqlite3, sys
db = sys.argv[1]
try:
    conn = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    row = conn.execute("""
        SELECT
          (SELECT COUNT(*) FROM documents) AS docs,
          (SELECT COUNT(*) FROM document_chunks) AS chunks,
          (SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL) AS embeddings,
          (SELECT COUNT(*) FROM document_chunks WHERE embedding IS NULL) AS missing_embeddings,
          (SELECT MIN(length(embedding)) FROM document_chunks WHERE embedding IS NOT NULL) AS min_bytes,
          (SELECT MAX(length(embedding)) FROM document_chunks WHERE embedding IS NOT NULL) AS max_bytes
    """).fetchone()
    print(
        "sqlite "
        f"docs={row['docs']} chunks={row['chunks']} embeddings={row['embeddings']} "
        f"missing_embeddings={row['missing_embeddings']} "
        f"dim_min={None if row['min_bytes'] is None else row['min_bytes']//4} "
        f"dim_max={None if row['max_bytes'] is None else row['max_bytes']//4}"
    )
    cols = {r["name"] for r in conn.execute("PRAGMA table_info(documents)")}
    if "parser" in cols:
        parsers = conn.execute(
            "SELECT COALESCE(parser, '(unknown)') parser, COUNT(*) n "
            "FROM documents GROUP BY COALESCE(parser, '(unknown)') ORDER BY n DESC"
        ).fetchall()
        print("parsers=" + ", ".join(f"{r['parser']}:{r['n']}" for r in parsers))
finally:
    try:
        conn.close()
    except Exception:
        pass
PY
  if [ -s "$SEED_LOG" ]; then
    echo "last_jsonl=$(tail -1 "$SEED_LOG")"
  else
    echo "last_jsonl=<none>"
  fi
  if [ -s "$SEED_OUT" ]; then
    echo "last_out:"
    tail -5 "$SEED_OUT"
  else
    echo "last_out=<none>"
  fi
  echo "processes:"
  pgrep -af "raggw.scripts.seed_until_done|seed_until_done_gpu|BGEM3|FlagEmbedding|rag_corpus.db" || true
  echo "gpu:"
  nvidia-smi --query-gpu=timestamp,name,memory.used,memory.total,utilization.gpu --format=csv,noheader 2>/dev/null || true
  nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv,noheader 2>/dev/null || true
  echo
} >>"$STATUS_LOG" 2>&1
