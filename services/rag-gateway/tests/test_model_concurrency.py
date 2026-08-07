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

import sys
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


def _erros_em_paralelo(chamada, n_threads: int = 8,
                       prazo: float = 10.0) -> list[Exception]:
    """Roda `chamada` em n threads e devolve o que estourou.

    Threads são daemon e o join tem prazo: o assunto deste arquivo é travamento, e um
    deadlock na trava (ex.: `_load()` movido para dentro dela, que não é reentrante)
    penduraria o pytest para sempre em vez de falhar. CI pendurado se parece com CI
    lento, não com CI vermelho.
    """
    erros: list[Exception] = []
    trava = threading.Lock()

    def alvo() -> None:
        try:
            chamada()
        except Exception as exc:  # noqa: BLE001 — é exatamente o que queremos coletar
            with trava:
                erros.append(exc)

    threads = [threading.Thread(target=alvo, daemon=True) for _ in range(n_threads)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=prazo)
    presas = [t for t in threads if t.is_alive()]
    assert not presas, (
        f"{len(presas)} de {n_threads} threads presas após {prazo}s — deadlock na trava. "
        "Suspeite de _load() chamado de dentro do lock: threading.Lock não é reentrante."
    )
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


def test_helper_falha_alto_quando_a_thread_trava():
    """Controle do prazo: deadlock precisa virar falha, não suíte pendurada.

    Sem isto, a regressão que os comentários de reranking.py/embedding.py avisam
    (`_load()` dentro da trava) transformaria os testes abaixo em pytest travado —
    e ninguém lê um CI que nunca termina.
    """
    preso = threading.Event()  # nunca é setado enquanto o helper espera
    try:
        with pytest.raises(AssertionError, match="deadlock"):
            _erros_em_paralelo(preso.wait, n_threads=2, prazo=0.3)
    finally:
        preso.set()  # libera as threads em vez de deixá-las penduradas na sessão


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


def _finge_modulo(monkeypatch, nome: str, atributo: str, fabrica) -> None:
    """Injeta um módulo falso para que `_load()` rode o corpo real sem baixar 2,2GB."""
    modulo = types.ModuleType(nome)
    setattr(modulo, atributo, fabrica)
    monkeypatch.setitem(sys.modules, nome, modulo)


def test_reranker_carga_preguicosa_nao_deadlocka(monkeypatch):
    """A trava só é tomada por `_load()` na PRIMEIRA chamada, com `_model` ainda None.

    Os testes acima pré-carregam `self._model`, então `_load()` retorna no primeiro `if`
    sem encostar no lock — eles nunca exercitam este caminho. É aqui que a regressão que
    os comentários de reranking.py avisam (mover `_load()` para dentro de `with
    self._lock`) trava de verdade, porque threading.Lock não é reentrante.
    """
    tok = _TokenizerCompartilhado()
    _finge_modulo(monkeypatch, "FlagEmbedding", "FlagReranker",
                  lambda *a, **k: _ModeloFake(tok))

    r = BgeReranker()
    assert r._model is None, "o teste precisa começar sem modelo para valer alguma coisa"
    erros = _erros_em_paralelo(lambda: r.rerank("sepse", ["noradrenalina"]), prazo=5.0)
    assert not erros, f"rerank concorrente na carga preguiçosa estourou: {erros[0]!r}"


def test_embedder_carga_preguicosa_nao_deadlocka(monkeypatch):
    """Mesmo caminho de primeira chamada, na outra classe do caminho de produção."""
    tok = _TokenizerCompartilhado()
    _finge_modulo(monkeypatch, "FlagEmbedding", "BGEM3FlagModel",
                  lambda *a, **k: _ModeloFake(tok))

    e = BgeM3Embedder()
    assert e._model is None, "o teste precisa começar sem modelo para valer alguma coisa"
    erros = _erros_em_paralelo(lambda: e.embed(["sepse"]), prazo=5.0)
    assert not erros, f"embed concorrente na carga preguiçosa estourou: {erros[0]!r}"


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
