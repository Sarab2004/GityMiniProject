import json
from typing import Any, Dict, List, Optional

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import PermissionEntry, UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Seed sample organizational users (CEO → HSE Manager → Nurse) with "
        "baseline permissions."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            dest="password",
            default="Seed_1234",
            help="Password to assign to seeded accounts (default: Seed_1234).",
        )
        parser.add_argument(
            "--hse-can-create",
            dest="hse_can_create",
            action="store_true",
            help="Allow the HSE Manager to create forms/actions.",
        )
        parser.add_argument(
            "--reset-password",
            dest="reset_password",
            action="store_true",
            help="Force reset password for existing seeded users.",
        )

    def handle(self, *args, **options):
        password: str = options["password"]
        hse_can_create: bool = options["hse_can_create"]
        reset_password: bool = options["reset_password"]

        structure: List[Dict[str, Any]] = [
            {
                "key": "ceo",
                "username": "seed_ceo",
                "display_name": "مدیرعامل",
                "reports_to": None,
                "permissions": [
                    {
                        "resource": "forms",
                        "can_create": True,
                        "can_read": True,
                        "can_update": True,
                        "can_delete": True,
                    },
                    {
                        "resource": "actions",
                        "can_create": True,
                        "can_read": True,
                        "can_update": True,
                        "can_delete": True,
                    },
                    {
                        "resource": "archive",
                        "can_create": True,
                        "can_read": True,
                        "can_update": True,
                        "can_delete": True,
                    },
                ],
            },
            {
                "key": "hse",
                "username": "seed_hse",
                "display_name": "مدیر HSE",
                "reports_to": "ceo",
                "permissions": [
                    {
                        "resource": "forms",
                        "can_create": hse_can_create,
                        "can_read": True,
                        "can_update": True,
                        "can_delete": False,
                    },
                    {
                        "resource": "actions",
                        "can_create": hse_can_create,
                        "can_read": True,
                        "can_update": True,
                        "can_delete": False,
                    },
                    {
                        "resource": "archive",
                        "can_create": False,
                        "can_read": True,
                        "can_update": False,
                        "can_delete": False,
                    },
                ],
            },
            {
                "key": "nurse",
                "username": "seed_nurse",
                "display_name": "پرستار",
                "reports_to": "hse",
                "permissions": [
                    {
                        "resource": "forms",
                        "can_create": False,
                        "can_read": False,
                        "can_update": False,
                        "can_delete": False,
                    },
                    {
                        "resource": "actions",
                        "can_create": False,
                        "can_read": False,
                        "can_update": False,
                        "can_delete": False,
                    },
                    {
                        "resource": "archive",
                        "can_create": False,
                        "can_read": True,
                        "can_update": False,
                        "can_delete": False,
                    },
                ],
            },
        ]

        lookup: Dict[str, User] = {}

        with transaction.atomic():
            # Create or update users and profiles.
            for spec in structure:
                user, created = User.objects.get_or_create(
                    username=spec["username"],
                    defaults={"email": ""},
                )
                updated_fields: List[str] = []

                if not user.is_active:
                    user.is_active = True
                    updated_fields.append("is_active")

                if reset_password or not user.has_usable_password():
                    user.set_password(password)
                    updated_fields.append("password")

                if updated_fields:
                    user.save(update_fields=updated_fields)

                profile: Optional[UserProfile]
                try:
                    profile = user.profile
                except UserProfile.DoesNotExist:
                    profile = UserProfile.objects.create(
                        user=user,
                        display_name=spec["display_name"],
                    )
                else:
                    changed = False
                    if profile.display_name != spec["display_name"]:
                        profile.display_name = spec["display_name"]
                        changed = True
                    if profile.is_deleted:
                        profile.is_deleted = False
                        changed = True
                    if changed:
                        profile.save(update_fields=["display_name", "is_deleted", "updated_at"])

                lookup[spec["key"]] = user

            # Second pass: set reporting lines and permissions.
            for spec in structure:
                user = lookup[spec["key"]]
                profile = user.profile
                reports_to_key = spec.get("reports_to")
                reports_to_user = lookup.get(reports_to_key) if reports_to_key else None
                if profile.reports_to != reports_to_user:
                    profile.reports_to = reports_to_user
                    profile.save(update_fields=["reports_to", "updated_at"])

                resources = [entry["resource"] for entry in spec["permissions"]]
                PermissionEntry.objects.filter(
                    user=user, resource__in=resources
                ).delete()

                PermissionEntry.objects.bulk_create(
                    [
                        PermissionEntry(user=user, **permission)
                        for permission in spec["permissions"]
                    ]
                )

        summary = self._build_summary([spec["username"] for spec in structure])
        self.stdout.write(self.style.SUCCESS("Seeded organization users:"))
        self.stdout.write(json.dumps(summary, ensure_ascii=False, indent=2))

    def _build_summary(self, usernames: List[str]) -> List[Dict[str, Any]]:
        users = (
            User.objects.filter(username__in=usernames)
            .select_related("profile")
            .prefetch_related("resource_permissions")
        )
        order_map = {username: index for index, username in enumerate(usernames)}
        sorted_users = sorted(users, key=lambda u: order_map.get(u.username, 0))

        summary: List[Dict[str, Any]] = []
        for user in sorted_users:
            profile = getattr(user, "profile", None)
            permissions = [
                {
                    "resource": entry.resource,
                    "create": bool(entry.can_create),
                    "read": bool(entry.can_read),
                    "update": bool(entry.can_update),
                    "delete": bool(entry.can_delete),
                }
                for entry in user.resource_permissions.all()
            ]

            summary.append(
                {
                    "id": user.id,
                    "username": user.username,
                    "display_name": profile.display_name if profile else "",
                    "reports_to_id": profile.reports_to_id if profile else None,
                    "permissions": permissions,
                }
            )

        return summary
