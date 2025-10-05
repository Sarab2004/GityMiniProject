from __future__ import annotations

from typing import Iterable

from ..models import AcceptanceStatus, LegalStatus

E_TO_P: list[tuple[int, int, int]] = [
    (0, 2, 1),
    (3, 5, 2),
    (6, 11, 3),
    (12, 17, 4),
    (18, 23, 5),
    (24, 35, 6),
    (36, 47, 7),
    (48, 59, 8),
    (60, 71, 9),
    (72, 10**9, 10),
]


def map_p_from_e(e_value: int) -> int:
    if e_value < 0:
        raise ValueError("مقدار E نمی‌تواند منفی باشد")
    for lower, upper, score in E_TO_P:
        if lower <= e_value <= upper:
            return score
    raise ValueError("جدول امتیاز برای مقدار E یافت نشد")


def calculate_metrics(A: int, B: int, C: int, S: int, D: int, legal_status: str) -> dict[str, int | str]:
    e_value = A * B * C
    p_value = map_p_from_e(e_value)
    rpn_value = S * p_value * D
    acceptance_value = determine_acceptance(legal_status, S, rpn_value)
    return {
        "E": e_value,
        "P": p_value,
        "RPN": rpn_value,
        "acceptance": acceptance_value,
    }


def determine_acceptance(legal_status: str, severity: int, rpn_value: int) -> str:
    if legal_status == LegalStatus.NONCOMPLIANT:
        return AcceptanceStatus.LEGAL_NONCOMPLIANT
    if severity == 10:
        return AcceptanceStatus.HIGH_UNACCEPTABLE
    if rpn_value >= 100:
        return AcceptanceStatus.HIGH_UNACCEPTABLE
    return AcceptanceStatus.LOW_ACCEPTABLE


def ensure_action_number(action_number: str | None, acceptance: str) -> None:
    if acceptance in {AcceptanceStatus.HIGH_UNACCEPTABLE, AcceptanceStatus.LEGAL_NONCOMPLIANT} and not action_number:
        raise ValueError("اقدام اصلاحی لازم است (FR-01-01). شماره اقدام را وارد کنید.")


def validate_score_range(value: int, allowed: Iterable[int] | None = None) -> None:
    if value < 0:
        raise ValueError("امتیاز باید نامنفی باشد")
    if allowed is not None and value not in allowed:
        raise ValueError("امتیاز خارج از بازه مجاز است")
