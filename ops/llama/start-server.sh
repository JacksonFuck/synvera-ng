#!/usr/bin/env bash
# Sobe um dos servidores llama.cpp em container.
#
#   ops/llama/start-server.sh gemma
#   ops/llama/start-server.sh meissa
#
# Um script para os dois porque eles diferem em cinco valores e mais nada. Antes
# o Gemma não tinha script nenhum — o container foi criado à mão, e a receita
# existia só no `docker inspect`.
#
# O binário vem de ~/opt/llama-bin, NÃO de /tmp/llama.cpp: /tmp é tmpfs nesta
# máquina e um reboot apagava o build de 95M, derrubando os dois servidores sem
# deixar rastro de por quê.
set -euo pipefail

BIN=${BIN:-$HOME/opt/llama-bin}
MODELS_DIR=${MODELS_DIR:-$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/../../data/models}
IMAGE=${IMAGE:-nvidia/cuda:12.8.0-devel-ubuntu22.04}
CTX=${CTX:-32768}

case "${1:-}" in
  gemma)
    NAME=gemma4-server; PORT=8081
    MODEL=/models/gemma-4-12b-it-Q6_K.gguf
    MMPROJ=/models/mmproj-BF16.gguf
    ;;
  meissa)
    NAME=meissa-llama; PORT=8003
    # Q8_0 e não Q4_K_M: a quantização é confundidor no critério de validação do
    # harness (reproduzir o número publicado do paper dentro de 5pp). Custa +1,8GB.
    MODEL=/models/Meissa-4B.Q8_0.gguf
    # Projetor de visão. Modelo e mmproj vêm da MESMA conversão (mradermacher) —
    # o GGUF convertido localmente difere em metadado e o projetor pode não casar.
    MMPROJ=/models/Meissa-4B.mmproj-f16.gguf
    ;;
  *)
    echo "uso: $0 {gemma|meissa}" >&2; exit 2 ;;
esac

[ -x "$BIN/llama-server" ] || { echo "ERRO: $BIN/llama-server não existe. Rebuildar o llama.cpp." >&2; exit 1; }
for f in "$MODEL" "$MMPROJ"; do
  [ -f "$MODELS_DIR/$(basename "$f")" ] || { echo "ERRO: $f não encontrado em $MODELS_DIR" >&2; exit 1; }
done

docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" \
  --restart unless-stopped \
  --gpus all \
  -p "${PORT}:8080" \
  -v "$BIN:/app:ro" \
  -v "$MODELS_DIR:/models:ro" \
  -e LD_LIBRARY_PATH=/app \
  --entrypoint /app/llama-server \
  "$IMAGE" \
  --model "$MODEL" --mmproj "$MMPROJ" \
  --n-gpu-layers 99 --flash-attn on --ctx-size "$CTX" \
  --port 8080 --host 0.0.0.0 >/dev/null

echo "subindo $NAME na porta $PORT…"
for _ in $(seq 1 60); do
  if curl -sf -m 2 "http://localhost:${PORT}/v1/models" >/dev/null 2>&1; then
    echo "OK — pronto"; exit 0
  fi
  sleep 2
done
echo "não respondeu em 120s; ver: docker logs $NAME" >&2
exit 1
