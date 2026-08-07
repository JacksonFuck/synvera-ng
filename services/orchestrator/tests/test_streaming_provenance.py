"""Streaming também precisa carregar `simvera` — o LibreChat streama por padrão (#52).

O bloco `simvera` (citações, triplas, telemetria do Meissa e, desde #50, provenance de IA)
só era emitido em resposta não-streaming. Enquanto era diagnóstico, incomodava; quando
passou a carregar **modelo, versão e runtime**, que é item de checklist CFM, fechar a
lacuna só em não-streaming virou fechá-la no caminho que produção não usa.

Decisão de desenho que estes testes travam: a provenance viaja no chunk que **já** carrega
`finish_reason`, não num evento SSE extra. A sequência de chunks fica idêntica à de antes,
então nenhum cliente precisa tolerar um evento a mais.
"""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app as orch  # noqa: E402


def _coletar(resposta) -> list[dict]:
    """Consome o StreamingResponse e devolve os chunks JSON (sem o [DONE])."""
    async def _ler():
        partes = []
        async for bloco in resposta.body_iterator:
            partes.append(bloco if isinstance(bloco, bytes) else bloco.encode())
        return b"".join(partes)

    bruto = asyncio.run(_ler()).decode()
    chunks = []
    for linha in bruto.split("\n\n"):
        linha = linha.strip()
        if not linha.startswith("data: "):
            continue
        dados = linha[6:].strip()
        if dados == "[DONE]":
            continue
        chunks.append(json.loads(dados))  # falha aqui = SSE malformado
    return chunks


def _com_simvera(chunks: list[dict]) -> list[dict]:
    return [c for c in chunks if "simvera" in c]


def test_recusa_em_streaming_carrega_provenance() -> None:
    r = orch._emit("⚠️ **Não posso responder sem fonte.**", True, "chatcmpl-t",
                   pack=None, parecer=None, forced=False, t0=0.0,
                   meissa_status="timeout", meissa_s=7.0)
    chunks = _coletar(r)

    portadores = _com_simvera(chunks)
    assert len(portadores) == 1, "exatamente um chunk carrega a auditoria"
    sim = portadores[0]["simvera"]
    assert sim["meissa"] == "timeout"
    assert sim["provenance"]["ts"]
    assert sim["citations"] == [], "recusa não vaza chunks, nem em streaming"


def test_provenance_viaja_no_chunk_de_finish_e_nao_num_evento_extra() -> None:
    """Sequência SSE idêntica à de antes desta mudança.

    Um evento a mais seria o jeito óbvio e é justamente o que pode quebrar cliente que
    valida a forma do stream. O chunk de `finish_reason` já existe — basta usá-lo.
    """
    r = orch._emit("texto", True, "chatcmpl-t", pack=None, parecer=None,
                   forced=False, t0=0.0)
    chunks = _coletar(r)

    assert len(chunks) == 2, "um chunk de conteúdo e um de finish, como antes"
    assert "simvera" not in chunks[0]
    assert chunks[1]["choices"][0]["finish_reason"] == "stop"
    assert "simvera" in chunks[1]
    assert chunks[1]["choices"][0]["delta"] == {}, "nada é acrescentado ao texto"


def test_modo_consulta_em_streaming_nao_vaza_chunks() -> None:
    r = orch._emit("PRECISO_SABER:\n- Qual a idade?", True, "chatcmpl-t",
                   pack={"chunks": [{"citation_label": "x"}]}, parecer=None,
                   forced=False, t0=0.0, consultation=True)
    sim = _com_simvera(_coletar(r))[0]["simvera"]

    assert sim["consultation"] is True
    assert sim["citations"] == []
    assert sim["graph_triples"] == []


class _StreamFalso:
    """`_client.stream(...)` mínimo: devolve as linhas SSE que o llama.cpp devolveria."""

    def __init__(self, linhas: list[str]) -> None:
        self._linhas = linhas

    def stream(self, *a, **k):
        linhas = self._linhas

        class _Ctx:
            async def __aenter__(self):
                return self

            async def __aexit__(self, *exc):
                return False

            def raise_for_status(self):
                return None

            async def aiter_lines(self):
                for linha in linhas:
                    yield linha

        return _Ctx()


def _chunk_upstream(content: str = "", finish: str | None = None) -> str:
    return "data: " + json.dumps({
        "model": "/models/gemma-4-12b-it-Q6_K.gguf",
        "choices": [{"index": 0, "delta": {"content": content} if content else {},
                     "finish_reason": finish}]})


def test_streaming_do_gemma_captura_o_eco_e_anexa_no_finish(monkeypatch) -> None:
    """O caminho de streaming tinha o MESMO overwrite do não-streaming.

        obj["model"] = MODEL_ID

    e ninguém capturava o eco antes. Sem isto a provenance em streaming declararia o
    apelido — que é exatamente o que a issue #50 chamou de insuficiente.
    """
    monkeypatch.setattr(orch, "_client", _StreamFalso([
        _chunk_upstream("Conduta ancorada"),
        _chunk_upstream(finish="stop"),
        "data: [DONE]",
    ]))

    r = asyncio.run(orch._forward_gemma(
        [{"role": "user", "content": "x"}], {}, True, "chatcmpl-t",
        pack={"chunks": [{"citation_label": "l"}],
              "provenance": {"raggw_version": "0.1.0"}},
        parecer=None, t0=0.0, meissa_status="ok"))
    chunks = _coletar(r)

    portadores = _com_simvera(chunks)
    assert len(portadores) == 1
    prov = portadores[0]["simvera"]["provenance"]
    assert prov["gemma"]["model"] == "/models/gemma-4-12b-it-Q6_K.gguf"
    assert prov["rag"]["raggw_version"] == "0.1.0"
    assert all(c["model"] == orch.MODEL_ID for c in chunks), \
        "o cliente segue vendo o id que pediu em todo chunk"


def test_stream_que_quebra_no_meio_ainda_emite_provenance(monkeypatch) -> None:
    """A resposta parcial que o usuário já viu também precisa ser rastreável.

    Se o upstream cai antes de qualquer `finish_reason`, o caminho feliz não roda — e
    provenance que só existe no caminho feliz não serve de registro de auditoria.
    """
    class _Quebra(_StreamFalso):
        def stream(self, *a, **k):
            class _Ctx:
                async def __aenter__(self):
                    return self

                async def __aexit__(self, *exc):
                    return False

                def raise_for_status(self):
                    return None

                async def aiter_lines(self):
                    yield _chunk_upstream("Começo da resp")
                    raise ConnectionError("upstream caiu")

            return _Ctx()

    monkeypatch.setattr(orch, "_client", _Quebra([]))

    r = asyncio.run(orch._forward_gemma(
        [{"role": "user", "content": "x"}], {}, True, "chatcmpl-t",
        pack={"chunks": [{"citation_label": "l"}]}, parecer=None, t0=0.0,
        meissa_status="off"))
    chunks = _coletar(r)

    assert _com_simvera(chunks), "stream quebrado ainda precisa deixar rastro"
    assert any("falha na geração" in json.dumps(c, ensure_ascii=False) for c in chunks), \
        "e o usuário precisa ser avisado de que quebrou"
