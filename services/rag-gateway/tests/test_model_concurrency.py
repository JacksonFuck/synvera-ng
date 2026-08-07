"""Reranker e embedder são singletons compartilhados por threads do FastAPI.

O `_lock` das duas classes guardava só o lazy-load; a chamada de inferência corria
destravada. Como o tokenizer *fast* do HuggingFace é Rust `tokenizers` com `RwLock`
interno e `enable_truncation()` muta estado compartilhado, dois requests simultâneos
levantavam `RuntimeError: Already borrowed` e o endpoint devolvia 500.

O orquestrador dispara `/rag/evidence-pack` e `/rag/search` em paralelo em toda query,
então isso virava **recusa clínica espúria**: o sistema dizia "o serviço de RAG não
respondeu" numa pergunta que o corpus responde. Medido em 2026-08-06: 12/12 pares
simultâneos falhavam, 0/12 sequenciais. Ver issue #33.

O sintoma é 500 sob carga — some quando você testa uma query por vez, que é como
todo mundo testa. Daí o teste.
"""
from __future__ import annotations

import threading
import time
import types

import pytest

from raggw.embedding import BgeM3Embedder
from raggw.reranking import BgeReranker, OnnxReranker


class _JaEmprestado(RuntimeError):
    """O que o `tokenizers` Rust levanta: 'Already borrowed'."""


class _TokenizerCompartilhado:
    """Imita o RwLock do tokenizer fast: reentrar durante uma chamada levanta.

    O sleep abre a janela de corrida — sem ele o GIL pode serializar por acidente e
    o teste passaria sem provar nada.
    """

    def __init__(self, atraso: float = 0.02) -> None:
        self._dentro = False
        self._atraso = atraso

    def __call__(self, *args, **kwargs):
        if self._dentro:
            raise _JaEmprestado("Already borrowed")
        self._dentro = True
        try:
            time.sleep(self._atraso)
        finally:
            self._dentro = False
        return None


class _ModeloFake:
    """Stub de FlagReranker/BGEM3FlagModel: só encosta no tokenizer compartilhado."""

    def __init__(self, tok: _TokenizerCompartilhado) -> None:
        self._tok = tok

    def compute_score(self, pares, normalize=True):
        self._tok()
        return [0.5] * len(pares)

    def encode(self, texts, **kwargs):
        self._tok()
        return {"dense_vecs": [[0.1, 0.2, 0.3, 0.4] for _ in texts]}


def _erros_em_paralelo(chamada, n_threads: int = 8) -> list[Exception]:
    """Roda `chamada` em n threads e devolve o que estourou."""
    erros: list[Exception] = []
    trava = threading.Lock()

    def alvo() -> None:
        try:
            chamada()
        except Exception as exc:  # noqa: BLE001 — é exatamente o que queremos coletar
            with trava:
                erros.append(exc)

    threads = [threading.Thread(target=alvo) for _ in range(n_threads)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return erros


def test_detector_de_reentrancia_realmente_detecta():
    """Controle: sem guarda, o detector precisa acusar.

    Sem isto, um detector quebrado faria os testes abaixo passarem sem provar nada —
    verde vazio é pior que vermelho.
    """
    tok = _TokenizerCompartilhado()
    erros = _erros_em_paralelo(tok)
    assert erros, "o detector não acusou concorrência — os testes abaixo seriam vácuo"
    assert all(isinstance(e, _JaEmprestado) for e in erros)


def test_reranker_serializa_inferencia():
    r = BgeReranker()
    r._model = _ModeloFake(_TokenizerCompartilhado())
    erros = _erros_em_paralelo(lambda: r.rerank("sepse", ["noradrenalina", "volume"]))
    assert not erros, f"rerank concorrente estourou: {erros[0]!r}"


def test_embedder_serializa_inferencia():
    e = BgeM3Embedder()
    e._model = _ModeloFake(_TokenizerCompartilhado())
    erros = _erros_em_paralelo(lambda: e.embed(["sepse", "choque séptico"]))
    assert not erros, f"embed concorrente estourou: {erros[0]!r}"


def test_onnx_reranker_serializa_inferencia():
    """Opt-in hoje (RAG_RERANKER=onnx), mas a corrida é a mesma classe de bug.

    Deixar destravado só porque não é o default é o defeito que volta quando alguém
    liga a flag.
    """
    np = pytest.importorskip("numpy")
    tok_real = _TokenizerCompartilhado()

    def tok(*args, **kwargs):
        tok_real()
        return {"input_ids": [[1]]}

    r = OnnxReranker()
    r._tok = tok
    r._model = lambda **enc: types.SimpleNamespace(logits=np.zeros((2, 1)))

    erros = _erros_em_paralelo(lambda: r.rerank("sepse", ["noradrenalina", "volume"]))
    assert not erros, f"rerank ONNX concorrente estourou: {erros[0]!r}"
