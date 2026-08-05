import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import datasets
import score


def test_norm_medqa_mapeia_answer_idx_para_label():
    row = {
        "question": "A junior orthopaedic surgery resident...",
        "answer": "Tell the attending that he cannot fail to disclose this mistake",
        "options": {
            "A": "Disclose the error",
            "B": "Tell the attending",
            "C": "Report to ethics",
            "D": "Do nothing",
        },
        "meta_info": "step1",
        "answer_idx": "B",
        "metamap_phrases": ["junior orthopaedic surgery resident"],
    }
    item = datasets.norm_medqa(row)
    assert item["label"] == "B"
    assert item["difficulty"] == "step1"
    assert item["options"]["B"] == "Tell the attending"
    assert item["bench"] == "medqa"
    assert "metamap_phrases" not in item


def test_norm_pubmedqa_descarta_o_contexto():
    row = {
        "pubid": 21645374,
        "question": "Do mitochondria play a role in remodelling lace plant leaves?",
        "context": {"contexts": ["Programmed cell death (PCD) is the regulated death..."]},
        "long_answer": "Results depicted mitochondrial dynamics in vivo...",
        "final_decision": "yes",
    }
    item = datasets.norm_pubmedqa(row)
    assert item["label"] == "yes"
    assert item["id"] == "21645374"
    assert item["options"] is None
    assert item["difficulty"] == "unknown"
    assert "context" not in item
    assert "long_answer" not in item


def test_extract_medqa_answer_simples():
    assert score.extract("Answer: C", "medqa") == "C"


def test_extract_medqa_negrito_com_parenteses():
    assert score.extract("**Answer: (B)**", "medqa") == "B"


def test_extract_medqa_pega_a_ultima_ocorrencia():
    txt = "Option (A) seems plausible but is wrong. Final Answer: D"
    assert score.extract(txt, "medqa") == "D"


def test_extract_medqa_recusa_devolve_none():
    txt = "A EVIDÊNCIA não fornece elementos para escolher entre as alternativas."
    assert score.extract(txt, "medqa") is None


def test_extract_pubmedqa_yes_no_maybe():
    assert score.extract("yes", "pubmedqa") == "yes"
    assert score.extract("Answer: no", "pubmedqa") == "no"
    assert score.extract("It could be yes, but evidence is weak. maybe", "pubmedqa") == "maybe"


def test_extract_pubmedqa_recusa_devolve_none():
    assert score.extract("Não há evidência suficiente no corpus.", "pubmedqa") is None


def test_tally_ignora_itens_com_erro():
    items = [
        {"label": "A", "response": "Answer: A", "difficulty": "step1", "error": None},
        {"label": "B", "response": "Answer: C", "difficulty": "step1", "error": None},
        {"label": "C", "response": "", "difficulty": "step1", "error": "timeout"},
    ]
    r = score.tally(items, "medqa")
    assert r["total"] == 2
    assert r["correct"] == 1
    assert r["errors"] == 1
    assert r["accuracy"] == 50.0


def test_tally_conta_falha_de_extracao_separada_do_erro():
    items = [
        {"label": "A", "response": "Answer: A", "difficulty": "step1", "error": None},
        {"label": "B", "response": "não sei dizer", "difficulty": "step1", "error": None},
    ]
    r = score.tally(items, "medqa")
    assert r["total"] == 2
    assert r["correct"] == 1
    assert r["extraction_fail"] == 1
