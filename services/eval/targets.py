"""Quatro alvos, uma assinatura.

    rag - gemma      = o que o corpus adiciona
    simvera - rag    = o que a orquestração adiciona
"""
from __future__ import annotations

import os
import re
import time
from typing import TypedDict

import httpx

RAG = os.environ.get("SIMVERA_RAG_URL", "http://127.0.0.1:8099")
GEMMA = os.environ.get("SIMVERA_GEMMA_URL", "http://127.0.0.1:8081/v1")
MEISSA = os.environ.get("SIMVERA_MEISSA_URL", "http://127.0.0.1:8003/v1")
SIMVERA = os.environ.get("SIMVERA_ORCH_URL", "http://127.0.0.1:8100/v1")

# llama.cpp aceita qualquer id se houver um só modelo; paths reais de /v1/models.
GEMMA_MODEL = os.environ.get("SIMVERA_GEMMA_MODEL", "gemma")
MEISSA_MODEL = os.environ.get("SIMVERA_MEISSA_MODEL", "meissa")
SIMVERA_MODEL = os.environ.get("SIMVERA_MODEL_ID", "simvera-triangulo")

TIMEOUT = float(os.environ.get("SIMVERA_EVAL_TIMEOUT", "90"))
RAG_TOP_K = int(os.environ.get("SIMVERA_RAG_TOP_K", "6"))
NO_THINK = {"enable_thinking": False}

_ABSTAIN_MARKERS = (
    "não posso responder sem fonte",
    "nao posso responder sem fonte",
    "evidência não fornece",
    "evidencia nao fornece",
    "corpus não tem evidência",
    "corpus nao tem evidencia",
    "preciso_saber",
)


class Resposta(TypedDict):
    text: str
    latency_s: float
    citations: list[str]
    abstained: bool


def build_prompt(item: dict, forced_choice: bool) -> str:
    parts = [item["question"]]
    if item.get("options"):
        parts += [f"{k}. {v}" for k, v in sorted(item["options"].items())]
    if forced_choice:
        parts.append(
            "Answer with only the letter (A, B, C or D). No explanation."
            if item.get("options")
            else "Answer with only one word: yes, no, or maybe. No explanation."
        )
    return "\n".join(parts)


def _looks_abstained(text: str) -> bool:
    low = (text or "").lower()
    return any(m in low for m in _ABSTAIN_MARKERS)


def _chat(url: str, model: str, prompt: str) -> str:
    with httpx.Client(timeout=TIMEOUT) as c:
        r = c.post(
            f"{url}/chat/completions",
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 512,
                "temperature": 0.0,
                "stream": False,
                "chat_template_kwargs": NO_THINK,
            },
        )
        r.raise_for_status()
        msg = r.json()["choices"][0]["message"]
    return (msg.get("content") or "").strip() or (msg.get("reasoning_content") or "").strip()


def _timed(fn) -> Resposta:
    t0 = time.time()
    text, cites, abst = fn()
    return Resposta(
        text=text,
        latency_s=round(time.time() - t0, 3),
        citations=cites,
        abstained=abst,
    )


def target_gemma(item: dict, *, forced_choice: bool) -> Resposta:
    p = build_prompt(item, forced_choice)
    return _timed(lambda: (_chat(GEMMA, GEMMA_MODEL, p), [], False))


def target_meissa(item: dict, *, forced_choice: bool) -> Resposta:
    p = build_prompt(item, forced_choice)
    return _timed(lambda: (_chat(MEISSA, MEISSA_MODEL, p), [], False))


def target_rag(item: dict, *, forced_choice: bool) -> Resposta:
    def go():
        with httpx.Client(timeout=TIMEOUT) as c:
            r = c.post(
                f"{RAG}/rag/evidence-pack",
                json={"query": item["question"], "top_k": RAG_TOP_K},
            )
            r.raise_for_status()
            pack = r.json()
        chunks = pack.get("chunks") or []
        cites = [ch.get("citation_label", "") for ch in chunks if ch.get("citation_label")]
        if pack.get("abstain") or not chunks:
            return "", cites, True
        ev = "\n\n".join(
            f"[{ch.get('citation_label', '?')}] {ch.get('text', '')}" for ch in chunks
        )
        p = f"EVIDÊNCIA:\n{ev}\n\n---\n\n{build_prompt(item, forced_choice)}"
        return _chat(GEMMA, GEMMA_MODEL, p), cites, False

    return _timed(go)


def target_simvera(item: dict, *, forced_choice: bool) -> Resposta:
    def go():
        payload = {
            "model": SIMVERA_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": build_prompt(item, forced_choice),
                }
            ],
            "stream": False,
            "temperature": 0.0,
            "max_tokens": 64 if forced_choice else 1024,
        }
        # Flag nativa do orquestrador: desliga Meissa + modo consulta e anexa provenance.
        if forced_choice:
            payload["forced_choice"] = True
        with httpx.Client(timeout=TIMEOUT) as c:
            r = c.post(f"{SIMVERA}/chat/completions", json=payload)
            r.raise_for_status()
            body = r.json()
        msg = body["choices"][0]["message"]
        text = (msg.get("content") or "").strip()
        meta = body.get("simvera") or {}
        cites = list(meta.get("citation_labels") or [])
        if not cites:
            cites = re.findall(r"\[([^\]]{3,80})\]", text)
        abst = bool(meta.get("abstained")) or (not text) or _looks_abstained(text)
        return text, cites, abst

    return _timed(go)


TARGETS = {
    "gemma": target_gemma,
    "meissa": target_meissa,
    "rag": target_rag,
    "simvera": target_simvera,
}
