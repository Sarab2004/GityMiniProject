from __future__ import annotations

from typing import Iterable, Mapping

SIMPLE_PERMISSION_KEYS = (
    "can_submit_forms",
    "can_view_archive",
    "can_edit_archive_entries",
    "can_delete_archive_entries",
)

ARCHIVE_DEPENDENCY_ERROR = "برای ویرایش/حذف رکوردها، دسترسی آرشیو باید فعال باشد."


class SimplePermissionError(ValueError):
    """Raised when simple permission payload is invalid."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def _get_flag(entry: Mapping[str, object] | object, attr: str) -> bool:
    if isinstance(entry, Mapping):
        return bool(entry.get(attr, False))
    return bool(getattr(entry, attr, False))


def normalize_simple_permissions(data: Mapping[str, object] | None) -> dict[str, bool]:
    normalized = {key: False for key in SIMPLE_PERMISSION_KEYS}
    if not data:
        return normalized
    for key in SIMPLE_PERMISSION_KEYS:
        normalized[key] = bool(data.get(key, False))

    if normalized["can_edit_archive_entries"] and not normalized["can_view_archive"]:
        raise SimplePermissionError(ARCHIVE_DEPENDENCY_ERROR)
    if normalized["can_delete_archive_entries"] and not normalized["can_view_archive"]:
        raise SimplePermissionError(ARCHIVE_DEPENDENCY_ERROR)

    return normalized


def convert_simple_to_permissions(
    simple: Mapping[str, object] | None,
    existing_permissions: Iterable[Mapping[str, object] | object] | None = None,
) -> tuple[list[dict[str, object]], dict[str, bool]]:
    normalized = normalize_simple_permissions(simple)

    entries: dict[str, dict[str, object]] = {}

    if existing_permissions:
        for perm in existing_permissions:
            resource = getattr(perm, "resource", None)
            if resource is None and isinstance(perm, Mapping):
                resource = perm.get("resource")
            if not resource:
                continue
            entries[resource] = {
                "resource": resource,
                "can_create": _get_flag(perm, "can_create"),
                "can_read": _get_flag(perm, "can_read"),
                "can_update": _get_flag(perm, "can_update"),
                "can_delete": _get_flag(perm, "can_delete"),
            }

    # Reset forms and archive according to the simple payload
    entries.pop("forms", None)
    entries.pop("archive", None)

    if normalized["can_submit_forms"]:
        entries["forms"] = {
            "resource": "forms",
            "can_create": True,
            "can_read": True,
            "can_update": False,
            "can_delete": False,
        }

    archive_flags = (
        normalized["can_view_archive"]
        or normalized["can_edit_archive_entries"]
        or normalized["can_delete_archive_entries"]
    )
    if archive_flags:
        archive_entry = {
            "resource": "archive",
            "can_create": False,
            "can_read": True,
            "can_update": normalized["can_edit_archive_entries"],
            "can_delete": normalized["can_delete_archive_entries"],
        }
        entries["archive"] = archive_entry

    return list(entries.values()), normalized


def permissions_to_simple(
    permissions: Iterable[Mapping[str, object] | object],
) -> dict[str, bool]:
    simple = {key: False for key in SIMPLE_PERMISSION_KEYS}

    for perm in permissions:
        resource = getattr(perm, "resource", None)
        if resource is None and isinstance(perm, Mapping):
            resource = perm.get("resource")
        if resource == "forms":
            if _get_flag(perm, "can_create"):
                simple["can_submit_forms"] = True
        elif resource == "archive":
            if _get_flag(perm, "can_read"):
                simple["can_view_archive"] = True
            if _get_flag(perm, "can_update"):
                simple["can_edit_archive_entries"] = True
            if _get_flag(perm, "can_delete"):
                simple["can_delete_archive_entries"] = True

    if simple["can_edit_archive_entries"] or simple["can_delete_archive_entries"]:
        simple["can_view_archive"] = True

    return simple
