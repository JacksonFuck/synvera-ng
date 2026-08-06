"""LLM de indexação GraphRAG: **somente Gemma-4 local**.

Política do projeto (2026-08-06): qualquer etapa de indexação/extração que precise
de LLM usa o servidor local em SIMVERA_GEMMA_URL (default http://127.0.0.1:8081/v1).
Proibido apontar para Anthropic, OpenAI cloud ou outros providers neste módulo.

Uso futuro: candidatos de triplas OpenIE offline, perfis de entidade, etc.
A Fase 1 (typed_edges a partir do TS) é determinística e **não** chama este módulo.
"""
from __future__ import annotations

import json
import os
import re
from typing import Any

import httpx

# Único endpoint permitido para indexação LLM.
GEMMA_URL = os.environ.get("SIMVERA_GEMMA_URL", "http://127.0.0.1:8081/v1").rstrip("/")
GEMMA_MODEL = os.environ.get("SIMVERA_GEMMA_MODEL", "gemma")
TIMEOUT = float(os.environ.get("SIMVERA_GRAPH_INDEX_TIMEOUT", "120"))
NO_THINK = {"enable_thinking": False}

_FORBIDDEN = re.compile(
    r"api\.anthropic|openai\.com|api\.openai|generativelanguage\.googleapis|"
    r"openrouter\.ai|together\.xyz",
    re.I,
)


def _assert_local_only(url: str) -> None:
    if _FORBIDDEN.search(url):
        raise RuntimeError(
            f"Indexação GraphRAG só pode usar Gemma-4 local; URL proibida: {url}"
        )
    # Preferir loopback; permitir host da rede local se o usuário configurar,
    # mas recusar hosts públicos óbvios de API cloud.
    if "anthropic" in url.lower() or "openai" in url.lower():
        raise RuntimeError(f"Indexação GraphRAG: provider cloud bloqueado ({url})")


def gemma_chat(
    messages: list[dict[str, str]],
    *,
    max_tokens: int = 1024,
    temperature: float = 0.0,
    url: str | None = None,
) -> str:
    """Chat completion no Gemma-4 local (OpenAI-compatible)."""
    base = (url or GEMMA_URL).rstrip("/")
    _assert_local_only(base)
    payload: dict[str, Any] = {
        "model": GEMMA_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
        "chat_template_kwargs": NO_THINK,
    }
    with httpx.Client(timeout=TIMEOUT) as client:
        r = client.post(f"{base}/chat/completions", json=payload)
        r.raise_for_status()
        body = r.json()
    msg = (body.get("choices") or [{}])[0].get("message") or {}
    text = (msg.get("content") or "").strip()
    if not text:
        text = (msg.get("reasoning_content") or "").strip()
    return text


def extract_relation_candidates(
    chunk_text: str,
    entity_a: str,
    entity_b: str,
    *,
    allowed_rels: tuple[str, ...] = (
        "trata", "tratado_por", "dd", "interage", "contraindicado",
    ),
) -> list[dict[str, str]]:
    """Candidatos de relação entre duas entidades já linkadas no chunk.

    Retorno é **candidato** — deve passar por gate (schema + revisão) antes
    de entrar no grafo de produção. Nunca confiar cegamente no LLM.
    """
    rel_list = ", ".join(allowed_rels)
    prompt = (
        "Você extrai relações clínicas ESTRUTURADAS de um trecho de corpus.\n"
        f"Entidades: A={entity_a!r}  B={entity_b!r}\n"
        f"Relações permitidas (apenas estas): {rel_list}\n"
        "Responda SOMENTE com um JSON array de objetos "
        '{"source":"A|B id ou label","predicate":"...","target":"..."}.\n'
        "Se não houver relação clara, responda [].\n"
        "Não invente doses nem fatos fora do trecho.\n\n"
        f"<trecho>\n{chunk_text[:3000]}\n</trecho>"
    )
    raw = gemma_chat([{"role": "user", "content": prompt}], max_tokens=512)
    # extrai primeiro array JSON
    m = re.search(r"\[.*\]", raw, re.S)
    if not m:
        return []
    try:
        data = json.loads(m.group(0))
    except json.JSONDecodeError:
        return []
    out = []
    for item in data if isinstance(data, list) else []:
        if not isinstance(item, dict):
            continue
        pred = str(item.get("predicate") or "").strip()
        if pred not in allowed_rels:
            continue
        src = str(item.get("source") or "").strip()
        tgt = str(item.get("target") or "").strip()
        if src and tgt and src != tgt:
            out.append({"source": src, "predicate": pred, "target": tgt})
    return out
