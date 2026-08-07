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

import asyncio
import json
import logging
import os
import re
import time
import uuid
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI
from fastapi.responses import JSONResponse, StreamingResponse

log = logging.getLogger("simvera")

_CODIGO = Path(__file__).resolve()


def _code_mtime() -> float:
    """mtime do módulo do serviço.

    Este processo é o que motivou a issue #35: rodou 3h com código anterior ao merge
    da Fase 2 e devolveu `graph_triples` vazio o tempo todo. Não deu erro, não deu log,
    não deu teste vermelho — só uma lista vazia indistinguível de "não há triplas".
    """
    return _CODIGO.stat().st_mtime


_CODE_MTIME_BOOT = _code_mtime()


def _code_status() -> dict:
    """`stale=True` significa: reinicie o serviço, ele não é o código que você lê."""
    disco = _code_mtime()
    return {
        "loaded_mtime": round(_CODE_MTIME_BOOT, 3),
        "disk_mtime": round(disco, 3),
        "stale": disco > _CODE_MTIME_BOOT,
    }
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

Você recebe: (a) EVIDÊNCIA recuperada do corpus local, (b) opcionalmente GRAFO CLÍNICO \
(triplas tipadas com fonte no corpus) e (c) o PARECER de um modelo especialista médico. \
Sua resposta deve ser fundamentada na EVIDÊNCIA (e no grafo só com as citações dele).

Regras:
- Toda afirmação clínica deve vir da EVIDÊNCIA. Cite a fonte entre colchetes usando o \
rótulo dado, ex.: [Knobel — SIRS — p. 291–292].
- O GRAFO CLÍNICO lista relações tipadas (trata, dd, interage…) com citation no corpus: \
use para hops multi-relacionais; não invente triplas nem trate o grafo como parecer.
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

# Harness / MedQA: escolha forçada. Produção NÃO usa isto. Desliga modo consulta e
# Meissa (que disputa o RAG e estoura timeout sob carga). Só consolida com evidência.
SYSTEM_FORCED_CHOICE = """Você é o SimVera em modo avaliação (escolha forçada).

Você recebe EVIDÊNCIA do corpus local. Responda à pergunta de múltipla escolha \
usando APENAS essa evidência quando possível.

Regras:
- Responda com UMA letra (A, B, C ou D) ou yes/no/maybe conforme o enunciado.
- Sem raciocínio longo, sem PRECISO_SABER, sem pedir mais dados, sem recusar com prosa.
- Se a evidência for fraca, ainda assim escolha a alternativa mais suportada e \
responda só com a letra/palavra.
- Formato: uma linha com a resposta, ex.: `Answer: B`
"""

# Teto de rodadas de pergunta. Sem teto vira interrogatório: o modelo sempre acha que
# poderia saber mais. Atingido o teto, ele responde com o que tem e declara o que ficou
# sem saber. Medido: o Gemma-12B julga suficiência bem (3-4 acertos em 4 casos); o
# Meissa-4B não (1 em 4 — ecoava o literal "<pergunta 1>" do template).
#
# 2026-08-06: o prompt sozinho NÃO bastou. Com evidence-pack rico o Gemma despeja
# protocolo em "Paciente com dor torácica, o que faço?" (medido: 3,5k chars, zero
# pergunta ao usuário). O gate determinístico abaixo corta ANTES do RAG/Gemma.
MAX_PERGUNTAS = int(os.environ.get("SIMVERA_MAX_PERGUNTAS", "2"))
_PERGUNTA_MARK = "PRECISO_SABER"

SEM_MAIS_PERGUNTAS = (
    "\n\nVocê já pediu informação nesta conversa o número máximo de vezes. "
    "NÃO peça mais. Responda agora com a evidência disponível e declare explicitamente "
    "quais dados faltaram e como isso limita a recomendação."
)

# ── modo consulta (determinístico) ───────────────────────────────────────────
# Vinheta / pedido de conduta sobre um caso. Conceitual puro NÃO entra.
# Paciente concreto na conversa. Basta isto para ser vinheta.
_PACIENTE_RE = re.compile(
    r"\b(paciente|doente|caso\s+cl[ií]nico|senhor[a]?|crian[cç]a|"
    r"homem|mulher|lactente|neonato)\b",
    re.IGNORECASE,
)
# Fraseado de pedido de conduta. Sozinho NÃO decide — ver _e_vinheta().
_CONDUTA_RE = re.compile(
    r"o que\s+(fa[cç]o|fazer)\b|qual\s+(a\s+)?conduta\b|"
    r"como\s+(manejar|conduzir|abordar|tratar)\s+(este|esse|esta|o\s+paciente)|"
    r"manejo\s+(inicial|deste|desse|desta)\b",
    re.IGNORECASE,
)
# O mesmo fraseado amarrado a um TEMA por preposição ("conduta NA cetoacidose").
# Tema no lugar de paciente = pergunta de conhecimento.
_CONDUTA_SOBRE_TEMA_RE = re.compile(
    r"(o que\s+fa[cç]o|o que\s+fazer|"
    r"qual\s+(?:[oa]\s+)?(?:conduta|manejo)(?:\s+inicial)?|"
    r"manejo\s+inicial|"
    r"como\s+(?:manejar|conduzir|abordar|tratar))"
    r"\s+(?:n[oa]s?|d[oa]s?|em|para|com)\s+\w",
    re.IGNORECASE,
)
# Pergunta de conhecimento (escore, dose, definição) — responde sem interrogar.
_CONCEPTUAL_RE = re.compile(
    r"\b(crit[eé]rios?|escore|score|defini[cç][aã]o|fisiopatolog|"
    r"o que\s+[eé]\b|quais\s+s[aã]o\b|dose\s+(de|da|do)\b|"
    r"protocolo\s+(da|de|do)\b|classifica[cç][aã]o|diferen[cç]a\s+entre|"
    r"mecanismo\b|indica[cç][oõ]es?\b|contraindica)\b",
    re.IGNORECASE,
)
# Slots essenciais para não inventar conduta (humano no loop / CFM alto).
_SLOT_IDADE = re.compile(
    r"\b(\d{1,3}\s*anos?|\d{1,3}\s*a\b|idade|neonato|rec[eé]m[-\s]?nascido|"
    r"lactente|idos[oa]|adolescente|gestante)\b",
    re.IGNORECASE,
)
_SLOT_TEMPO = re.compile(
    r"\b(h[aá]\s+\d|\d+\s*h(?:oras?)?|\d+\s*dias?|\d+\s*semanas?|"
    r"in[ií]cio|evolu[cç][aã]o|s[uú]bit[oa]|agud[oa]|cr[oô]nic[oa]|"
    r"minutos?|desde\s+ontem|hoje\s+de\s+manh[aã])\b",
    re.IGNORECASE,
)
_SLOT_VITAIS = re.compile(
    r"\b(PA|P\.?A\.?|press[aã]o\s+arterial|FC\b|F\.?C\.?|freq(?:u[eê]ncia)?\s*card|"
    r"SpO\s*2|satura|temperatura|febril|afebril|hipotens|taquicard|FR\b|"
    r"bpm|mmHg|glasgow|HEMODIN|est[aá]vel|inst[aá]vel)\b",
    re.IGNORECASE,
)
_SLOT_CONTEXTO = re.compile(
    r"\b(HAS|hipertens|DM\b|diabet|asma|DPOC|IRC|ICC|comorbidad|antecedente|"
    r"hist[oó]ria\s+(de|pr[eé]via)|IAM|TEP|TVP|tabag|medica[cç][oõ]es?\s+em\s+uso|"
    r"usa\s+\w+|alerg)\b",
    re.IGNORECASE,
)

_SLOT_QUESTIONS = (
    ("idade", _SLOT_IDADE,
     "Qual a idade (e sexo) do paciente?"),
    ("tempo", _SLOT_TEMPO,
     "Há quanto tempo e como começou o quadro (súbito ou gradual)?"),
    ("vitais", _SLOT_VITAIS,
     "Quais os sinais vitais (PA, FC, FR, SpO₂, temperatura) e o estado geral?"),
    ("contexto", _SLOT_CONTEXTO,
     "Há comorbidades, medicações em uso ou antecedentes relevantes?"),
)


def _user_blob(messages: list[dict]) -> str:
    """Todo o texto do usuário na conversa (slots podem vir em turnos anteriores)."""
    return " ".join(
        _text_of(m.get("content")) for m in messages if m.get("role") == "user"
    ).strip()


def _slots_present(text: str) -> dict[str, bool]:
    return {name: bool(rx.search(text or "")) for name, rx, _ in _SLOT_QUESTIONS}


def _e_vinheta(blob: str, last: str) -> bool:
    """Há um paciente concreto na conversa, ou só um tema clínico?

    Substantivo de paciente basta, venha de qualquer turno. Fraseado de conduta
    também conta — "O que faço?" sem contexto merece pergunta — mas **não** quando a
    pergunta atual o amarra a um tema: "Qual a conduta na cetoacidose diabética
    grave?" é pergunta sobre uma doença, e pedir a idade de ninguém é ruído (#37).

    Não use "algum slot preenchido" como sinal de vinheta: nomes de doença casam os
    regexes de slot ("cetoacidose **diabét**ica" preenche contexto), e o bug volta.

    Errar para o lado de perguntar é barato. Errar para o outro remove o humano no
    loop que o risco CFM alto exige — na dúvida, interrogar.
    """
    if _PACIENTE_RE.search(blob):
        return True
    return bool(_CONDUTA_RE.search(blob)) and not _CONDUTA_SOBRE_TEMA_RE.search(last)


def _perguntas_faltantes(messages: list[dict]) -> list[str] | None:
    """Se o caso é vinheta incompleta, devolve até 3 perguntas; senão None.

    Determinístico de propósito: o Gemma, com evidence-pack na mão, prefere
    protocolizar a perguntar (medido). Perguntar NÃO é resposta clínica — não
    exige âncora de corpus e reforça humano no loop (CFM alto).
    """
    last = _last_user_text(messages)
    blob = _user_blob(messages)
    if not last:
        return None
    vignette = _e_vinheta(blob, last)
    conceptual = bool(_CONCEPTUAL_RE.search(last))
    # "Quais critérios de Wells?" → responde. "Paciente com dor, o que faço?" → pergunta.
    if conceptual and not vignette:
        return None
    if not vignette:
        return None
    present = _slots_present(blob)
    missing = [q for name, _, q in _SLOT_QUESTIONS if not present[name]]
    n_present = sum(1 for v in present.values() if v)
    # Precisa de base mínima: idade+tempo+vitais, ou ≥2 slots se já trouxe algum.
    critical_missing = [q for name, _, q in _SLOT_QUESTIONS[:3] if not present[name]]
    if n_present == 0 and len(critical_missing) >= 2:
        return critical_missing[:3]
    if len(critical_missing) >= 2:
        return critical_missing[:3]
    # Já tem quase tudo — deixa consolidar (pode ainda pedir 1 detalhe via prompt).
    return None


def _format_preciso_saber(perguntas: list[str]) -> str:
    body = "\n".join(f"- {p}" for p in perguntas)
    return (
        f"{_PERGUNTA_MARK}:\n{body}\n\n"
        "Com esses dados fecho a conduta ancorada no corpus. "
        "Sem eles eu inventaria premissas — o que este sistema não faz."
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


async def _parecer_meissa(messages: list[dict]) -> tuple[str | None, str, float]:
    """Parecer do especialista, o **porquê** de não ter vindo, e quanto demorou.

    `simvera.meissa` dizia só "ok"/"off", e "off" escondia três causas distintas —
    prazo estourado, parecer vazio e falha de rede. Medido em 2026-08-06 (#36): a
    perna do Meissa tem mediana ~9s (n=8, isolada e em paralelo), contra um prazo de
    7s, então a maioria dos pareceres era descartada. Mas com prazo de 25s um deles
    ainda voltava "off" — era vazio, não timeout. Sem separar as causas, mexer no
    prazo é palpite: não dá para saber se ajudou.

    O parecer é ENRIQUECIMENTO; nenhuma destas causas invalida a resposta, porque a
    âncora é o evidence-pack. Elas mudam só o que se pode concluir da telemetria.
    """
    # monotonic, não time.time(): esta duração existe para ser comparada ao prazo, e
    # um passo de NTP no wall clock daria número negativo ou absurdo justo aqui.
    t = time.monotonic()
    try:
        parecer = await asyncio.wait_for(meissa_opinion(messages), timeout=MEISSA_DEADLINE)
    except asyncio.TimeoutError:
        # Precisa vir ANTES do except Exception: em Python 3.13 asyncio.TimeoutError É o
        # TimeoutError builtin, que herda de Exception. Inverter as duas cláusulas
        # colapsaria "timeout" em "erro" e apagaria a distinção que este código existe
        # para criar. Nota: um TimeoutError vindo de DENTRO de meissa_opinion também cai
        # aqui — httpx não levanta esse tipo (usa TransportError), então fica aceito.
        log.warning("Meissa estourou %.1fs — seguindo só com evidência", MEISSA_DEADLINE)
        return None, "timeout", time.monotonic() - t
    except Exception as exc:  # noqa: BLE001 — qualquer falha degrada, não invalida
        log.warning("Meissa falhou (%s) — seguindo só com evidência", type(exc).__name__)
        return None, "erro", time.monotonic() - t
    dur = time.monotonic() - t
    if not (parecer or "").strip():
        # Meissa responde "<think></think>" sem conteúdo útil depois da tool. Chamar
        # isso de timeout faria alguém subir o prazo achando que resolveria.
        log.info("Meissa devolveu parecer vazio em %.1fs", dur)
        return None, "vazio", dur
    return parecer, "ok", dur


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


# Schema fechado — espelho do Clinical GraphRAG no evidence-pack (#7/#8).
_TYPED_PREDICATES = frozenset({
    "trata", "tratado_por", "dd", "interage", "contraindicado",
})


def _pack_graph_triples(pack: dict | None) -> list[dict]:
    """Triplas tipadas com citation; omite sem fonte ou fora do schema.

    Nunca inventa relação — só re-filtra o que o evidence-pack já ancorou.
    """
    if not pack:
        return []
    out: list[dict] = []
    for t in pack.get("graph_triples") or []:
        if not isinstance(t, dict):
            continue
        pred = t.get("predicate")
        cite = t.get("citation_label")
        if pred not in _TYPED_PREDICATES or not cite:
            continue
        out.append({
            "source": t.get("source"),
            "source_label": t.get("source_label"),
            "predicate": pred,
            "target": t.get("target"),
            "target_label": t.get("target_label"),
            "citation_label": cite,
            "page_start": t.get("page_start"),
            "page_end": t.get("page_end"),
            "chunk_id": t.get("chunk_id"),
            "document_id": t.get("document_id"),
        })
    return out


def _format_graph_section(triples: list[dict]) -> str:
    """Seção legível, distinta do parecer Meissa, com hops e fonte."""
    lines = []
    for t in triples:
        src = t.get("source_label") or t.get("source") or "?"
        tgt = t.get("target_label") or t.get("target") or "?"
        pages = ""
        if t.get("page_start"):
            pages = f" (p. {t['page_start']}" + (
                f"–{t['page_end']}" if t.get("page_end") and t["page_end"] != t["page_start"]
                else "") + ")"
        lines.append(
            f"- ({src}) --[{t['predicate']}]--> ({tgt})  "
            f"[{t.get('citation_label', '?')}]{pages}"
        )
    return (
        "\n\n=== GRAFO CLÍNICO (triplas com fonte no corpus) ===\n"
        "Relações tipadas ancoradas em chunk citável — "
        "não são o parecer do especialista; use para hops multi-relacionais "
        "só com a citação indicada.\n\n"
        + "\n".join(lines)
    )


def build_context(pack: dict, parecer: str | None) -> str:
    blocos = []
    for c in pack.get("chunks", []):
        pages = ""
        if c.get("page_start"):
            pages = f" (p. {c['page_start']}" + (
                f"–{c['page_end']}" if c.get("page_end") and c["page_end"] != c["page_start"] else "") + ")"
        blocos.append(f"[{c.get('citation_label', '?')}]{pages}\n{c.get('text', '')}")
    ctx = "=== EVIDÊNCIA DO CORPUS ===\n\n" + "\n\n---\n\n".join(blocos)
    # Grafo entre evidência e parecer: hops citáveis ≠ opinião do Meissa (#8).
    triples = _pack_graph_triples(pack)
    if triples:
        ctx += _format_graph_section(triples)
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


def _forced_choice(body: dict) -> bool:
    """Detecta modo avaliação. Aceita body.forced_choice ou extra_body (OpenAI SDK)."""
    if body.get("forced_choice") is True:
        return True
    extra = body.get("extra_body")
    if isinstance(extra, dict) and extra.get("forced_choice") is True:
        return True
    # Alguns clientes aninham em metadata
    meta = body.get("metadata")
    if isinstance(meta, dict) and str(meta.get("forced_choice", "")).lower() in (
            "1", "true", "yes"):
        return True
    return False


def _pack_citations(pack: dict) -> list[dict]:
    """Provenance mínima para auditabilidade e para o harness de avaliação."""
    out = []
    for c in pack.get("chunks") or []:
        out.append({
            "citation_label": c.get("citation_label"),
            "page_start": c.get("page_start"),
            "page_end": c.get("page_end"),
            "rerank_score": c.get("rerank_score"),
            "document_id": c.get("document_id"),
            "chunk_id": c.get("chunk_id"),
        })
    return out


def _attach_provenance(payload: dict, *, pack: dict | None, parecer: str | None,
                       forced: bool, t0: float, consultation: bool = False,
                       meissa_status: str | None = None,
                       meissa_s: float | None = None) -> dict:
    """Campos extras (não-OpenAI) para o harness e auditoria. Clientes ignoram o que não conhecem."""
    abstained = bool(pack and (pack.get("abstain") or not pack.get("chunks")))
    # Recusa e modo consulta NÃO devem vazar chunks espúrios (medido: "Sirius Black"
    # puxava stent SIRIUS / Sirius red com conf≈0). Provenance limpa ou vazia.
    # Mesmo para graph_triples: sem chunks/abstain → lista vazia (nunca inventar).
    if consultation or abstained or not pack:
        cites: list[dict] = []
        triples: list[dict] = []
    else:
        cites = _pack_citations(pack)
        triples = _pack_graph_triples(pack)
    payload["simvera"] = {
        "forced_choice": forced,
        "consultation": consultation,
        # "ok" | "vazio" | "timeout" | "erro" | "off". Antes era só ok/off, e "off"
        # confundia as três causas — impossível saber se mexer no prazo ajudou (#36).
        # Semântica deliberada: "ok" agora quer dizer "a perna do Meissa concluiu", não
        # "o parecer influenciou esta resposta" — numa recusa por RAG fora do ar o
        # parecer existe e não é usado, e ainda assim é isso que a telemetria precisa ver.
        "meissa": meissa_status or ("ok" if parecer else "off"),
        "meissa_s": meissa_s,
        "latency_s": round(time.time() - t0, 3),
        "citations": cites,
        "citation_labels": [c["citation_label"] for c in cites if c.get("citation_label")],
        "graph_triples": triples,
        "confidence_precheck": None if (consultation or abstained) else (pack or {}).get("confidence_precheck"),
        "supporting_chunks": None if (consultation or abstained) else (pack or {}).get("supporting_chunks"),
        "abstained": abstained,
    }
    return payload


# ── endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict:
    out: dict[str, Any] = {"status": "ok", "model": MODEL_ID, "code": _code_status()}
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
    forced = _forced_choice(body)
    query = _last_user_text(messages)
    cid = f"chatcmpl-{uuid.uuid4().hex[:24]}"
    t0 = time.time()

    if not query:
        # Sem texto (ex.: só imagem): o RAG não tem o que buscar. Deixa o Gemma
        # descrever a imagem, mas sem qualquer alegação clínica ancorada.
        if _has_image(messages):
            return await _forward_gemma(messages, body, stream, cid, system=(
                "Descreva objetivamente a imagem. NÃO faça diagnóstico nem recomende conduta: "
                "esta resposta não foi ancorada no corpus clínico."),
                forced=forced, pack=None, parecer=None, t0=t0)
        return JSONResponse({"error": {"message": "mensagem vazia"}}, status_code=400)

    # Modo consulta determinístico — ANTES do RAG. Perguntar não é afirmar conduta;
    # não precisa de âncora e evita o Gemma protocolizar com evidence-pack (medido).
    # forced_choice (harness) NUNCA entra aqui.
    if not forced and _rodadas_de_pergunta(messages) < MAX_PERGUNTAS:
        faltantes = _perguntas_faltantes(messages)
        if faltantes:
            log.info("consulta: pedindo %d slots em %r", len(faltantes), query[:60])
            return _emit(_format_preciso_saber(faltantes), stream, cid,
                         pack=None, parecer=None, forced=forced, t0=t0,
                         consultation=True)

    # As duas pernas em paralelo — exceto forced_choice: Meissa disputa o RAG
    # (tool rag_search) e no smoke MedQA-20 gerou 45% de recusa por timeout 20s.
    pack_task = asyncio.create_task(rag_evidence(query))
    meissa_status, meissa_s = "off", None
    if forced:
        # Sem gather(return_exceptions): await puro propaga — capturamos para o
        # mesmo caminho de recusa que o modo normal.
        try:
            pack = await pack_task
        except Exception as exc:
            pack = exc
        parecer = None
    else:
        # Prazo no parecer, não só no erro: o loop agêntico do Meissa é a perna longa.
        # Medido 2026-08-06 (#36), n=8: mediana 9,8s isolado e 8,9s em paralelo com o
        # pack, contra MEISSA_DEADLINE=7 — o prazo cai ABAIXO da mediana do que ele
        # cronometra, e descartava 5 de 8 pareceres. Não mexa nesse número sem olhar a
        # telemetria que _parecer_meissa passou a emitir; subir no escuro troca resposta
        # rápida por espera, do mesmo jeito que SIMVERA_RAG_TIMEOUT.
        t_pernas = time.monotonic()
        meissa_task = asyncio.create_task(_parecer_meissa(messages))
        results = await asyncio.gather(pack_task, meissa_task, return_exceptions=True)
        pack, meissa_res = results[0], results[1]

        if isinstance(meissa_res, BaseException):
            # Praticamente só CancelledError chega aqui (BaseException escapa do
            # except Exception lá dentro). Cronometramos por fora para que meissa_s
            # nunca fique None num caminho de erro — é justamente onde se quer o tempo.
            log.warning("Perna do Meissa falhou (%s)", type(meissa_res).__name__)
            parecer, meissa_status = None, "erro"
            meissa_s = round(time.monotonic() - t_pernas, 2)
        else:
            parecer, meissa_status, dur = meissa_res
            meissa_s = round(dur, 2)

    # Âncora ausente ou fraca → recusa. Nunca cai para o Gemma sozinho.
    if isinstance(pack, BaseException):
        # meissa no log porque em streaming o payload não carrega provenance: sem isto,
        # este é o único caminho onde a classificação é calculada e some inteira.
        log.error("RAG indisponível: %r (meissa=%s/%ss)", pack, meissa_status, meissa_s)
        return _emit(_refusal_text(
            f"O serviço de RAG não respondeu (`{type(pack).__name__}`)."),
            stream, cid, pack=None, parecer=None, forced=forced, t0=t0,
            meissa_status=meissa_status, meissa_s=meissa_s)
    if pack.get("abstain") or not pack.get("chunks"):
        log.info("RAG absteve para %r (meissa=%s/%ss)", query[:80], meissa_status, meissa_s)
        return _emit(_refusal_text(
            "O corpus não tem evidência suficiente para sustentar uma resposta a esta pergunta."),
            stream, cid, pack=pack, parecer=None, forced=forced, t0=t0,
            meissa_status=meissa_status, meissa_s=meissa_s)

    log.info("query=%r rag=%d chunks conf=%.3f meissa=%s/%ss forced=%s t=%.2fs",
             query[:60], len(pack["chunks"]), pack.get("confidence_precheck", 0),
             meissa_status, meissa_s, forced, time.time() - t0)

    if forced:
        system = SYSTEM_FORCED_CHOICE
    else:
        # Modo consulta: o sistema pergunta em vez de supor.
        system = SYSTEM_CONSOLIDACAO
        rodadas = _rodadas_de_pergunta(messages)
        if rodadas >= MAX_PERGUNTAS:
            system += SEM_MAIS_PERGUNTAS
            log.info("teto de %d perguntas atingido — respondendo com o que há", MAX_PERGUNTAS)

    enriched = [{"role": "system", "content": system},
                *[m for m in messages if m.get("role") != "system"],
                {"role": "user", "content": build_context(pack, parecer)}]
    return await _forward_gemma(enriched, body, stream, cid,
                                forced=forced, pack=pack, parecer=parecer, t0=t0,
                                meissa_status=meissa_status, meissa_s=meissa_s)


def _emit(text: str, stream: bool, cid: str, *, pack: dict | None = None,
          parecer: str | None = None, forced: bool = False, t0: float | None = None,
          consultation: bool = False, meissa_status: str | None = None,
          meissa_s: float | None = None) -> Any:
    """Resposta local (recusa / PRECISO_SABER) nos dois formatos."""
    t0 = t0 if t0 is not None else time.time()
    if not stream:
        body = {
            "id": cid, "object": "chat.completion", "created": int(time.time()),
            "model": MODEL_ID,
            "choices": [{"index": 0, "message": {"role": "assistant", "content": text},
                         "finish_reason": "stop"}]}
        _attach_provenance(body, pack=pack, parecer=parecer, forced=forced, t0=t0,
                           consultation=consultation, meissa_status=meissa_status,
                           meissa_s=meissa_s)
        return JSONResponse(body)

    async def gen():
        yield _sse(_msg_chunk(cid, text))
        yield _sse(_msg_chunk(cid, "", finish="stop"))
        yield b"data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


async def _forward_gemma(messages: list[dict], body: dict, stream: bool,
                         cid: str, system: str | None = None, *,
                         forced: bool = False, pack: dict | None = None,
                         parecer: str | None = None, t0: float | None = None,
                         meissa_status: str | None = None,
                         meissa_s: float | None = None) -> Any:
    t0 = t0 if t0 is not None else time.time()
    if system:
        messages = [{"role": "system", "content": system},
                    *[m for m in messages if m.get("role") != "system"]]
    # Piso alto em produção (raciocínio consome tokens). Em forced_choice o piso
    # sabota o MCQ: max_tokens do harness virava 3072 e a resposta saía longa/lenta.
    if forced:
        max_tokens = int(body.get("max_tokens") or 64)
        max_tokens = max(16, min(max_tokens, 256))
        temperature = float(body.get("temperature", 0.0))
    else:
        max_tokens = max(int(body.get("max_tokens") or 0), MIN_GEMMA_TOKENS)
        temperature = body.get("temperature", 0.3)
    payload = {"model": "gemma", "messages": messages, "stream": stream,
               "max_tokens": max_tokens, "temperature": temperature}
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
        _attach_provenance(out, pack=pack, parecer=parecer, forced=forced, t0=t0,
                           meissa_status=meissa_status, meissa_s=meissa_s)
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
