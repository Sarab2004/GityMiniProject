from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, Optional, Sequence

from django.core.exceptions import ValidationError

from .models import RoleCatalog, UserProfile


@dataclass(frozen=True)
class RoleDefinition:
    slug: str
    label: str
    parent_slug: Optional[str]
    is_unique: bool = False


ROLE_DEFINITIONS: tuple[RoleDefinition, ...] = (
    RoleDefinition(slug="ceo", label="CEO", parent_slug=None, is_unique=True),
    RoleDefinition(
        slug="hse_manager",
        label="HSE Manager",
        parent_slug="ceo",
        is_unique=True,
    ),
    RoleDefinition(
        slug="safety_expert",
        label="Safety Expert",
        parent_slug="hse_manager",
        is_unique=False,
    ),
    RoleDefinition(
        slug="hse_officer",
        label="HSE Officer",
        parent_slug="safety_expert",
        is_unique=False,
    ),
    RoleDefinition(
        slug="nurse",
        label="Nurse",
        parent_slug="hse_manager",
        is_unique=False,
    ),
)

ROLE_DEFINITION_MAP = {definition.slug: definition for definition in ROLE_DEFINITIONS}

PERSIAN_DIGITS = [
    "\u06F0",
    "\u06F1",
    "\u06F2",
    "\u06F3",
    "\u06F4",
    "\u06F5",
    "\u06F6",
    "\u06F7",
    "\u06F8",
    "\u06F9",
]


def iter_role_definitions() -> Sequence[RoleDefinition]:
    return ROLE_DEFINITIONS


def ensure_roles_exist(
    roles: Optional[Iterable[RoleDefinition]] = None,
) -> Dict[str, RoleCatalog]:
    """
    Ensure that all default roles exist and parents are linked.

    Returns a mapping of slug -> RoleCatalog.
    """
    definitions = list(roles) if roles is not None else list(ROLE_DEFINITIONS)
    slug_to_role: Dict[str, RoleCatalog] = {}

    for definition in definitions:
        role, created = RoleCatalog.objects.get_or_create(
            slug=definition.slug,
            defaults={
                "label": definition.label,
                "is_unique": definition.is_unique,
            },
        )
        if not created:
            updated_fields: list[str] = []
            if role.label != definition.label:
                role.label = definition.label
                updated_fields.append("label")
            if role.is_unique != definition.is_unique:
                role.is_unique = definition.is_unique
                updated_fields.append("is_unique")
            if updated_fields:
                role.save(update_fields=updated_fields)
        slug_to_role[definition.slug] = role

    for definition in definitions:
        role = slug_to_role[definition.slug]
        parent = (
            slug_to_role.get(definition.parent_slug)
            if definition.parent_slug
            else None
        )
        parent_id = parent.id if parent else None
        if role.parent_id != parent_id:
            role.parent = parent
            role.save(update_fields=["parent"])

    return slug_to_role


def to_persian_digits(number: int) -> str:
    return "".join(PERSIAN_DIGITS[int(digit)] for digit in str(number))


def ensure_role_available(
    role: RoleCatalog,
    *,
    exclude_user_id: Optional[int] = None,
) -> None:
    if not role.is_unique:
        return

    qs = UserProfile.objects.filter(
        role=role,
        is_deleted=False,
        user__is_active=True,
    )
    if exclude_user_id is not None:
        qs = qs.exclude(user_id=exclude_user_id)

    if qs.exists():
        message = (
            "HSE Manager already exists."
            if role.slug == "hse_manager"
            else "This role can only be assigned to one user."
        )
        raise ValidationError({"role": message})


def _resolve_parent_profile(
    reports_to: Optional[object],
) -> Optional[UserProfile]:
    if reports_to is None:
        return None

    if isinstance(reports_to, UserProfile):
        return reports_to

    if hasattr(reports_to, "profile"):
        try:
            return reports_to.profile
        except UserProfile.DoesNotExist as exc:
            raise ValidationError(
                {"reports_to": "Selected manager does not have a profile."}
            ) from exc

    raise ValidationError({"reports_to": "Selected manager is not valid."})


def validate_reports_to(
    role: RoleCatalog,
    reports_to: Optional[object],
) -> None:
    definition = ROLE_DEFINITION_MAP.get(role.slug)
    if definition is None:
        return

    expected_parent_slug = definition.parent_slug
    parent_profile = _resolve_parent_profile(reports_to)

    if expected_parent_slug is None:
        if parent_profile is not None:
            raise ValidationError(
                {"reports_to": f"{role.label} cannot have a manager."}
            )
        return

    if parent_profile is None:
        expected_label = ROLE_DEFINITION_MAP.get(
            expected_parent_slug
        )
        label = expected_label.label if expected_label else expected_parent_slug
        raise ValidationError(
            {"reports_to": f"{role.label} must report to {label}."}
        )

    parent_role = parent_profile.role
    if parent_role is None:
        raise ValidationError(
            {"reports_to": "Selected manager does not have an assigned role."}
        )

    if parent_role.slug != expected_parent_slug:
        expected_label = ROLE_DEFINITION_MAP.get(
            expected_parent_slug
        )
        label = expected_label.label if expected_label else expected_parent_slug
        raise ValidationError(
            {"reports_to": f"{role.label} must report to {label}."}
        )


def generate_display_name(
    role: RoleCatalog,
    *,
    reports_to_id: Optional[int] = None,
    exclude_user_id: Optional[int] = None,
) -> str:
    if role.is_unique:
        return role.label

    qs = UserProfile.objects.filter(
        role=role,
        is_deleted=False,
        user__is_active=True,
    )

    if reports_to_id is None:
        qs = qs.filter(reports_to__isnull=True)
    else:
        qs = qs.filter(reports_to_id=reports_to_id)

    if exclude_user_id is not None:
        qs = qs.exclude(user_id=exclude_user_id)

    count = qs.count()
    if count == 0:
        return role.label

    index = count + 1
    return f"{role.label} {to_persian_digits(index)}"
