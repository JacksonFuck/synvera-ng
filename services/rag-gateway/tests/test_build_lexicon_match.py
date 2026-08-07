"""Matching de surfaces no build_lexicon (#27) — pontuação/aspas como fronteira."""
from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest

_SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "build_lexicon.py"
_spec = importlib.util.spec_from_file_location("build_lexicon", _SCRIPT)
bl = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(bl)


def test_pad_for_match_strips_quotes():
    pad = bl.pad_for_match("itens: [ 'noradrenalina e a 1ª escolha' ]")
    assert " noradrenalina " in pad
    assert "'" not in pad


def test_match_drugs_with_quoted_surface_in_ts_conduta():
    """Reproduz o bug: aspas do TS coladas na surface impediam o match."""
    drug_idx = [("noradrenalina", "drug-noradrenalina"), ("vancomicina", "drug-vancomicina")]
    text = (
        "titulo: 'Vasopressor e inotrópico', itens: [ "
        "'Noradrenalina é a 1ª escolha; alvo PAM ≥ 65 mmHg' ]"
    )
    found = bl._match_drugs_in_conduta(text, drug_idx)
    assert "drug-noradrenalina" in found


def test_match_plain_text_still_works():
    drug_idx = [("vancomicina", "drug-vancomicina")]
    text = "Risco de MRSA: vancomicina dose de ataque e manutenção."
    assert "drug-vancomicina" in bl._match_drugs_in_conduta(text, drug_idx)


def test_neg_context_still_blocks_false_positive():
    drug_idx = [("adrenalina", "drug-adrenalina"), ("atenolol", "drug-atenolol")]
    text = (
        "beta-bloqueadores (atenolol) podem atenuar resposta à adrenalina; "
        "evitar dose extra sem indicação"
    )
    # adrenalina em contexto negativo de atenuar — NEG ou sem treat forte na janela
    found = bl._match_drugs_in_conduta(text, drug_idx)
    # atenolol em "em uso"/atenuar não deve virar trata
    assert "drug-atenolol" not in found or "drug-adrenalina" not in found


def test_extract_typed_includes_nora_trata_sepse():
    doencas = Path(__file__).resolve().parents[1] / "clinical_data" / "doencas.ts"
    bulario = Path(__file__).resolve().parents[1] / "clinical_data" / "bulario.ts"
    if not doencas.exists() or not bulario.exists():
        pytest.skip("clinical_data not present")
    payload = bl.build(doencas, bulario)
    edges = {(a, rel, b) for a, rel, b in payload["typed_edges"]}
    assert ("drug-noradrenalina", "trata", "sepse") in edges
    assert ("sepse", "tratado_por", "drug-noradrenalina") in edges


def test_disease_id_is_surface():
    doencas = Path(__file__).resolve().parents[1] / "clinical_data" / "doencas.ts"
    bulario = Path(__file__).resolve().parents[1] / "clinical_data" / "bulario.ts"
    if not doencas.exists() or not bulario.exists():
        pytest.skip("clinical_data not present")
    payload = bl.build(doencas, bulario)
    by_id = {e["id"]: e for e in payload["entities"]}
    assert "sepse" in by_id
    surfs = [bl.normalize(s) for s in by_id["sepse"]["surfaces"]]
    assert "sepse" in surfs

# ── surfaces sem o parêntese (#38) ────────────────────────────────────────────

def test_variante_sem_parenteses():
    """"Tromboembolismo pulmonar (TEP)" precisa casar "tromboembolismo pulmonar".

    O nome canônico traz a sigla entre parênteses, mas ninguém digita o parêntese: a
    query real é "tromboembolismo pulmonar de alto risco". Sem esta variante a entidade
    não era detectada — medido em 2026-08-06, 22 das 226 entidades tinham a lacuna,
    incluindo TEP, TVP, PCR, TCE e pneumonia adquirida na comunidade.
    """
    assert bl._base_sem_parenteses("Tromboembolismo pulmonar (TEP)") == "Tromboembolismo pulmonar"
    assert bl._base_sem_parenteses("Pneumonia adquirida na comunidade (PAC)") == (
        "Pneumonia adquirida na comunidade")


def test_sem_parenteses_nao_inventa_variante():
    assert bl._base_sem_parenteses("Sepse e choque séptico") is None
    assert bl._base_sem_parenteses("Noradrenalina") is None


def test_sem_parenteses_ignora_base_curta_demais():
    """"AVC (acidente vascular cerebral)" viraria a surface "avc", já coberta pelo id.

    Base com menos de 3 chars vira ruído no índice de detecção, que exige >=3.
    """
    assert bl._base_sem_parenteses("AV (bloqueio)") is None


def test_doenca_ganha_a_variante_no_lexicon():
    """Ponta a ponta no extrator, não só no helper."""
    ts = """
  {
    id: 'tep',
    nome: 'Tromboembolismo pulmonar (TEP)',
    conduta: { titulo: 'x', itens: [ 'anticoagular' ] },
  },
"""
    ents = bl.extract_doencas(ts)
    assert ents, "o bloco de teste precisa ser extraído"
    surfaces = [s.lower() for s in ents[0]["surfaces"]]
    assert "tromboembolismo pulmonar" in surfaces
    assert "tromboembolismo pulmonar (tep)" in surfaces, "a forma canônica não some"


@pytest.mark.parametrize("nome", [
    "Foo (a (b))",      # aninhado
    "Foo (a) bar",      # parêntese no meio, não no fim
    "Foo (a",           # não fechado
    "(TEP)",            # inteiramente parentético — base vazia
    "AV (bloqueio)",    # base com menos de 3 chars
    "Foo (a) (b)",      # dois parênteses: a base ainda teria um sobrando
])
def test_sem_parenteses_devolve_none_nas_bordas(nome):
    """Os None são o comportamento de SEGURANÇA — sem teste, ninguém os defende.

    O caso de dois parênteses importa por um motivo específico: os dois matchers
    discordam de pontuação. `Lexicon.detect` casa a surface normalizada, que mantém
    o parêntese; `pad_for_match` o remove. Gerar surface meio-normalizada cria uma
    assimetria que só aparece muito depois.
    """
    assert bl._base_sem_parenteses(nome) is None


def test_variante_nao_duplica_sinonimo_em_outra_caixa():
    """"Paracetamol" ao lado do sinônimo "paracetamol" não muda detecção nenhuma.

    load_lexicon normaliza, então a duplicata é invisível em runtime — mas incha um
    artefato versionado cujo diff é registro de auditoria.
    """
    surfaces = ["Dipirona (metamizol)", "dipirona"]
    bl._acrescenta_variante_sem_parenteses(surfaces, "Dipirona (metamizol)")
    assert surfaces == ["Dipirona (metamizol)", "dipirona"], "não devia acrescentar nada"


def test_farmaco_ganha_a_variante_no_lexicon():
    """extract_bulario também foi alterado — cobre o outro extrator."""
    ts = """
  {
    id: 'escopolamina',
    nome: 'Butilescopolamina (escopolamina)',
    usoClinico: { titulo: 'x', itens: [ 'colica' ] },
  },
"""
    ents = bl.extract_bulario(ts)
    assert ents, "o bloco de teste precisa ser extraído"
    surfaces = [s.lower() for s in ents[0]["surfaces"]]
    assert "butilescopolamina" in surfaces
