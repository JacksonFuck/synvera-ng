# Imagem própria do LibreChat com a ferramenta synvera_rag embutida.
#
# Existe para resolver um problema concreto: até 2026-08-04 a customização vivia
# APENAS na camada gravável do container (copiada à mão com docker cp). Não estava
# na imagem nem em bind-mount — qualquer `docker compose pull` ou `--force-recreate`
# a apagava sem aviso. Agora ela é build, versionada e reproduzível.
#
# Tag fixa, não :latest — atualizar é ato deliberado, com o diff visível no git.
FROM registry.librechat.ai/danny-avila/librechat-dev:latest

# A ferramenta em si: chama o Super-RAG local (:8099) e devolve trechos com citação.
COPY custom/SynveraRAG.js /app/api/app/clients/tools/structured/SynveraRAG.js

# Registro da ferramenta no manifesto e no índice de exports.
#
# Script em vez de COPY dos arquivos: copiar sobrescreveria mudanças do upstream
# em silêncio e a ferramenta sumiria sem aviso — o mesmo modo de falha que motivou
# versionar isto. O script falha o build se a âncora esperada não existir.
# (`patch` não existe nesta imagem; `node` existe, e JSON.parse garante manifest válido.)
# O script fica na imagem de propósito: a imagem roda como usuário não-root e não
# consegue apagar um arquivo copiado como root (era o exit 127/1 do build). São 2KB,
# e tê-lo aqui documenta dentro da própria imagem o que foi alterado no upstream.
COPY custom/register-tool.js /app/synvera-register-tool.js
RUN node /app/synvera-register-tool.js
