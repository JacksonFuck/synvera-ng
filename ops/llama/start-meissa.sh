#!/usr/bin/env bash
# Sobe o Meissa-4B (o do repo Schuture/Meissa) via llama.cpp.
#
# Por que 4B e não o Meissa-Qwen2.5-7B que estava aqui antes: aquele é outro modelo,
# sem relação com o repo, e o chat template dele tem 621 bytes SEM suporte a tools —
# medido: ele alucinava uma resposta clínica em vez de chamar a ferramenta. O Meissa-4B
# é qwen3vl, traz o template agêntico do paper e ocupa ~3.5GB em vez de 8.1GB.
#
# Q8_0 e não Q4_K_M: a quantização é um confundidor no critério de validação do harness
# (reproduzir o número publicado do paper dentro de 5pp). Q8_0 é praticamente sem perda
# contra o F16. Custo: +1,8GB de VRAM. Não é economia — o F16 (8,8GB) é que era grande.
#
# Modelo e mmproj vêm ambos do mradermacher: o GGUF que convertemos aqui difere do deles
# em 416 bytes de metadado, e projetor precisa casar com a conversão do modelo.
#
# Nota: o binário vive em /tmp/llama.cpp (tmpfs) — some no reboot. Rebuildar antes de usar.
set -euo pipefail

NAME=${NAME:-meissa-llama}
PORT=${PORT:-8003}
MODEL=${MODEL:-/models/Meissa-4B.Q8_0.gguf}
# Projetor de visão (clip / qwen3vl_merger). Vazio desliga a visão.
MMPROJ=${MMPROJ:-/models/Meissa-4B.mmproj-f16.gguf}
CTX=${CTX:-32768}
BIN=${BIN:-/tmp/llama.cpp/build/bin}
MODELS_DIR=${MODELS_DIR:-/home/jackson-fuck/models}

[ -x "$BIN/llama-server" ] || { echo "ERRO: $BIN/llama-server não existe (tmpfs limpou?)"; exit 1; }
[ -f "$MODELS_DIR/$(basename "$MODEL")" ] || { echo "ERRO: modelo $MODEL não encontrado"; exit 1; }

MM_ARGS=()
if [ -n "$MMPROJ" ]; then
  [ -f "$MODELS_DIR/$(basename "$MMPROJ")" ] || { echo "ERRO: mmproj $MMPROJ não encontrado"; exit 1; }
  MM_ARGS=(--mmproj "$MMPROJ")
fi

docker rm -f "$NAME" >/dev/null 2>&1 || true

docker run -d --name "$NAME" \
  --gpus all \
  -p "${PORT}:8080" \
  -v "$BIN:/app" \
  -v "$MODELS_DIR:/models" \
  -e LD_LIBRARY_PATH=/app \
  --entrypoint /app/llama-server \
  nvidia/cuda:12.8.0-devel-ubuntu22.04 \
  --model "$MODEL" \
  "${MM_ARGS[@]}" \
  --n-gpu-layers 99 \
  --flash-attn on \
  --ctx-size "$CTX" \
  --port 8080 --host 0.0.0.0

echo "subindo $NAME ($MODEL${MMPROJ:+ + visão}) na porta $PORT…"
for _ in $(seq 1 60); do
  if curl -sf -m 2 "http://localhost:${PORT}/v1/models" >/dev/null 2>&1; then
    echo "OK — pronto"; exit 0
  fi
  sleep 2
done
echo "não respondeu em 120s; ver: docker logs $NAME"
exit 1
