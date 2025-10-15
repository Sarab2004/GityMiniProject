from __future__ import annotations

from typing import Any, Dict, Optional

from .models import (
    ActionForm,
    ActionTracking,
    ChangeLog,
    RiskRecord,
    SafetyTeam,
    ToolboxMeeting,
)
from .serializers.actions import ActionFormSerializer
from .serializers.risks import RiskRecordSerializer
from .serializers.teams import SafetyTeamSerializer
from .serializers.tracking import (
    ActionTrackingSerializer,
    ChangeLogSerializer,
    ToolboxMeetingSerializer,
)

FormRegistryEntry = Dict[str, Any]


FORM_REGISTRY: Dict[str, FormRegistryEntry] = {
    "action": {
        "form_type": "action",
        "form_code": "FR-01-01",
        "form_title": "اقدام اصلاحی/پیشگیرانه/تغییرات",
        "model": ActionForm,
        "serializer": ActionFormSerializer,
    },
    "tracking": {
        "form_type": "tracking",
        "form_code": "FR-01-02",
        "form_title": "پیگیری اقدام اصلاحی/پیشگیرانه",
        "model": ActionTracking,
        "serializer": ActionTrackingSerializer,
    },
    "change": {
        "form_type": "change",
        "form_code": "FR-01-03",
        "form_title": "ثبت و پیگیری تغییرات",
        "model": ChangeLog,
        "serializer": ChangeLogSerializer,
    },
    "tbm": {
        "form_type": "tbm",
        "form_code": "PR-01-07-01",
        "form_title": "TBM - آموزش حین کار",
        "model": ToolboxMeeting,
        "serializer": ToolboxMeetingSerializer,
    },
    "team": {
        "form_type": "team",
        "form_code": "FR-01-12",
        "form_title": "تشکیل تیم همیاران HSE",
        "model": SafetyTeam,
        "serializer": SafetyTeamSerializer,
    },
    "risk": {
        "form_type": "risk",
        "form_code": "FR-01-28",
        "form_title": "شناسایی و ارزیابی ریسک‌های ایمنی، بهداشتی و اموال",
        "model": RiskRecord,
        "serializer": RiskRecordSerializer,
    },
}


def get_form_metadata(form_type: str) -> FormRegistryEntry:
    """
    Return registry entry for a given form_type.

    Provides minimal defaults when the form_type is unknown to preserve backwards compatibility.
    """

    default: FormRegistryEntry = {
        "form_type": form_type,
        "form_code": form_type.upper(),
        "form_title": form_type.title(),
        "model": None,
        "serializer": None,
    }
    return {**default, **FORM_REGISTRY.get(form_type, {})}


_FORM_CODE_LOOKUP: Dict[str, FormRegistryEntry] = {}
for key, value in FORM_REGISTRY.items():
    entry = value.copy()
    entry.setdefault("form_type", key)
    _FORM_CODE_LOOKUP[entry["form_code"]] = entry


def get_form_entry_by_code(form_code: str) -> Optional[FormRegistryEntry]:
    entry = _FORM_CODE_LOOKUP.get(form_code)
    if entry:
        return entry.copy()
    return None
