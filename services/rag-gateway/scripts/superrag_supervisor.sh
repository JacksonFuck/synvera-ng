#!/usr/bin/env bash
# superrag_supervisor.sh — supervisor resiliente para a re-ingestão do SuperRAG.
#
# Diferenças vs ingest_supervisor.sh:
#   1. ADOTA um run já em andamento do rebuild_real_corpus.sh (--run TS) em vez
#      de sempre lançar o próprio child; se o seed morrer (CUDA OOM, segfault,
#      OOM-killer), relança resumindo no MESMO staged DB (skip por content_hash).
#   2. Testa a cada heartbeat se TODOS os bancos estão sendo alimentados:
#      SQLite (docs/chunks/embedded) + LanceDB (tabela "chunks") + markdown dir.
#      Detecta STALL (sem crescimento por N heartbeats) e reinicia o seed.
#   3. VRAM guard: se a VRAM livre cair abaixo do piso e houver processos de
#      inferência concorrentes (vllm/medgemma/qwen), derruba-os (autorizado).
#
# Uso:
#   bash rag-gateway/scripts/superrag_supervisor.sh --run 20260712-085456
#   (sem --run: usa o staged rag_corpus.real-*.db mais recente)
set -Euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RUN_TS=""
CORPUS="/home/jackson-fuck/fine-tuning-data"
HEARTBEAT="${HEARTBEAT:-120}"          # s entre checagens
STALL_LIMIT="${STALL_LIMIT:-8}"        # heartbeats sem crescimento => restart child
MIN_FREE_GB="${MIN_FREE_GB:-12}"       # piso de disco
VRAM_MIN_FREE_MB="${VRAM_MIN_FREE_MB:-1500}"   # piso de VRAM livre
VRAM_KILL_PATTERN="${VRAM_KILL_PATTERN:-vllm|medgemma|MedGemma|qwen|llama-server|ollama}"
MAX_RESTARTS="${MAX_RESTARTS:-50}"
BACKOFF="${BACKOFF:-30}"
MODE="${MODE:-all}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --run) RUN_TS="${2:?}"; shift 2;;
    --corpus) CORPUS="${2:?}"; shift 2;;
    --heartbeat) HEARTBEAT="${2:?}"; shift 2;;
    --stall-limit) STALL_LIMIT="${2:?}"; shift 2;;
    --min-free-gb) MIN_FREE_GB="${2:?}"; shift 2;;
    --vram-min-free-mb) VRAM_MIN_FREE_MB="${2:?}"; shift 2;;
    -h|--help) grep '^#' "$0" | head -20; exit 0;;
    *) echo "unknown option: $1" >&2; exit 2;;
  esac
done

DATA_DIR="$ROOT/data"
PY="${PY:-$ROOT/.venv/bin/python}"
[[ -x "$PY" ]] || { echo "venv python not found: $PY" >&2; exit 1; }

# ---- resolve run (adota o mais recente se --run omitido) ---------------------
if [[ -z "$RUN_TS" ]]; then
  latest="$(ls -1t "$DATA_DIR"/rag_corpus.real-*.db 2>/dev/null | head -1 || true)"
  [[ -n "$latest" ]] || { echo "nenhum staged rag_corpus.real-*.db encontrado" >&2; exit 1; }
  RUN_TS="$(basename "$latest" | sed -E 's/^rag_corpus\.real-(.+)\.db$/\1/')"
fi
STAGE_DB="$DATA_DIR/rag_corpus.real-$RUN_TS.db"
STAGE_LANCE="$DATA_DIR/lancedb_corpus.real-$RUN_TS"
STAGE_MD="$DATA_DIR/parsed_markdown.real-$RUN_TS"
LOG="$DATA_DIR/rebuild_real_corpus-$RUN_TS.jsonl"
OUT="$DATA_DIR/rebuild_real_corpus-$RUN_TS.out"
SUP="$DATA_DIR/superrag_supervisor-$RUN_TS.log"
[[ -e "$STAGE_DB" ]] || { echo "staged DB não existe: $STAGE_DB" >&2; exit 1; }

log_sup() { echo "[$(date -Is)] $*" | tee -a "$SUP"; }
free_gb() { df -PBG "$DATA_DIR" | awk 'NR==2{gsub(/G/,"",$4); print $4}'; }

# ---- env p/ relaunch (espelha rebuild_real_corpus.sh) ------------------------
export PYTHONPATH="$ROOT${PYTHONPATH:+:$PYTHONPATH}"
export RAG_REAL_MODELS=1
export RAG_VECTOR_STORE=lancedb
export RAG_DB_PATH="$STAGE_DB"
export RAG_LANCEDB_URI="$STAGE_LANCE"
export RAG_MARKDOWN_DIR="$STAGE_MD"
export RAG_CHUNK_MIN="${RAG_CHUNK_MIN:-180}"
export RAG_CHUNK_MAX="${RAG_CHUNK_MAX:-420}"
export RAG_CHUNK_OVERLAP="${RAG_CHUNK_OVERLAP:-60}"
export RAG_EMBED_DEVICE="${RAG_EMBED_DEVICE:-cuda}"
export RAG_EMBED_FP16="${RAG_EMBED_FP16:-1}"
export RAG_EMBED_BATCH_SIZE="${RAG_EMBED_BATCH_SIZE:-48}"
export RAG_ENABLE_MINERU="${RAG_ENABLE_MINERU:-1}"
export HF_HUB_OFFLINE="${HF_HUB_OFFLINE:-1}"
export TRANSFORMERS_OFFLINE="${TRANSFORMERS_OFFLINE:-$HF_HUB_OFFLINE}"

# ---- descoberta de PIDs ------------------------------------------------------
find_seed() { pgrep -f "raggw\.scripts\.seed_until_done.*$RUN_TS" | head -1 || true; }
find_rebuild() { pgrep -f "rebuild_real_corpus\.sh" | head -1 || true; }

# ---- snapshot multi-store: SQLite + LanceDB + markdown -----------------------
# stdout: linha "COUNTS docs=X chunks=Y emb=Z lance=W md=V" p/ stall-detection
snapshot() {
  "$PY" - "$STAGE_DB" "$STAGE_LANCE" "$STAGE_MD" <<'PY' 2>/dev/null || echo "COUNTS docs=0 chunks=0 emb=0 lance=0 md=0 (snapshot indisponível)"
import os, sqlite3, sys
db, lance_uri, md_dir = sys.argv[1], sys.argv[2], sys.argv[3]
docs = ch = emb = 0
try:
    c = sqlite3.connect(f"file:{db}?mode=ro", uri=True, timeout=5)
    docs = c.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    ch = c.execute("SELECT COUNT(*) FROM document_chunks").fetchone()[0]
    emb = c.execute("SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL").fetchone()[0]
    c.close()
except Exception:
    pass
lance = 0
try:
    import lancedb
    t = lancedb.connect(lance_uri).open_table("chunks")
    lance = t.count_rows()
except Exception:
    pass
md = 0
try:
    md = sum(1 for _ in os.scandir(md_dir))
except Exception:
    pass
print(f"COUNTS docs={docs} chunks={ch} emb={emb} lance={lance} md={md}")
# alertas de divergência entre bancos (LanceDB deve acompanhar os embeddings)
if emb and lance == 0:
    print("ALERT lancedb vazio com embeddings no sqlite — vector store NÃO está sendo alimentado")
elif emb and lance < emb * 0.5:
    print(f"WARN lancedb ({lance}) muito atrás dos embeddings sqlite ({emb})")
PY
}

# ---- VRAM guard --------------------------------------------------------------
vram_guard() {
  command -v nvidia-smi >/dev/null 2>&1 || return 0
  local free_mb
  free_mb="$(nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits 2>/dev/null | head -1 || echo "")"
  [[ -n "$free_mb" ]] || return 0
  log_sup "vram free=${free_mb}MiB (piso=${VRAM_MIN_FREE_MB}MiB)"
  if (( free_mb < VRAM_MIN_FREE_MB )); then
    local seed_pid; seed_pid="$(find_seed)"
    # lista processos de GPU e derruba os que casam com o padrão (nunca o seed)
    nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv,noheader,nounits 2>/dev/null | \
    while IFS=', ' read -r gpid gname gmem; do
      [[ -n "$gpid" && "$gpid" != "$seed_pid" ]] || continue
      cmdline="$(tr '\0' ' ' < "/proc/$gpid/cmdline" 2>/dev/null || echo "$gname")"
      if echo "$cmdline" | grep -qiE "$VRAM_KILL_PATTERN"; then
        log_sup "VRAM GUARD: derrubando pid=$gpid (${gmem}MiB) cmd=${cmdline:0:120}"
        kill -TERM "$gpid" 2>/dev/null || true
        sleep 5
        kill -0 "$gpid" 2>/dev/null && kill -KILL "$gpid" 2>/dev/null || true
      else
        log_sup "VRAM GUARD: pid=$gpid (${gmem}MiB) não casa com padrão — mantido"
      fi
    done
  fi
}

# ---- relaunch do seed (resume por content_hash) ------------------------------
CHILD=""
launch_seed() {
  log_sup "relançando seed_until_done (resume) db=$STAGE_DB"
  "$PY" -m raggw.scripts.seed_until_done "$CORPUS" \
      --db "$STAGE_DB" --log "$LOG" --mode "$MODE" >>"$OUT" 2>&1 &
  CHILD=$!
  log_sup "novo seed pid=$CHILD"
}

cleanup() {
  log_sup "sinal recebido — encerrando supervisor (child preservado se adotado; próprio child recebe INT)"
  [[ -n "$CHILD" ]] && kill -INT "$CHILD" 2>/dev/null || true
  exit 130
}
trap cleanup INT TERM

log_sup "=== superrag_supervisor start run=$RUN_TS heartbeat=${HEARTBEAT}s stall_limit=$STALL_LIMIT vram_floor=${VRAM_MIN_FREE_MB}MiB ==="
log_sup "db=$STAGE_DB"
log_sup "lance=$STAGE_LANCE"

restarts=0
last_chunks=-1
stall=0

while :; do
  # 1) garante um seed vivo: adota o existente ou relança
  seed_pid="$(find_seed)"
  if [[ -z "$seed_pid" ]]; then
    rebuild_pid="$(find_rebuild)"
    if [[ -n "$rebuild_pid" ]]; then
      # rebuild pai vivo mas seed ausente: fase pós-ingest (smoke/promote) — só observa
      log_sup "seed ausente mas rebuild_real_corpus.sh (pid=$rebuild_pid) vivo — fase pós-ingestão, observando"
    else
      # checa se o scan terminou (última linha do OUT) antes de relançar
      if tail -5 "$OUT" 2>/dev/null | grep -q "ingest done\|full corpus scan complete"; then
        log_sup "ingestão concluída — supervisor encerra o loop de resiliência"
        break
      fi
      restarts=$((restarts + 1))
      if (( restarts > MAX_RESTARTS )); then
        log_sup "max restarts ($MAX_RESTARTS) — desistindo; inspecione $OUT"
        exit 4
      fi
      fg="$(free_gb)"
      if (( fg < MIN_FREE_GB )); then
        log_sup "DISK GUARD: free=${fg}G < ${MIN_FREE_GB}G — não relançando"
        exit 3
      fi
      log_sup "seed morto (restart $restarts/$MAX_RESTARTS) — backoff ${BACKOFF}s"
      sleep "$BACKOFF"
      vram_guard
      launch_seed
      seed_pid="$CHILD"
    fi
  fi

  # 2) heartbeat: multi-store + stall + disco + vram
  snap="$(snapshot)"
  echo "$snap" | while read -r line; do log_sup "  $line"; done
  chunks_now="$(echo "$snap" | grep -oP 'chunks=\K[0-9]+' | head -1 || echo 0)"
  if [[ -n "$seed_pid" ]]; then
    if [[ "$chunks_now" == "$last_chunks" ]]; then
      stall=$((stall + 1))
      log_sup "  sem crescimento ($stall/$STALL_LIMIT heartbeats)"
      if (( stall >= STALL_LIMIT )); then
        log_sup "STALL detectado — reiniciando seed pid=$seed_pid"
        kill -INT "$seed_pid" 2>/dev/null || true
        sleep 10
        kill -0 "$seed_pid" 2>/dev/null && kill -KILL "$seed_pid" 2>/dev/null || true
        stall=0
      fi
    else
      stall=0
    fi
  fi
  last_chunks="$chunks_now"

  fg="$(free_gb)"
  if (( fg < MIN_FREE_GB )); then
    log_sup "DISK GUARD (mid-run): free=${fg}G — parando seed limpo"
    [[ -n "$seed_pid" ]] && kill -INT "$seed_pid" 2>/dev/null || true
    exit 3
  fi
  vram_guard

  sleep "$HEARTBEAT" &
  wait $! 2>/dev/null || true
done

log_sup "DONE. staged db=$STAGE_DB lance=$STAGE_LANCE"
snapshot | while read -r line; do log_sup "  $line"; done
log_sup "Próximo passo: smoke + promote via rebuild_real_corpus.sh --promote (ou promoção manual dos staged paths)"
