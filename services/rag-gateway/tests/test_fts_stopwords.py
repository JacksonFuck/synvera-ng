"""O filtro de stopwords do FTS5 é a diferença entre 0,02s e 3,00s por query.

Se alguém reverter isso sem querer, o sintoma é latência — não erro — e leva horas
para achar. Daí o teste.
"""
from raggw.retrieval import _fts_query


def test_descarta_stopwords():
    q = _fts_query("qual a conduta inicial na embolia pulmonar macica")
    assert '"embolia"' in q and '"pulmonar"' in q and '"macica"' in q
    # Estas casam quase todo o corpus no OR e eram o custo real.
    for lixo in ('"qual"', '"a"', '"na"', '"inicial"', '"conduta"'):
        assert lixo not in q, f"{lixo} voltou ao MATCH — a latência vai junto"


def test_descarta_tokens_curtos():
    assert '"de"' not in _fts_query("dose de adrenalina")
    assert '"adrenalina"' in _fts_query("dose de adrenalina")


def test_query_so_de_stopwords_nao_fica_vazia():
    # "o que fazer?" é só stopword. Devolver None mataria o sinal lexical e deixaria
    # a fusão RRF apoiada só no denso — pior recall, silenciosamente.
    q = _fts_query("o que fazer")
    assert q is not None and q != ""


def test_case_insensitive():
    assert _fts_query("Embolia Pulmonar") == _fts_query("embolia pulmonar")


if __name__ == "__main__":
    test_descarta_stopwords()
    test_descarta_tokens_curtos()
    test_query_so_de_stopwords_nao_fica_vazia()
    test_case_insensitive()
    print("ok")
