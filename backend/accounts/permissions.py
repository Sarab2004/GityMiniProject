from __future__ import annotations

from typing import Any

from rest_framework.permissions import BasePermission

from .models import PermissionEntry

_ACTION_FIELD_MAP = {
    "create": "can_create",
    "read": "can_read",
    "update": "can_update",
    "delete": "can_delete",
}


class HasResourcePermission(BasePermission):
    """Attach by setting `required_resource` and `required_action` on the view."""

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        required_resource = getattr(view, "required_resource", None)
        required_action = getattr(view, "required_action", None)

        if required_resource is None or required_action is None:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        permission_field = _ACTION_FIELD_MAP.get(required_action)
        if permission_field is None:
            return False

        try:
            entry = (
                PermissionEntry.objects.select_related(None)
                .only("id", permission_field)
                .get(
                    user=request.user,
                    resource=required_resource,
                )
            )
        except PermissionEntry.DoesNotExist:
            return False

        return bool(getattr(entry, permission_field, False))

    def has_object_permission(self, request, view, obj: Any) -> bool:  # type: ignore[override]
        return self.has_permission(request, view)
