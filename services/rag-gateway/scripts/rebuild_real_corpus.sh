#!/usr/bin/env bash
# Rebuild the medical knowledge base with real BGE-M3 embeddings.
#
# Default behavior is safe: build a staged SQLite DB + staged LanceDB index.
# The active data/rag_corpus.db is only replaced when --promote is passed.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CORPUS="/home/jackson-fuck/fine-tuning-data"
PROMOTE=0
DRY_RUN=0
MODE="all"
PDF_ONLY=1
INSTALL_SYSTEMD_OVERRIDE=1

usage() {
  cat <<'EOF'
Usage:
  bash rag-gateway/scripts/rebuild_real_corpus.sh [options]

Options:
  --corpus PATH          Corpus root. Default: /home/jackson-fuck/fine-tuning-data
  --mode all|simple-only Parser mode passed to seed_until_done. Default: all
  --all-supported        Include docx/epub/html/md/txt/xlsx/pptx, not only PDFs
  --promote              Replace active data/rag_corpus.db and data/lancedb_corpus after smoke
  --no-systemd-override  Do not install the user-service override on --promote
  --dry-run              Print plan and file counts, do not ingest
  -h, --help             Show this help

Tuning via env:
  RAG_CHUNK_MIN=180
  RAG_CHUNK_MAX=420
  RAG_CHUNK_OVERLAP=60
  RAG_EMBED_DEVICE=cuda
  RAG_EMBED_FP16=1
  RAG_EMBED_BATCH_SIZE=48
  RAG_ENABLE_MINERU=1
  HF_HUB_OFFLINE=1
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --corpus)
      CORPUS="${2:?missing --corpus value}"
      shift 2
      ;;
    --mode)
      MODE="${2:?missing --mode value}"
      shift 2
      ;;
    --all-supported)
      PDF_ONLY=0
      shift
      ;;
    --promote)
      PROMOTE=1
      shift
      ;;
    --no-systemd-override)
      INSTALL_SYSTEMD_OVERRIDE=0
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ "$MODE" != "all" && "$MODE" != "simple-only" ]]; then
  echo "--mode must be all or simple-only" >&2
  exit 2
fi

PY="${PY:-$ROOT/.venv/bin/python}"
if [[ ! -x "$PY" ]]; then
  echo "Python venv not found: $PY" >&2
  echo "Run: UV_CACHE_DIR=/tmp/uv-cache uv sync --project rag-gateway --extra embeddings --extra parsers --extra dev" >&2
  exit 1
fi

if [[ ! -d "$CORPUS" ]]; then
  echo "Corpus directory not found: $CORPUS" >&2
  exit 1
fi

TS="$(date +%Y%m%d-%H%M%S)"
DATA_DIR="$ROOT/data"
BACKUP_DIR="$DATA_DIR/backups"
STAGE_DB="$DATA_DIR/rag_corpus.real-$TS.db"
STAGE_LANCE="$DATA_DIR/lancedb_corpus.real-$TS"
STAGE_MARKDOWN="$DATA_DIR/parsed_markdown.real-$TS"
LOG="$DATA_DIR/rebuild_real_corpus-$TS.jsonl"
OUT="$DATA_DIR/rebuild_real_corpus-$TS.out"
ACTIVE_DB="$DATA_DIR/rag_corpus.db"
ACTIVE_LANCE="$DATA_DIR/lancedb_corpus"

mkdir -p "$DATA_DIR" "$BACKUP_DIR"

export PYTHONPATH="$ROOT${PYTHONPATH:+:$PYTHONPATH}"
export RAG_REAL_MODELS=1
export RAG_VECTOR_STORE=lancedb
export RAG_DB_PATH="$STAGE_DB"
export RAG_LANCEDB_URI="$STAGE_LANCE"
export RAG_MARKDOWN_DIR="$STAGE_MARKDOWN"
export RAG_CHUNK_MIN="${RAG_CHUNK_MIN:-180}"
export RAG_CHUNK_MAX="${RAG_CHUNK_MAX:-420}"
export RAG_CHUNK_OVERLAP="${RAG_CHUNK_OVERLAP:-60}"
export RAG_EMBED_DEVICE="${RAG_EMBED_DEVICE:-cuda}"
export RAG_EMBED_FP16="${RAG_EMBED_FP16:-1}"
export RAG_EMBED_BATCH_SIZE="${RAG_EMBED_BATCH_SIZE:-48}"
export RAG_ENABLE_MINERU="${RAG_ENABLE_MINERU:-1}"
export HF_HUB_OFFLINE="${HF_HUB_OFFLINE:-1}"
export TRANSFORMERS_OFFLINE="${TRANSFORMERS_OFFLINE:-$HF_HUB_OFFLINE}"

if [[ "$RAG_EMBED_DEVICE" == "cpu" ]]; then
  export CUDA_VISIBLE_DEVICES=""
fi

echo "[rebuild] corpus=$CORPUS"
echo "[rebuild] stage_db=$STAGE_DB"
echo "[rebuild] stage_lancedb=$STAGE_LANCE"
echo "[rebuild] chunks min=$RAG_CHUNK_MIN max=$RAG_CHUNK_MAX overlap=$RAG_CHUNK_OVERLAP"
echo "[rebuild] embed device=$RAG_EMBED_DEVICE fp16=$RAG_EMBED_FP16 batch=$RAG_EMBED_BATCH_SIZE offline=$HF_HUB_OFFLINE"

set +e
DEPS_OUTPUT="$("$PY" - <<'PY'
import importlib
mods = ["FlagEmbedding", "lancedb", "onnxruntime", "optimum.onnxruntime"]
missing = []
for mod in mods:
    try:
        importlib.import_module(mod)
    except Exception as exc:
        missing.append(f"{mod}: {type(exc).__name__}: {exc}")
if missing:
    raise SystemExit("Missing embedding dependencies:\n" + "\n".join(missing))
print("[rebuild] embedding dependencies OK")
PY
)"
DEPS_RC=$?
set -e
if [[ "$DEPS_RC" -ne 0 ]]; then
  echo "$DEPS_OUTPUT" >&2
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[rebuild] dry-run warning: install missing deps before rebuild:" >&2
    echo "  UV_CACHE_DIR=/tmp/uv-cache uv sync --project rag-gateway --extra embeddings --extra parsers --extra dev" >&2
  else
    exit "$DEPS_RC"
  fi
else
  echo "$DEPS_OUTPUT"
fi

"$PY" - "$CORPUS" "$PDF_ONLY" <<'PY'
from pathlib import Path
import sys
root = Path(sys.argv[1])
pdf_only = sys.argv[2] == "1"
exts = {".pdf"} if pdf_only else {".pdf", ".md", ".txt", ".html", ".htm", ".docx", ".epub", ".xlsx", ".pptx"}
files = [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in exts]
size = sum(p.stat().st_size for p in files)
print(f"[rebuild] discovered files={len(files)} size_gb={size / 1024**3:.2f} pdf_only={pdf_only}")
if not files:
    raise SystemExit("No supported files found in corpus")
PY

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[rebuild] dry-run complete; no DB was written"
  exit 0
fi

rm -f "$STAGE_DB" "$STAGE_DB-shm" "$STAGE_DB-wal"
rm -rf "$STAGE_LANCE" "$STAGE_MARKDOWN"
mkdir -p "$STAGE_LANCE" "$STAGE_MARKDOWN"

SEED_ARGS=("$CORPUS" --db "$STAGE_DB" --log "$LOG" --mode "$MODE")
if [[ "$PDF_ONLY" -eq 0 ]]; then
  SEED_ARGS+=(--all-supported)
fi

echo "[rebuild] ingest start $(date -Is)" | tee "$OUT"
SECONDS=0
"$PY" -m raggw.scripts.seed_until_done "${SEED_ARGS[@]}" >>"$OUT" 2>&1
echo "[rebuild] ingest done in ${SECONDS}s" | tee -a "$OUT"

echo "[rebuild] smoke start" | tee -a "$OUT"
# ponytail: smoke logic now lives in raggw/scripts/smoke.py (importable + unit-tested
# with fakes, see tests/test_smoke.py). RAG_DB_PATH is already exported to $STAGE_DB
# above, so this smoke-tests the staged DB, same as the old inline heredoc did.
"$PY" -m raggw.scripts.smoke | tee -a "$OUT"

if [[ "$PROMOTE" -ne 1 ]]; then
  echo "[rebuild] staged rebuild finished. Active DB not changed."
  echo "[rebuild] rerun with --promote when you want to rebuild and replace the active corpus."
  exit 0
fi

echo "[rebuild] promoting staged corpus"
systemctl --user stop apppocus-rag-gateway.service || true

if [[ -e "$ACTIVE_DB" ]]; then
  mv "$ACTIVE_DB" "$BACKUP_DIR/rag_corpus.$TS.db"
fi
if [[ -e "$ACTIVE_DB-shm" ]]; then
  mv "$ACTIVE_DB-shm" "$BACKUP_DIR/rag_corpus.$TS.db-shm"
fi
if [[ -e "$ACTIVE_DB-wal" ]]; then
  mv "$ACTIVE_DB-wal" "$BACKUP_DIR/rag_corpus.$TS.db-wal"
fi
if [[ -e "$ACTIVE_LANCE" ]]; then
  mv "$ACTIVE_LANCE" "$BACKUP_DIR/lancedb_corpus.$TS"
fi

mv "$STAGE_DB" "$ACTIVE_DB"
mv "$STAGE_LANCE" "$ACTIVE_LANCE"

# Registry bookkeeping (raggw/generations.py): the physical file swap above is still
# the source of truth; this just records the promotion in index_generations so the
# lifecycle (staged -> active -> superseded/rolled_back) is queryable and reversible
# without re-running the mv dance. ponytail: corpus_source_hash/embedder_config left
# unset for now — add when a caller actually needs to diff generations by config.
GENERATION_ID="real-$TS"
"$PY" - "$ACTIVE_DB" "$GENERATION_ID" <<'PY'
import sys
from raggw import db
from raggw.generations import promote, register_generation

db_path, generation_id = sys.argv[1], sys.argv[2]
conn = db.connect(db_path)
try:
    register_generation(conn, generation_id, db_path=db_path)
    promote(conn, generation_id)
finally:
    conn.close()
print(f"[rebuild] generation {generation_id} registered + promoted")
PY

if [[ "$INSTALL_SYSTEMD_OVERRIDE" -eq 1 ]]; then
  UNIT_DIR="$HOME/.config/systemd/user/apppocus-rag-gateway.service.d"
  mkdir -p "$UNIT_DIR"
  cat >"$UNIT_DIR/override.conf" <<EOF
[Service]
Environment=
Environment=RAG_REAL_MODELS=1
ExecStart=
ExecStart=/usr/bin/bash -lc 'set -a; . ./.env; set +a; export RAG_REAL_MODELS=1; exec .venv/bin/python -m uvicorn raggw.api:app --host "\$RAG_HOST" --port "\$RAG_PORT"'
EOF
  systemctl --user daemon-reload
fi

systemctl --user start apppocus-rag-gateway.service
sleep 5
curl -sS http://127.0.0.1:8099/health
echo
echo "[rebuild] promotion complete"
