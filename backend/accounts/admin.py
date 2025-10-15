from django.contrib import admin

from .models import PermissionEntry, RoleCatalog, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "display_name", "role", "reports_to", "is_deleted", "created_at")
    list_filter = ("is_deleted", "role")
    search_fields = ("user__username", "user__email", "display_name", "role__label")
    raw_id_fields = ("user", "reports_to")
    list_select_related = ("user", "reports_to", "role")


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


@admin.register(RoleCatalog)
class RoleCatalogAdmin(admin.ModelAdmin):
    list_display = ("label", "slug", "parent", "is_unique", "updated_at")
    list_filter = ("is_unique",)
    search_fields = ("label", "slug")
    raw_id_fields = ("parent",)
    readonly_fields = ("slug", "label", "parent", "is_unique", "created_at", "updated_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
