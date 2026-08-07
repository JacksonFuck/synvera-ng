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

