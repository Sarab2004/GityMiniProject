from django.contrib import admin

from .models import PermissionEntry, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "display_name", "reports_to", "is_deleted", "created_at")
    list_filter = ("is_deleted",)
    search_fields = ("user__username", "user__email", "display_name")
    raw_id_fields = ("user", "reports_to")
    list_select_related = ("user", "reports_to")


@admin.register(PermissionEntry)
class PermissionEntryAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "resource",
        "can_create",
        "can_read",
        "can_update",
        "can_delete",
    )
    list_filter = ("resource",)
    search_fields = ("user__username", "user__email")
    raw_id_fields = ("user",)
    list_select_related = ("user",)
