"""SimVera — orquestrador do triângulo Gemma-4 ↔ Super-RAG ↔ Meissa.

Expõe uma API OpenAI-compatible para o LibreChat enxergar como "mais um modelo".
O LibreChat não tem hook de injeção de contexto pré-request contra corpus externo
(o RAG_API_URL dele é upload por usuário, não corpus global), então a orquestração
mora aqui e o LibreChat fica vanilla.

Fluxo por pergunta:
      ┌── /rag/evidence-pack ──────────────┐
user ─┤                                    ├─► Gemma-4 consolida ─► stream
      └── Meissa-4B (com rag_search tool) ─┘

As duas pernas correm em paralelo (asyncio.gather). Meissa roda seu próprio loop
agêntico e consulta o RAG por conta própria — é o especialista; o evidence-pack
direto é a âncora que não depende de o Meissa ter feito a busca certa.

REGRA DURA: nenhuma resposta clínica sai sem chunks do RAG. Se o RAG cair ou
abster, o shim recusa — nunca deixa o Gemma responder de memória. Isso não é
paranoia: medido aqui, um modelo sem tool-calling alucinou conduta em sepse
quando a ferramenta não estava disponível.
"""
from __future__ import annotations

import json
import logging
import os
import re
import time
import uuid
from typing import Any

import httpx
from fastapi import FastAPI
from fastapi.responses import JSONResponse, StreamingResponse

log = logging.getLogger("simvera")
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"),
                    format="%(asctime)s %(levelname)s %(message)s")

RAG_URL = os.environ.get("SIMVERA_RAG_URL", "http://127.0.0.1:8099")
GEMMA_URL = os.environ.get("SIMVERA_GEMMA_URL", "http://127.0.0.1:8081/v1")
MEISSA_URL = os.environ.get("SIMVERA_MEISSA_URL", "http://127.0.0.1:8003/v1")

MODEL_ID = os.environ.get("SIMVERA_MODEL_ID", "simvera-triangulo")
RAG_TOP_K = int(os.environ.get("SIMVERA_RAG_TOP_K", "6"))
RAG_TIMEOUT = float(os.environ.get("SIMVERA_RAG_TIMEOUT", "20"))
MEISSA_TIMEOUT = float(os.environ.get("SIMVERA_MEISSA_TIMEOUT", "25"))
MEISSA_TOOL_ROUNDS = int(os.environ.get("SIMVERA_MEISSA_TOOL_ROUNDS", "1"))
# Orçamento total da perna do Meissa. O contrato de latência é do sistema, não do
# Meissa: passou disso, a resposta sai com a evidência e sem o parecer.
MEISSA_DEADLINE = float(os.environ.get("SIMVERA_MEISSA_DEADLINE", "7"))
GEMMA_TIMEOUT = float(os.environ.get("SIMVERA_GEMMA_TIMEOUT", "180"))
MIN_GEMMA_TOKENS = int(os.environ.get("SIMVERA_MIN_GEMMA_TOKENS", "3072"))
# Botão de calibração latência↔profundidade. Ligar volta o raciocínio do Gemma
# (+~20s de TTFT). Vale testar em perguntas de raciocínio clínico complexo.
GEMMA_THINKING = os.environ.get("SIMVERA_GEMMA_THINKING", "0").lower() in ("1", "true", "yes")

RAG_TOOL = [{
    "type": "function",
    "function": {
        "name": "rag_search",
        "description": "Busca evidência clínica no corpus médico local (livros-texto, "
                       "diretrizes). Use SEMPRE antes de afirmar qualquer conduta.",
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "consulta clínica"}},
            "required": ["query"],
        },
    },
}]

SYSTEM_CONSOLIDACAO = """Você é o SimVera, assistente clínico para profissionais de saúde.

Você recebe: (a) EVIDÊNCIA recuperada do corpus local e (b) o PARECER de um modelo \
especialista médico. Sua resposta deve ser fundamentada na EVIDÊNCIA.

Regras:
- Toda afirmação clínica deve vir da EVIDÊNCIA. Cite a fonte entre colchetes usando o \
rótulo dado, ex.: [Knobel — SIRS — p. 291–292].
- O PARECER do especialista é insumo, não fonte. Se ele afirmar algo que a EVIDÊNCIA não \
sustenta, não repita — ou diga explicitamente que não há suporte no corpus.
- Se a EVIDÊNCIA não cobrir parte da pergunta, diga o que falta em vez de completar de memória.
- Não invente doses, valores ou referências. Público é médico: seja direto e técnico.

Consulta — antes de recomendar conduta, avalie se o caso tem informação suficiente:
- Faltando dado ESSENCIAL para a decisão (idade, tempo de evolução, sinais vitais, \
comorbidades, medicações em uso), NÃO recomende. Responda apenas com a linha \
`PRECISO_SABER:` seguida de até 3 perguntas objetivas, uma por linha começando com `- `.
- Pergunta conceitual, sem paciente concreto, NÃO exige esses dados: responda normalmente.
- Perguntar não é o mesmo que responder sem fonte. Na dúvida entre perguntar e supor, pergunte.
"""

# Teto de rodadas de pergunta. Sem teto vira interrogatório: o modelo sempre acha que
# poderia saber mais. Atingido o teto, ele responde com o que tem e declara o que ficou
# sem saber. Medido: o Gemma-12B julga suficiência bem (3-4 acertos em 4 casos); o
# Meissa-4B não (1 em 4 — ecoava o literal "<pergunta 1>" do template).
MAX_PERGUNTAS = int(os.environ.get("SIMVERA_MAX_PERGUNTAS", "2"))
_PERGUNTA_MARK = "PRECISO_SABER"

SEM_MAIS_PERGUNTAS = (
    "\n\nVocê já pediu informação nesta conversa o número máximo de vezes. "
    "NÃO peça mais. Responda agora com a evidência disponível e declare explicitamente "
    "quais dados faltaram e como isso limita a recomendação."
)


def _rodadas_de_pergunta(messages: list[dict]) -> int:
    """Quantas vezes já pedimos informação nesta conversa.

    O estado vive no histórico, não no servidor: o cliente OpenAI-compatible já manda
    a conversa inteira a cada turno, então não há sessão para guardar nem expirar.
    """
    return sum(1 for m in messages
               if m.get("role") == "assistant" and _PERGUNTA_MARK in _text_of(m.get("content"))[:200])

app = FastAPI(title="SimVera Orchestrator")
_client: httpx.AsyncClient | None = None


@app.on_event("startup")
async def _startup() -> None:
    global _client
    _client = httpx.AsyncClient(timeout=httpx.Timeout(GEMMA_TIMEOUT))


@app.on_event("shutdown")
async def _shutdown() -> None:
    if _client:
        await _client.aclose()


# ── helpers ──────────────────────────────────────────────────────────────────

def _text_of(content: Any) -> str:
    """Texto de um `content` OpenAI, que pode ser str ou lista de partes multimodais."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(p.get("text", "") for p in content
                        if isinstance(p, dict) and p.get("type") == "text").strip()
    return ""


_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)


def strip_think(text: str) -> str:
    """Remove blocos de raciocínio. Gemma-4 e Meissa-4B são reasoning models e emitem
    <think>…</think>; o Meissa às vezes devolve SÓ isso, o que equivale a sem parecer."""
    return _THINK_RE.sub("", text or "").strip()


def _last_user_text(messages: list[dict]) -> str:
    for m in reversed(messages):
        if m.get("role") == "user":
            return _text_of(m.get("content"))
    return ""


def _has_image(messages: list[dict]) -> bool:
    for m in messages:
        c = m.get("content")
        if isinstance(c, list) and any(
                isinstance(p, dict) and p.get("type") in ("image_url", "input_image") for p in c):
            return True
    return False


async def rag_evidence(query: str) -> dict:
    """Âncora obrigatória. Levanta exceção se o RAG não responder — o caller trata."""
    r = await _client.post(f"{RAG_URL}/rag/evidence-pack",
                           json={"query": query, "top_k": RAG_TOP_K},
                           timeout=RAG_TIMEOUT)
    r.raise_for_status()
    return r.json()


async def rag_search_tool(query: str) -> str:
    """O que o Meissa recebe de volta quando chama rag_search."""
    try:
        r = await _client.post(f"{RAG_URL}/rag/search",
                               json={"query": query, "top_k": RAG_TOP_K},
                               timeout=RAG_TIMEOUT)
        r.raise_for_status()
        hits = r.json().get("hits", [])
    except Exception as exc:
        return f"ERRO na busca: {exc}"
    if not hits:
        return "Nenhuma evidência encontrada no corpus."
    return "\n\n".join(
        f"[{h.get('citation_label', '?')}]\n{h.get('chunk_text', '')}" for h in hits)


async def meissa_opinion(messages: list[dict]) -> str | None:
    """Meissa-4B com rag_search exposto como tool, loop agêntico limitado.

    Retorna None em qualquer falha: o parecer é ENRIQUECIMENTO. A âncora é o
    evidence-pack; perder o Meissa degrada a resposta, não a invalida.
    """
    convo = [{"role": "system",
              "content": "Você é um especialista médico. Use rag_search para fundamentar "
                         "sua análise no corpus antes de concluir. Seja conciso e técnico."}]
    for m in messages:
        if m.get("role") in ("user", "assistant"):
            txt = _text_of(m.get("content"))
            if txt:
                convo.append({"role": m["role"], "content": txt})

    for _ in range(MEISSA_TOOL_ROUNDS + 1):
        r = await _client.post(f"{MEISSA_URL}/chat/completions",
                               json={"model": "meissa", "messages": convo, "tools": RAG_TOOL,
                                     "tool_choice": "auto", "max_tokens": 900, "stream": False},
                               timeout=MEISSA_TIMEOUT)
        r.raise_for_status()
        msg = (r.json().get("choices") or [{}])[0].get("message", {})
        calls = msg.get("tool_calls")
        if not calls:
            # Meissa costuma responder "<think></think>" sem conteúdo útil depois da tool;
            # nesse caso não há parecer, e seguir só com a evidência é o certo.
            return strip_think(msg.get("content") or "") or None
        convo.append(msg)
        for call in calls:
            fn = call.get("function", {})
            try:
                q = json.loads(fn.get("arguments") or "{}").get("query", "")
            except json.JSONDecodeError:
                q = ""
            convo.append({"role": "tool", "tool_call_id": call.get("id", ""),
                          "content": await rag_search_tool(q) if q else "query vazia"})
    # Estourou as rodadas ainda pedindo ferramenta: sem parecer utilizável.
    return None


def build_context(pack: dict, parecer: str | None) -> str:
    blocos = []
    for c in pack.get("chunks", []):
        pages = ""
        if c.get("page_start"):
            pages = f" (p. {c['page_start']}" + (
                f"–{c['page_end']}" if c.get("page_end") and c["page_end"] != c["page_start"] else "") + ")"
        blocos.append(f"[{c.get('citation_label', '?')}]{pages}\n{c.get('text', '')}")
    ctx = "=== EVIDÊNCIA DO CORPUS ===\n\n" + "\n\n---\n\n".join(blocos)
    if parecer:
        ctx += ("\n\n=== PARECER DO ESPECIALISTA (Meissa) ===\n"
                "Insumo, não fonte. Só repita o que a EVIDÊNCIA acima sustentar.\n\n" + parecer)
    else:
        ctx += ("\n\n=== PARECER DO ESPECIALISTA ===\n"
                "(indisponível nesta resposta — responda apenas com base na EVIDÊNCIA)")
    return ctx


def _sse(chunk: dict) -> bytes:
    return b"data: " + json.dumps(chunk, ensure_ascii=False).encode() + b"\n\n"


def _msg_chunk(cid: str, content: str, finish: str | None = None) -> dict:
    return {"id": cid, "object": "chat.completion.chunk", "created": int(time.time()),
            "model": MODEL_ID,
            "choices": [{"index": 0, "delta": {"content": content} if content else {},
                         "finish_reason": finish}]}


def _refusal_text(motivo: str) -> str:
    return (f"⚠️ **Não posso responder sem fonte.**\n\n{motivo}\n\n"
            "O SimVera é ancorado no corpus clínico local — responder de memória seria "
            "exatamente o modo de falha que este sistema existe para evitar. "
            "Reformule a pergunta ou verifique o serviço de RAG.")


# ── endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict:
    out: dict[str, Any] = {"status": "ok", "model": MODEL_ID}
    for name, url in (("rag", f"{RAG_URL}/health"),
                      ("gemma", f"{GEMMA_URL}/models"),
                      ("meissa", f"{MEISSA_URL}/models")):
        try:
            r = await _client.get(url, timeout=10)
            out[name] = "ok" if r.status_code == 200 else f"http {r.status_code}"
        except Exception as exc:
            out[name] = f"erro: {type(exc).__name__}"
    return out


@app.get("/v1/models")
async def models() -> dict:
    return {"object": "list",
            "data": [{"id": MODEL_ID, "object": "model", "owned_by": "simvera"}]}


@app.post("/v1/chat/completions")
async def chat(body: dict) -> Any:
    messages = body.get("messages") or []
    stream = bool(body.get("stream"))
    query = _last_user_text(messages)
    cid = f"chatcmpl-{uuid.uuid4().hex[:24]}"
    t0 = time.time()

    if not query:
        # Sem texto (ex.: só imagem): o RAG não tem o que buscar. Deixa o Gemma
        # descrever a imagem, mas sem qualquer alegação clínica ancorada.
        if _has_image(messages):
            return await _forward_gemma(messages, body, stream, cid, system=(
                "Descreva objetivamente a imagem. NÃO faça diagnóstico nem recomende conduta: "
                "esta resposta não foi ancorada no corpus clínico."))
        return JSONResponse({"error": {"message": "mensagem vazia"}}, status_code=400)

    # As duas pernas em paralelo.
    import asyncio
    pack_task = asyncio.create_task(rag_evidence(query))
    # Prazo no parecer, não só no erro: o loop agêntico do Meissa é a perna longa
    # (medido 7-16s, contra ~2s do evidence-pack, porque as duas disputam o RAG).
    # Estourou o prazo → responde com a evidência, que é a âncora de qualquer forma.
    meissa_task = asyncio.create_task(
        asyncio.wait_for(meissa_opinion(messages), timeout=MEISSA_DEADLINE))
    results = await asyncio.gather(pack_task, meissa_task, return_exceptions=True)
    pack, parecer = results[0], results[1]

    if isinstance(parecer, asyncio.TimeoutError):
        log.warning("Meissa estourou %.0fs — seguindo só com evidência", MEISSA_DEADLINE)
        parecer = None
    elif isinstance(parecer, BaseException):
        log.warning("Meissa falhou (%s) — seguindo só com evidência", type(parecer).__name__)
        parecer = None

    # Âncora ausente ou fraca → recusa. Nunca cai para o Gemma sozinho.
    if isinstance(pack, BaseException):
        log.error("RAG indisponível: %r", pack)
        return _emit(_refusal_text(
            f"O serviço de RAG não respondeu (`{type(pack).__name__}`)."), stream, cid)
    if pack.get("abstain") or not pack.get("chunks"):
        log.info("RAG absteve para %r", query[:80])
        return _emit(_refusal_text(
            "O corpus não tem evidência suficiente para sustentar uma resposta a esta pergunta."),
            stream, cid)

    log.info("query=%r rag=%d chunks conf=%.3f meissa=%s t=%.2fs",
             query[:60], len(pack["chunks"]), pack.get("confidence_precheck", 0),
             "ok" if parecer else "off", time.time() - t0)

    # Modo consulta: o sistema pergunta em vez de supor. As perguntas do Gemma SÃO a
    # resposta daquele turno — o usuário responde e o histórico carrega o estado. Não há
    # classificador nem máquina de estados aqui de propósito: o julgamento de suficiência
    # pertence ao consolidador, que já vê evidência, parecer e conversa inteira.
    system = SYSTEM_CONSOLIDACAO
    rodadas = _rodadas_de_pergunta(messages)
    if rodadas >= MAX_PERGUNTAS:
        system += SEM_MAIS_PERGUNTAS
        log.info("teto de %d perguntas atingido — respondendo com o que há", MAX_PERGUNTAS)

    enriched = [{"role": "system", "content": system},
                *[m for m in messages if m.get("role") != "system"],
                {"role": "user", "content": build_context(pack, parecer)}]
    return await _forward_gemma(enriched, body, stream, cid)


def _emit(text: str, stream: bool, cid: str) -> Any:
    """Resposta local (recusa) nos dois formatos."""
    if not stream:
        return JSONResponse({
            "id": cid, "object": "chat.completion", "created": int(time.time()),
            "model": MODEL_ID,
            "choices": [{"index": 0, "message": {"role": "assistant", "content": text},
                         "finish_reason": "stop"}]})

    async def gen():
        yield _sse(_msg_chunk(cid, text))
        yield _sse(_msg_chunk(cid, "", finish="stop"))
        yield b"data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


async def _forward_gemma(messages: list[dict], body: dict, stream: bool,
                         cid: str, system: str | None = None) -> Any:
    if system:
        messages = [{"role": "system", "content": system},
                    *[m for m in messages if m.get("role") != "system"]]
    # Piso alto de propósito: o Gemma-4 raciocina antes de responder e o pensamento
    # consome o mesmo orçamento. Medido: com max_tokens=700 ele gastou tudo em
    # reasoning_content e devolveu content vazio (finish_reason=length).
    payload = {"model": "gemma", "messages": messages, "stream": stream,
               "max_tokens": max(int(body.get("max_tokens") or 0), MIN_GEMMA_TOKENS),
               "temperature": body.get("temperature", 0.3)}
    if not GEMMA_THINKING:
        # Medido: com thinking ligado o Gemma gasta ~20s raciocinando ANTES do primeiro
        # token visível (TTFT 27s no fluxo completo). Desligado, TTFT cai para ~0.2s com
        # o mesmo conteúdo — a evidência já vem pronta do RAG, então o raciocínio longo
        # estava reprocessando o que o rerank já resolveu.
        # (reasoning_budget=0 NÃO funciona neste build; só chat_template_kwargs.)
        payload["chat_template_kwargs"] = {"enable_thinking": False}

    if not stream:
        r = await _client.post(f"{GEMMA_URL}/chat/completions", json=payload,
                               timeout=GEMMA_TIMEOUT)
        r.raise_for_status()
        out = r.json()
        out["model"] = MODEL_ID
        choice = (out.get("choices") or [{}])[0]
        msg = choice.get("message", {})
        if not (msg.get("content") or "").strip():
            # Estourou o orçamento raciocinando: entrega o raciocínio em vez de nada,
            # marcado como truncado — silêncio seria pior num contexto clínico.
            think = strip_think(msg.get("reasoning_content") or "")
            msg["content"] = (
                f"{think}\n\n⚠️ _Resposta truncada (limite de tokens atingido durante o "
                f"raciocínio). Reformule ou aumente max_tokens._" if think
                else "⚠️ O modelo não produziu resposta. Tente reformular a pergunta.")
            choice["message"] = msg
        return JSONResponse(out)

    async def gen():
        emitted = False
        thinking: list[str] = []
        try:
            async with _client.stream("POST", f"{GEMMA_URL}/chat/completions",
                                      json=payload, timeout=GEMMA_TIMEOUT) as r:
                r.raise_for_status()
                async for line in r.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data.strip() == "[DONE]":
                        break
                    try:
                        obj = json.loads(data)
                    except json.JSONDecodeError:
                        continue
                    delta = (obj.get("choices") or [{}])[0].get("delta", {}) or {}
                    if delta.get("reasoning_content"):
                        # Raciocínio não vai pro usuário, mas é guardado como rede de
                        # segurança caso o orçamento acabe antes de sair conteúdo.
                        thinking.append(delta["reasoning_content"])
                    if delta.get("content"):
                        emitted = True
                    obj["model"] = MODEL_ID
                    yield _sse(obj)
        except Exception as exc:  # falha no meio do stream: avisa, não cala
            log.error("stream do Gemma quebrou: %r", exc)
            yield _sse(_msg_chunk(cid, f"\n\n⚠️ falha na geração: {type(exc).__name__}"))
        if not emitted:
            # Tudo virou raciocínio: entregar tela em branco num assistente clínico é
            # pior do que entregar o raciocínio marcado como truncado.
            think = strip_think("".join(thinking))
            yield _sse(_msg_chunk(cid, (
                f"{think}\n\n⚠️ _Resposta truncada (o modelo gastou o orçamento de tokens "
                f"raciocinando)._" if think
                else "⚠️ O modelo não produziu resposta. Tente reformular a pergunta.")))
            yield _sse(_msg_chunk(cid, "", finish="stop"))
        yield b"data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")
