#!/usr/bin/env bash
# Resilient supervisor for RAG corpus ingestion.
#
# seed_until_done already survives per-file errors and is incremental (skips by
# content_hash, so a re-run resumes). This wrapper adds the three things it does
# NOT do on its own for a multi-hour, GPU-heavy, ~7k-file ingestion:
#   1. restart on PROCESS death (CUDA OOM / segfault / OOM-killer) with backoff
#   2. heartbeat every N seconds (default 600 = 10 min): progress snapshot
#   3. disk guard: stop cleanly BEFORE ENOSPC corrupts the DB, never mid-write
#
# Content-only: files are picked by extension (--exts), never by folder name.
# Safe to Ctrl-C and re-run — it resumes into the same staged DB.
set -Euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ---- defaults ---------------------------------------------------------------
CORPUS="/home/jackson-fuck/fine-tuning-data"
EXTS="pdf,md,docx"
HEARTBEAT="${HEARTBEAT:-600}"      # seconds between progress snapshots (10 min)
MIN_FREE_GB="${MIN_FREE_GB:-12}"   # stop cleanly if free disk drops below this
MAX_RESTARTS="${MAX_RESTARTS:-50}"
BACKOFF="${BACKOFF:-30}"           # seconds to wait before a restart
DB="${DB:-}"                        # required: staged SQLite path
LANCE="${LANCE:-}"                  # required: matching LanceDB dir
MODE="${MODE:-all}"

usage() {
  cat <<EOF
Usage: bash rag-gateway/scripts/ingest_supervisor.sh --db PATH --lance DIR [opts]
  --corpus PATH     corpus root (default: $CORPUS)
  --exts LIST       comma exts, content-only (default: $EXTS)
  --db PATH         staged SQLite DB (required) — resumes if it exists
  --lance DIR       matching LanceDB dir (required)
  --heartbeat SEC   progress snapshot interval (default: $HEARTBEAT)
  --min-free-gb N   disk floor; stop clean below it (default: $MIN_FREE_GB)
  --max-restarts N  crash-restart cap (default: $MAX_RESTARTS)
  --mode all|simple-only
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --corpus) CORPUS="${2:?}"; shift 2;;
    --exts) EXTS="${2:?}"; shift 2;;
    --db) DB="${2:?}"; shift 2;;
    --lance) LANCE="${2:?}"; shift 2;;
    --heartbeat) HEARTBEAT="${2:?}"; shift 2;;
    --min-free-gb) MIN_FREE_GB="${2:?}"; shift 2;;
    --max-restarts) MAX_RESTARTS="${2:?}"; shift 2;;
    --mode) MODE="${2:?}"; shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2;;
  esac
done

[[ -n "$DB" && -n "$LANCE" ]] || { echo "--db and --lance are required" >&2; usage >&2; exit 2; }
[[ -d "$CORPUS" ]] || { echo "corpus not found: $CORPUS" >&2; exit 1; }

PY="${PY:-$ROOT/.venv/bin/python}"
[[ -x "$PY" ]] || { echo "venv python not found: $PY" >&2; exit 1; }

# ---- env: real bge-m3 + LanceDB, mirrors rebuild_real_corpus.sh -------------
TS="$(date +%Y%m%d-%H%M%S)"
DATA_DIR="$ROOT/data"
LOG="$DATA_DIR/ingest_supervisor-$TS.jsonl"   # seed_until_done JSONL (per file)
OUT="$DATA_DIR/ingest_supervisor-$TS.out"     # seed_until_done stdout
SUP="$DATA_DIR/ingest_supervisor-$TS.log"     # this supervisor's heartbeat log
mkdir -p "$DATA_DIR" "$LANCE" "$DB.markdown" 2>/dev/null || true

export PYTHONPATH="$ROOT${PYTHONPATH:+:$PYTHONPATH}"
export RAG_REAL_MODELS=1
export RAG_VECTOR_STORE=lancedb
export RAG_DB_PATH="$DB"
export RAG_LANCEDB_URI="$LANCE"
export RAG_MARKDOWN_DIR="${RAG_MARKDOWN_DIR:-$DB.markdown}"
export RAG_CHUNK_MIN="${RAG_CHUNK_MIN:-180}"
export RAG_CHUNK_MAX="${RAG_CHUNK_MAX:-420}"
export RAG_CHUNK_OVERLAP="${RAG_CHUNK_OVERLAP:-60}"
export RAG_EMBED_DEVICE="${RAG_EMBED_DEVICE:-cuda}"
export RAG_EMBED_FP16="${RAG_EMBED_FP16:-1}"
export RAG_EMBED_BATCH_SIZE="${RAG_EMBED_BATCH_SIZE:-48}"
export RAG_ENABLE_MINERU="${RAG_ENABLE_MINERU:-1}"
export HF_HUB_OFFLINE="${HF_HUB_OFFLINE:-1}"
export TRANSFORMERS_OFFLINE="${TRANSFORMERS_OFFLINE:-$HF_HUB_OFFLINE}"

log_sup() { echo "[$(date -Is)] $*" | tee -a "$SUP"; }

free_gb() { df -PBG "$DATA_DIR" | awk 'NR==2{gsub(/G/,"",$4); print $4}'; }

# Read-only progress snapshot from the staged DB (WAL allows concurrent readers).
snapshot() {
  "$PY" - "$DB" "$LOG" <<'PY' 2>/dev/null || echo "  (snapshot unavailable yet)"
import json, os, sqlite3, sys
db, log = sys.argv[1], sys.argv[2]
try:
    c = sqlite3.connect(f"file:{db}?mode=ro", uri=True, timeout=5)
    docs = c.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    ch = c.execute("SELECT COUNT(*) FROM document_chunks").fetchone()[0]
    emb = c.execute("SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL").fetchone()[0]
    c.close()
    print(f"  db: docs={docs} chunks={ch} embedded={emb}")
except Exception as e:
    print(f"  db: not readable yet ({type(e).__name__})")
# last progress line from the seed JSONL
try:
    last = None
    with open(log, encoding="utf-8") as f:
        for line in f:
            last = line
    if last:
        e = json.loads(last)
        keys = ("event", "i", "total", "ingested", "skipped", "failed", "chunks")
        print("  seed: " + " ".join(f"{k}={e[k]}" for k in keys if k in e))
except Exception:
    pass
PY
}

CHILD=""
cleanup() {
  log_sup "signal received -> stopping child cleanly (SIGINT closes the DB)"
  [[ -n "$CHILD" ]] && kill -INT "$CHILD" 2>/dev/null || true
  [[ -n "$CHILD" ]] && wait "$CHILD" 2>/dev/null || true
  exit 130
}
trap cleanup INT TERM

log_sup "supervisor start corpus=$CORPUS exts=$EXTS db=$DB lance=$LANCE"
log_sup "heartbeat=${HEARTBEAT}s min_free=${MIN_FREE_GB}G free_now=$(free_gb)G"

attempt=0
while :; do
  # --- disk guard BEFORE launching -----------------------------------------
  fg="$(free_gb)"
  if (( fg < MIN_FREE_GB )); then
    log_sup "DISK GUARD: free=${fg}G < ${MIN_FREE_GB}G — stopping. Free space and re-run (it resumes)."
    exit 3
  fi

  attempt=$((attempt + 1))
  if (( attempt > MAX_RESTARTS )); then
    log_sup "max restarts ($MAX_RESTARTS) reached — giving up. Inspect $OUT"
    exit 4
  fi
  log_sup "=== ingest attempt $attempt (free=${fg}G) ==="

  "$PY" -m raggw.scripts.seed_until_done "$CORPUS" \
      --db "$DB" --log "$LOG" --exts "$EXTS" --mode "$MODE" >>"$OUT" 2>&1 &
  CHILD=$!

  # --- monitor: heartbeat + mid-run disk guard -----------------------------
  while kill -0 "$CHILD" 2>/dev/null; do
    fg="$(free_gb)"
    log_sup "heartbeat attempt=$attempt pid=$CHILD free=${fg}G"
    snapshot | tee -a "$SUP"
    if (( fg < MIN_FREE_GB )); then
      log_sup "DISK GUARD (mid-run): free=${fg}G < ${MIN_FREE_GB}G — stopping child cleanly."
      kill -INT "$CHILD" 2>/dev/null || true
      wait "$CHILD" 2>/dev/null || true
      exit 3
    fi
    # sleep in the background so a signal interrupts the wait promptly
    sleep "$HEARTBEAT" &
    wait $! 2>/dev/null || true
  done

  wait "$CHILD"; rc=$?
  CHILD=""
  if (( rc == 0 )); then
    log_sup "=== seed_until_done exited 0 — full corpus scan complete ==="
    break
  fi
  log_sup "child died rc=$rc — backoff ${BACKOFF}s then resume (skip-by-hash)"
  sleep "$BACKOFF"
done

# ---- graph is a mandatory recall signal (#320): derive from the seeded chunks.
# Idempotent (built from chunks), never citable, never an LLM call. Isolated so a
# graph failure does not undo the committed ingestion.
log_sup "building graph index (mandatory recall signal)"
"$PY" - "$DB" <<'PY' 2>&1 | tee -a "$SUP" || log_sup "graph build FAILED (ingestion is safe; rebuild later)"
import sys
from raggw import db
from raggw.graph.store import build_graph_index
conn = db.open_db(sys.argv[1])
try:
    print("  graph:", build_graph_index(conn))
finally:
    conn.close()
PY

log_sup "DONE. staged db=$DB lance=$LANCE"
log_sup "Promote when ready:  bash rag-gateway/scripts/rebuild_real_corpus.sh --promote  (or wire the staged paths in)"
snapshot | tee -a "$SUP"
