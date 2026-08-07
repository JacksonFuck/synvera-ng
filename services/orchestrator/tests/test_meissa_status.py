"""`simvera.meissa` dizia só "ok"/"off" — e "off" escondia três causas diferentes.

Medido em 2026-08-06 (#36): a perna do Meissa tem mediana ~9s isolada e o prazo é 7s,
então 5 de 8 pareceres eram descartados. Mas com prazo de 25s um deles ainda voltou
"off", o que não pode ser timeout — era parecer vazio (o Meissa responde
`<think></think>` sem conteúdo depois da tool). Sem distinguir as causas não dá para
saber se mexer no prazo ajudou, e o handoff é explícito: medir antes de afirmar.

Estes testes travam a classificação. Sem rede, sem GPU.
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app as orch  # noqa: E402


def _rodar(coro):
    return asyncio.run(coro)


def test_parecer_bom_vira_ok(monkeypatch) -> None:
    async def falso(_messages):
        return "Parecer do especialista."

    monkeypatch.setattr(orch, "meissa_opinion", falso)
    parecer, status, dur = _rodar(orch._parecer_meissa([{"role": "user", "content": "x"}]))
    assert (parecer, status) == ("Parecer do especialista.", "ok")
    assert dur >= 0


@pytest.mark.parametrize("vazio", [None, "", "   "])
def test_parecer_vazio_nao_e_timeout(monkeypatch, vazio) -> None:
    """O Meissa responde `<think></think>` sem conteúdo — chamar isso de timeout
    faria alguém subir o prazo achando que resolveria."""
    async def falso(_messages):
        return vazio

    monkeypatch.setattr(orch, "meissa_opinion", falso)
    parecer, status, _ = _rodar(orch._parecer_meissa([{"role": "user", "content": "x"}]))
    assert parecer is None
    assert status == "vazio"


def test_estouro_de_prazo_vira_timeout(monkeypatch) -> None:
    async def lento(_messages):
        await asyncio.sleep(5)
        return "tarde demais"

    monkeypatch.setattr(orch, "meissa_opinion", lento)
    monkeypatch.setattr(orch, "MEISSA_DEADLINE", 0.05)
    parecer, status, dur = _rodar(orch._parecer_meissa([{"role": "user", "content": "x"}]))
    assert parecer is None
    assert status == "timeout"
    assert dur < 1, "o prazo precisa cortar de verdade, não só rotular"


def test_falha_vira_erro(monkeypatch) -> None:
    async def quebrado(_messages):
        raise ConnectionError("meissa fora do ar")

    monkeypatch.setattr(orch, "meissa_opinion", quebrado)
    parecer, status, _ = _rodar(orch._parecer_meissa([{"role": "user", "content": "x"}]))
    assert parecer is None
    assert status == "erro"


def test_provenance_carrega_status_e_duracao() -> None:
    """O harness e a auditoria precisam ver o porquê, não só a ausência."""
    payload = orch._attach_provenance(
        {}, pack={"chunks": [{"citation_label": "x"}]}, parecer=None,
        forced=False, t0=0.0, meissa_status="timeout", meissa_s=7.01)
    assert payload["simvera"]["meissa"] == "timeout"
    assert payload["simvera"]["meissa_s"] == 7.01


def test_provenance_sem_status_mantem_o_comportamento_antigo() -> None:
    """Caminhos que não chamam o Meissa (recusa, modo consulta) seguem como antes."""
    payload = orch._attach_provenance(
        {}, pack=None, parecer=None, forced=False, t0=0.0)
    assert payload["simvera"]["meissa"] == "off"
    assert payload["simvera"]["meissa_s"] is None
