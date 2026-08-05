"""Quality gate: markdown -> ok/quarantine verdict with a machine-readable reason code."""
from __future__ import annotations

from raggw.quality import GARBLED_TEXT, NO_EXTRACTABLE_TEXT, TOO_FEW_WORDS, gate


def test_empty_markdown_is_quarantined_no_extractable_text():
    report = gate("")
    assert report.status == "quarantine"
    assert report.reason == NO_EXTRACTABLE_TEXT
    assert report.ok is False


def test_whitespace_only_markdown_is_quarantined_no_extractable_text():
    report = gate("   \n\n\t  \n")
    assert report.status == "quarantine"
    assert report.reason == NO_EXTRACTABLE_TEXT


def test_garbled_markdown_is_quarantined():
    markdown = "palavra " * 300 + "�" * 25
    report = gate(markdown, max_bad_chars=20)
    assert report.status == "quarantine"
    assert report.reason == GARBLED_TEXT


def test_clean_rich_markdown_is_ok_by_default():
    markdown = "palavra clinica " * 300
    report = gate(markdown)
    assert report.ok is True
    assert report.reason is None


def test_too_few_words_only_quarantines_when_min_words_opted_in():
    markdown = " ".join(["palavra"] * 10)

    report_default = gate(markdown)
    assert report_default.ok is True  # word-count gate is OFF by default

    report_opted_in = gate(markdown, min_words=200)
    assert report_opted_in.status == "quarantine"
    assert report_opted_in.reason == TOO_FEW_WORDS
