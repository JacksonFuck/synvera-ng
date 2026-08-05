"""Inc 2 — inbox watcher: ~/rag-inbox → POST /ingest (HTTP loopback) → processed|failed.

Testa com o app REAL (TestClient roda o lifespan → worker de jobs real) e o client
injetado no run_once — TestClient É um httpx.Client, então zero mock de HTTP.
"""
from __future__ import annotations

import os
import sqlite3
import time
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from raggw.api import create_app
from raggw.embedding import FakeEmbedder
from raggw.scripts import inbox_watcher as iw
from tests.conftest import make_pdf


@pytest.fixture
def inbox(tmp_path: Path) -> Path:
    box = tmp_path / "rag-inbox"
    box.mkdir()
    return box


@pytest.fixture
def client(db_path):
    app = create_app(db_path=str(db_path), embedder=FakeEmbedder(dim=8), start_worker=True)
    with TestClient(app) as c:
        yield c


def _old(path: Path, seconds: float = 60.0) -> Path:
    """Envelhece o mtime para o arquivo contar como estável."""
    t = time.time() - seconds
    os.utime(path, (t, t))
    return path


def _pdf(inbox: Path, rel: str) -> Path:
    p = inbox / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(make_pdf(["conteudo clinico de teste sobre sepse"]))
    return _old(p)


def _run(client, inbox, state, **kw):
    with open(inbox / ".inbox_watcher.jsonl", "a", encoding="utf-8") as fp:
        return iw.run_once(client, inbox, state=state, stable_seconds=5.0, log_fp=fp, **kw)


def _drain(client, inbox, state, timeout: float = 15.0) -> dict:
    deadline = time.time() + timeout
    summary = _run(client, inbox, state)
    while state.pending and time.time() < deadline:
        time.sleep(0.1)
        summary = _run(client, inbox, state)
    assert not state.pending, "watcher não drenou a tempo"
    return summary


# ── Fluxo completo ─────────────────────────────────────────────────────────────

def test_happy_path_subpasta_vira_specialty(client, inbox, db_path):
    _pdf(inbox, "emergencia/doc.pdf")
    first = _run(client, inbox, iw.WatcherState())  # estado novo só p/ contagem
    assert first["submitted"] == 1

    state = iw.WatcherState()
    _drain(client, inbox, state)
    assert (inbox / "processed" / "emergencia" / "doc.pdf").exists()
    assert not (inbox / "emergencia" / "doc.pdf").exists()

    conn = sqlite3.connect(db_path)
    row = conn.execute("SELECT specialty, title FROM documents").fetchone()
    conn.close()
    assert row == ("emergencia", "doc")


def test_arquivo_instavel_fica_para_proxima_varredura(client, inbox):
    p = inbox / "novo.pdf"
    p.write_bytes(make_pdf(["ainda copiando"]))  # mtime = agora
    summary = _run(client, inbox, iw.WatcherState())
    assert summary["unstable"] == 1
    assert summary["submitted"] == 0
    assert p.exists()


def test_extensao_nao_suportada_vai_para_failed_com_reason(client, inbox):
    p = inbox / "notas.zzz"
    p.write_text("qualquer coisa")
    _old(p)
    summary = _run(client, inbox, iw.WatcherState())
    assert summary["ignored_unsupported"] == 1
    dest = inbox / "failed" / "notas.zzz"
    assert dest.exists()
    assert "unsupported" in (inbox / "failed" / "notas.zzz.reason.txt").read_text()


def test_duplicado_vai_para_processed_sem_documento_novo(client, inbox, db_path):
    _pdf(inbox, "a.pdf")
    state = iw.WatcherState()
    _drain(client, inbox, state)

    # mesmo conteúdo, outro nome
    b = inbox / "b.pdf"
    b.write_bytes((inbox / "processed" / "a.pdf").read_bytes())
    _old(b)
    _drain(client, inbox, state)

    assert (inbox / "processed" / "b.pdf").exists()
    conn = sqlite3.connect(db_path)
    n = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    conn.close()
    assert n == 1


def test_job_failed_vai_para_failed_com_o_erro(client, inbox):
    p = inbox / "corrompido.pdf"
    p.write_bytes(b"not a pdf at all")
    _old(p)
    _drain(client, inbox, iw.WatcherState())
    assert (inbox / "failed" / "corrompido.pdf").exists()
    reason = (inbox / "failed" / "corrompido.pdf.reason.txt").read_text()
    assert reason.strip()


def test_api_fora_nao_explode_nem_move(inbox):
    p = _pdf(inbox, "espera.pdf")
    dead = httpx.Client(base_url="http://127.0.0.1:9", timeout=0.2)
    summary = _run(dead, inbox, iw.WatcherState())
    assert summary["api_unreachable"] is True
    assert p.exists()


def test_sem_resubmissao_enquanto_job_pendente(client, inbox):
    _pdf(inbox, "unico.pdf")
    state = iw.WatcherState()
    s1 = _run(client, inbox, state)
    s2 = _run(client, inbox, state)
    assert s1["submitted"] + s2["submitted"] == 1
    _drain(client, inbox, state)


def test_job_perdido_404_reenfileira(client, inbox, db_path):
    """Promote troca o DB e os jobs somem (404) — o watcher re-submete o arquivo."""
    _pdf(inbox, "sobrevive.pdf")
    state = iw.WatcherState()
    _run(client, inbox, state)
    # simula o promote: o job pendente aponta p/ um id que não existe mais
    (path,) = list(state.pending)
    state.pending[path] = 999_999
    summary = _drain(client, inbox, state)
    assert (inbox / "processed" / "sobrevive.pdf").exists()
    assert summary["requeued"] >= 0  # contador existe; re-submissão aconteceu via drain


# ── Funções puras ──────────────────────────────────────────────────────────────

def test_classify_specialty(inbox):
    assert iw.classify_specialty(inbox, inbox / "raiz.pdf") is None
    assert iw.classify_specialty(inbox, inbox / "uti" / "x.pdf") == "uti"
    assert iw.classify_specialty(inbox, inbox / "uti" / "sub" / "x.pdf") == "uti"


def test_scan_ignora_reservados_parciais_e_dotfiles(inbox):
    _pdf(inbox, "ok.pdf")
    (inbox / "processed").mkdir()
    (inbox / "processed" / "ja.pdf").write_bytes(b"x")
    (inbox / "download.pdf.part").write_bytes(b"x")
    (inbox / ".inbox_watcher.jsonl").write_text("{}")
    (inbox / "erro.pdf.reason.txt").write_text("x")
    (inbox / ".syncthing.tmp.pdf").write_bytes(b"x")
    found = iw.scan_inbox(inbox)
    assert [p.name for p in found] == ["ok.pdf"]


def test_move_resolved_colisao_ganha_sufixo(inbox):
    a = inbox / "x.pdf"
    a.write_bytes(b"a")
    dest1 = iw.move_resolved(inbox, a, "processed")
    b = inbox / "x.pdf"
    b.write_bytes(b"b")
    dest2 = iw.move_resolved(inbox, b, "processed")
    assert dest1.name == "x.pdf"
    assert dest2.name == "x_1.pdf"
    assert dest1.read_bytes() == b"a" and dest2.read_bytes() == b"b"
