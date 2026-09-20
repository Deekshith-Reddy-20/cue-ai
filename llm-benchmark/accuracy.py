"""Separate accuracy evaluation — never treat SUCCESS as correct."""

from __future__ import annotations

import re
from typing import Any, Optional

from prompts import PromptCase


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").lower()).strip()


def _keyword_hits(response: str, keywords: tuple[str, ...]) -> tuple[int, int]:
    body = _norm(response)
    if not keywords:
        return 0, 0
    hits = 0
    for kw in keywords:
        needle = kw.lower()
        if needle in body:
            hits += 1
    return hits, len(keywords)


def evaluate_response(prompt: PromptCase, response: str) -> dict[str, Any]:
    """
    Returns accuracy fields. Does not invent timing.
    accuracy_label: correct | partially_correct | incorrect | not_evaluated | failed
    accuracy_score: 0.0–1.0 or None
    """
    text = (response or "").strip()
    if not text:
        return {
            "accuracy_label": "incorrect",
            "accuracy_score": 0.0,
            "syntax_ok": None,
            "logic_ok": None,
            "correctness_ok": False,
            "accuracy_notes": "Empty response",
        }

    hits, total = _keyword_hits(text, prompt.expected_keywords)
    ratio = (hits / total) if total else None

    syntax_ok: Optional[bool] = None
    logic_ok: Optional[bool] = None
    correctness_ok: Optional[bool] = None
    notes_parts: list[str] = []

    if prompt.eval_type == "coding":
        body = _norm(text)
        checks = prompt.coding_checks or ("def",)
        check_hits = sum(1 for c in checks if c.lower() in body)
        syntax_ok = check_hits >= max(1, len(checks) // 2)
        # Logic heuristic: enough conceptual keywords + coding checks
        logic_ok = (ratio is not None and ratio >= 0.4) or check_hits >= 2
        if ratio is None:
            correctness_ok = bool(syntax_ok and logic_ok)
            score = 1.0 if correctness_ok else (0.5 if syntax_ok else 0.0)
        else:
            score = min(1.0, 0.5 * (check_hits / max(1, len(checks))) + 0.5 * ratio)
            correctness_ok = score >= 0.7
        if score >= 0.7:
            label = "correct"
        elif score >= 0.35:
            label = "partially_correct"
        else:
            label = "incorrect"
        notes_parts.append(f"coding_checks={check_hits}/{len(checks)}")
        if total:
            notes_parts.append(f"keywords={hits}/{total}")
    elif prompt.eval_type == "sql":
        body = _norm(text)
        has_select = "select" in body
        syntax_ok = has_select
        if ratio is None:
            score = 1.0 if has_select else 0.0
        else:
            score = (0.4 if has_select else 0.0) + 0.6 * ratio
        logic_ok = score >= 0.5
        correctness_ok = score >= 0.7
        label = (
            "correct"
            if score >= 0.7
            else ("partially_correct" if score >= 0.35 else "incorrect")
        )
        if total:
            notes_parts.append(f"keywords={hits}/{total}")
    else:
        if total == 0:
            return {
                "accuracy_label": "not_evaluated",
                "accuracy_score": None,
                "syntax_ok": None,
                "logic_ok": None,
                "correctness_ok": None,
                "accuracy_notes": "No expected keywords configured",
            }
        score = ratio if ratio is not None else 0.0
        if score >= 0.7:
            label = "correct"
        elif score >= 0.35:
            label = "partially_correct"
        else:
            label = "incorrect"
        correctness_ok = label == "correct"
        notes_parts.append(f"keywords={hits}/{total}")

    # Hard factual override for known numeric answers
    if prompt.expected_answer and prompt.eval_type == "factual":
        expected_num = re.search(r"\b(\d+(?:\.\d+)?)\b", prompt.expected_answer)
        if expected_num and expected_num.group(1) in text.replace(",", ""):
            label = "correct"
            score = max(score or 0.0, 1.0)
            correctness_ok = True
            notes_parts.append("expected_value_found")

    return {
        "accuracy_label": label,
        "accuracy_score": round(float(score), 4) if score is not None else None,
        "syntax_ok": syntax_ok,
        "logic_ok": logic_ok,
        "correctness_ok": correctness_ok,
        "accuracy_notes": "; ".join(notes_parts),
    }


def accuracy_numeric(label: str | None, score: float | None) -> Optional[float]:
    if score is not None:
        return float(score)
    if label == "correct":
        return 1.0
    if label == "partially_correct":
        return 0.5
    if label == "incorrect":
        return 0.0
    return None
