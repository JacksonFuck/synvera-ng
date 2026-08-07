"""Este processo é o réu de #35: rodou 3h com código pré-Fase 2 sem sinal nenhum.

`graph_triples` vinha vazio ao LibreChat e ninguém tinha como saber. O sinal em /health
não conserta nada sozinho — torna a falha visível, que era o que faltava.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app as orch  # noqa: E402


def test_acusa_quando_o_disco_esta_na_frente(monkeypatch) -> None:
    monkeypatch.setattr(orch, "_CODE_MTIME_BOOT", 0.0)
    estado = orch._code_status()
    assert estado["stale"] is True
    assert estado["disk_mtime"] > estado["loaded_mtime"]


def test_nao_acusa_quando_estao_em_dia(monkeypatch) -> None:
    """Sem isto, um `stale` grudado em True seria igualmente inútil."""
    monkeypatch.setattr(orch, "_CODE_MTIME_BOOT", orch._code_mtime())
    assert orch._code_status()["stale"] is False


def test_mtime_acompanha_o_arquivo(tmp_path, monkeypatch) -> None:
    """O stamp precisa vir do arquivo, não de um valor congelado no import."""
    import os

    falso = tmp_path / "app.py"
    falso.write_text("x = 1")
    os.utime(falso, (2_000_000_000, 2_000_000_000))
    monkeypatch.setattr(orch, "_CODIGO", falso)

    assert orch._code_mtime() == 2_000_000_000
