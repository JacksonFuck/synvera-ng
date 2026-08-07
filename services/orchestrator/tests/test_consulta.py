"""Gate determinístico do modo consulta — sem GPU, sem rede.

Medido 2026-08-06: o prompt SYSTEM_CONSOLIDACAO sozinho não bastou; o Gemma
protocolizava "Paciente com dor torácica, o que faço?". Estes testes travam o
comportamento do classificador de vinheta/slots.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app as orch  # noqa: E402


def _msgs(*users: str, assistant: str | None = None) -> list[dict]:
    out: list[dict] = []
    if assistant:
        out.append({"role": "assistant", "content": assistant})
    for u in users:
        out.append({"role": "user", "content": u})
    return out


@pytest.mark.parametrize(
    "query",
    [
        "Paciente com dor torácica, o que faço?",
        "Homem com febre e dispneia, qual a conduta?",
        "Caso clínico: idosa com confusão, como abordar?",
        "Paciente chegou com dor abdominal intensa, o que fazer?",
    ],
)
def test_vinheta_incompleta_pede_slots(query: str) -> None:
    qs = orch._perguntas_faltantes(_msgs(query))
    assert qs is not None
    assert 2 <= len(qs) <= 3
    assert all(q.startswith(("Qual", "Quais", "Há")) for q in qs)


@pytest.mark.parametrize(
    "query",
    [
        "Quais são os critérios de Wells para embolia pulmonar?",
        "O que é o escore CURB-65?",
        "Qual a dose de adrenalina na PCR do adulto?",
        "Definição de sepse e choque séptico segundo o corpus.",
        "Diferença entre CRB-65 e CURB-65.",
    ],
)
def test_conceitual_nao_interroga(query: str) -> None:
    assert orch._perguntas_faltantes(_msgs(query)) is None


@pytest.mark.parametrize(
    "query",
    [
        "Qual a conduta na cetoacidose diabética grave?",
        "Qual o manejo inicial da sepse?",
        "O que faço na hipercalemia grave?",
        "Qual a conduta no tromboembolismo pulmonar de alto risco?",
    ],
)
def test_conduta_sobre_tema_sem_paciente_nao_interroga(query: str) -> None:
    """Fraseado de conduta amarrado a um tema é pergunta conceitual, não vinheta.

    Não há paciente nenhum aqui — pedir a idade de ninguém é ruído. Medido em
    2026-08-06: a primeira destas caía em PRECISO_SABER (issue #37).

    Cuidado ao mexer: "cetoacidose diabética" preenche o slot de contexto (o regex
    casa `diabet`), então "algum slot preenchido" NÃO serve como sinal de vinheta —
    traria o bug de volta.
    """
    assert orch._perguntas_faltantes(_msgs(query)) is None


@pytest.mark.parametrize("query", ["O que faço?", "Qual a conduta?", "O que fazer?"])
def test_pedido_de_conduta_sem_tema_ainda_interroga(query: str) -> None:
    """Sem tema e sem paciente, o certo é perguntar, não responder.

    O lado caro do erro é deixar de perguntar numa vinheta real: some o humano no
    loop que o risco CFM alto exige. Na dúvida, interrogar.
    """
    assert orch._perguntas_faltantes(_msgs(query)) is not None


def test_paciente_vence_o_tema() -> None:
    """Havendo paciente concreto, o tema não desarma o gate."""
    q = "Paciente com cetoacidose diabética, qual a conduta na cetoacidose?"
    assert orch._perguntas_faltantes(_msgs(q)) is not None


def test_vinheta_completa_nao_interroga() -> None:
    q = (
        "Homem 58 anos com dor torácica há 2 horas, súbita, PA 80/50, "
        "FC 120, SpO2 88%, diabético e hipertenso. O que faço?"
    )
    assert orch._perguntas_faltantes(_msgs(q)) is None


def test_slots_acumulam_no_historico() -> None:
    """Turno 2 preenche o que faltava — deixa de pedir."""
    first = "Paciente com dor torácica, o que faço?"
    assert orch._perguntas_faltantes(_msgs(first)) is not None
    follow = (
        "Tem 60 anos, dor há 1 hora, PA 90/60 FC 110 SpO2 92%, "
        "sem comorbidades conhecidas."
    )
    # Dois turnos user: o classificador vê o blob inteiro.
    assert orch._perguntas_faltantes(_msgs(first, follow)) is None


def test_format_preciso_saber_marca() -> None:
    text = orch._format_preciso_saber(
        ["Qual a idade (e sexo) do paciente?", "Há quanto tempo e como começou o quadro (súbito ou gradual)?"]
    )
    assert text.startswith("PRECISO_SABER:")
    assert "- Qual a idade" in text
    assert orch._PERGUNTA_MARK in text


def test_rodadas_contam_marca() -> None:
    msgs = [
        {"role": "user", "content": "Paciente com dor, o que faço?"},
        {"role": "assistant", "content": "PRECISO_SABER:\n- Qual a idade?"},
        {"role": "user", "content": "60 anos"},
    ]
    assert orch._rodadas_de_pergunta(msgs) == 1
