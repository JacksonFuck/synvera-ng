"""O serviço precisa saber dizer que carregou código diferente do que está em disco.

Motivo (#35): o orquestrador rodou 3h com código anterior ao merge da Fase 2 e devolveu
`graph_triples` vazio o tempo todo. Sem erro, sem log, sem teste vermelho — uma lista
vazia é indistinguível de "esta query não tem triplas". Custou uma sessão de smoke achar.

O sinal não conserta nada sozinho; ele torna a falha **visível**, que era o que faltava.
"""
from __future__ import annotations

import os

import pytest

from raggw import api


def test_pega_o_py_mais_novo_em_qualquer_profundidade(tmp_path):
    (tmp_path / "raso.py").write_text("x = 1")
    sub = tmp_path / "pacote" / "fundo"
    sub.mkdir(parents=True)
    profundo = sub / "novo.py"
    profundo.write_text("y = 2")
    os.utime(profundo, (2_000_000_000, 2_000_000_000))

    assert api._code_mtime(tmp_path) == pytest.approx(2_000_000_000)


def test_ignora_arquivo_que_nao_e_codigo(tmp_path):
    """Índice, log e cache mudam o tempo todo — não são o código carregado."""
    ruido = tmp_path / "dados.json"
    ruido.write_text("{}")
    os.utime(ruido, (2_000_000_000, 2_000_000_000))
    (tmp_path / "codigo.py").write_text("x = 1")

    assert api._code_mtime(tmp_path) < 2_000_000_000


def test_diretorio_sem_py_nao_explode(tmp_path):
    assert api._code_mtime(tmp_path) == 0.0


def test_acusa_quando_o_disco_esta_na_frente(monkeypatch):
    """É exatamente a situação de #35: processo velho, disco novo."""
    monkeypatch.setattr(api, "_CODE_MTIME_BOOT", 0.0)
    estado = api._code_status()
    assert estado["stale"] is True
    assert estado["disk_mtime"] > estado["loaded_mtime"]


def test_nao_acusa_quando_estao_em_dia(monkeypatch):
    """Sem isto, um `stale` grudado em True seria igualmente inútil."""
    monkeypatch.setattr(api, "_CODE_MTIME_BOOT", api._code_mtime())
    assert api._code_status()["stale"] is False
