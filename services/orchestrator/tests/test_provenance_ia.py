"""Provenance de IA no shim — lacuna CFM registrada em docs/HANDOFF.md (#50).

O destino é prontuário eletrônico hospitalar e de APS, risco CFM alto. A pergunta que
uma auditoria faz meses depois é *qual versão de qual modelo produziu aquela conduta*.
Antes disto o shim não tinha como responder: `payload["model"]` é `simvera-triangulo`,
um apelido OpenAI-compatible, e o modelo real ecoado pelo upstream era sobrescrito por
ele na linha seguinte à que o recebia.

O que estes testes travam é o que a auditoria precisa e o que ela NÃO pode receber:
identidade sim, conteúdo de paciente não.
"""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app as orch  # noqa: E402


def _rodar(coro):
    return asyncio.run(coro)


def _corpo(resposta) -> dict:
    return json.loads(resposta.body)


def test_provenance_traz_o_modelo_ecoado_e_nao_o_apelido() -> None:
    payload = orch._attach_provenance(
        {}, pack={"chunks": [{"citation_label": "x"}],
                  "provenance": {"raggw_version": "0.1.0", "embedder": "BgeM3Embedder"}},
        parecer="parecer", forced=False, t0=0.0,
        meissa_status="ok", meissa_s=3.1, gemma_model="gemma-4-12b-it-Q6_K")
    p = payload["simvera"]["provenance"]

    assert p["gemma"]["model"] == "gemma-4-12b-it-Q6_K"
    assert p["shim"] == orch.MODEL_ID
    assert p["shim"] != p["gemma"]["model"], "o apelido não pode passar por modelo"
    assert p["rag"]["raggw_version"] == "0.1.0"
    assert p["ts"].endswith("+00:00"), "timestamp precisa ser absoluto e com fuso"


def test_provenance_declara_a_origem_de_cada_campo() -> None:
    """Assimetria proposital: gemma é eco do upstream, meissa é o id pedido.

    Declarar as duas como se fossem a mesma coisa seria afirmar mais do que se sabe —
    e provenance que exagera é pior que provenance ausente numa auditoria.
    """
    payload = orch._attach_provenance(
        {}, pack={"chunks": [{"citation_label": "x"}]}, parecer=None, forced=False,
        t0=0.0, meissa_status="timeout", gemma_model="gemma-4")
    p = payload["simvera"]["provenance"]

    assert p["gemma"]["fonte"] == "eco do upstream"
    assert p["meissa"]["fonte"] == "id pedido"
    assert p["meissa"]["status"] == "timeout"


def test_recusa_tem_provenance_mas_nao_vaza_chunks() -> None:
    """A recusa É uma resposta do sistema — precisa ser rastreável.

    Mas a invariante medida em produção continua valendo: recusa e modo consulta não
    devolvem chunks (o caso "Sirius Black" puxava stent SIRIUS com confiança ~0).
    Provenance é identidade de componente, não evidência.
    """
    async def caiu(_q):
        raise ConnectionError("rag fora do ar")

    payload = orch._attach_provenance(
        {}, pack=None, parecer=None, forced=False, t0=0.0, meissa_status="erro")
    sim = payload["simvera"]

    assert sim["citations"] == []
    assert sim["graph_triples"] == []
    assert sim["provenance"]["shim"] == orch.MODEL_ID
    assert sim["provenance"]["rag"] is None, "sem pack não há o que declarar do RAG"


def test_modo_consulta_carrega_provenance(monkeypatch) -> None:
    """PRECISO_SABER também é saída de IA e precisa ser rastreável."""
    async def nunca(_q):
        raise AssertionError("o gate de consulta corta antes do RAG")

    monkeypatch.setattr(orch, "rag_evidence", nunca)
    r = _rodar(orch.chat({"messages": [
        {"role": "user", "content": "Paciente com dor torácica, o que faço?"}]}))
    sim = _corpo(r)["simvera"]

    assert sim["consultation"] is True
    assert sim["citations"] == []
    assert sim["provenance"]["ts"]
    assert sim["provenance"]["gemma"]["model"] is None, "nenhum Gemma rodou neste caminho"


def test_provenance_nao_carrega_conteudo() -> None:
    """Nada de prompt, parecer ou texto de chunk — só identidade.

    Sem isto, alguém acrescenta "a pergunta" ao bloco para facilitar o debug e PHI vaza
    para o payload que o LibreChat guarda.
    """
    payload = orch._attach_provenance(
        {}, pack={"chunks": [{"citation_label": "x", "text": "PACIENTE JOAO DA SILVA"}],
                  "provenance": {"raggw_version": "0.1.0"}},
        parecer="parecer secreto do especialista", forced=False, t0=0.0,
        meissa_status="ok", gemma_model="gemma-4")

    blob = json.dumps(payload["simvera"]["provenance"], ensure_ascii=False)
    assert "JOAO" not in blob
    assert "parecer secreto" not in blob
