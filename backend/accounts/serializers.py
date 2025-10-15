from typing import Optional

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import PermissionEntry, RoleCatalog, UserProfile
from .permission_utils import (
    SimplePermissionError,
    convert_simple_to_permissions,
    permissions_to_simple,
)
from .role_utils import (
    ROLE_DEFINITION_MAP,
    ensure_role_available,
    ensure_roles_exist,
    validate_reports_to,
)


User = get_user_model()


class AuthUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name"]

    def get_full_name(self, obj):
        full_name = obj.get_full_name()
        return full_name or obj.username


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class MessageSerializer(serializers.Serializer):
    detail = serializers.CharField()


class PermissionEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = PermissionEntry
        fields = ["resource", "can_create", "can_read", "can_update", "can_delete"]


class RoleCatalogSerializer(serializers.Serializer):
    slug = serializers.SlugField()
    label = serializers.CharField()
    parent_slug = serializers.CharField(allow_null=True)
    is_unique = serializers.BooleanField()


def _get_role_for_slug(value: str) -> RoleCatalog:
    if value not in ROLE_DEFINITION_MAP:
        raise serializers.ValidationError("Selected role does not exist.")
    ensure_roles_exist()
    try:
        return RoleCatalog.objects.get(slug=value)
    except RoleCatalog.DoesNotExist as exc:
        raise serializers.ValidationError("Selected role does not exist.") from exc


class SimplePermissionSerializer(serializers.Serializer):
    can_submit_forms = serializers.BooleanField(required=False, default=False)
    can_view_archive = serializers.BooleanField(required=False, default=False)
    can_edit_archive_entries = serializers.BooleanField(required=False, default=False)
    can_delete_archive_entries = serializers.BooleanField(required=False, default=False)


class AdminUserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source="profile.display_name")
    reports_to_id = serializers.IntegerField(
        source="profile.reports_to_id", allow_null=True
    )
    permissions = PermissionEntrySerializer(
        source="resource_permissions", many=True, read_only=True
    )
    role = serializers.SerializerMethodField()
    simple_permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "is_active",
            "display_name",
            "role",
            "reports_to_id",
            "permissions",
            "simple_permissions",
        ]

    def get_role(self, obj):
        profile = getattr(obj, "profile", None)
        if not profile or not profile.role:
            return None
        parent_slug = profile.role.parent.slug if profile.role.parent else None
        return {
            "slug": profile.role.slug,
            "label": profile.role.label,
            "parent_slug": parent_slug,
            "is_unique": profile.role.is_unique,
        }

    def get_simple_permissions(self, obj):
        permissions = getattr(obj, "resource_permissions", None)
        if permissions is None:
            return permissions_to_simple([])
        if hasattr(permissions, "all"):
            permissions = permissions.all()
        return permissions_to_simple(permissions)


class _ReportsToField(serializers.PrimaryKeyRelatedField):
    default_error_messages = {
        "does_not_exist": "Selected manager does not exist.",
    }

    def use_pk_only_optimization(self):
        return True


class AdminUserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    role_slug = serializers.SlugField()
    reports_to_id = _ReportsToField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
        source="reports_to_user",
    )
    permissions = PermissionEntrySerializer(many=True, required=False)
    simple_permissions = SimplePermissionSerializer(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._selected_role: Optional[RoleCatalog] = None

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already in use.")
        return value

    def validate_role_slug(self, value):
        role = _get_role_for_slug(value)
        try:
            ensure_role_available(role)
        except DjangoValidationError as exc:
            message_dict = exc.message_dict if hasattr(exc, "message_dict") else {}
            role_errors = message_dict.get("role") or exc.messages
            raise serializers.ValidationError(role_errors)
        self._selected_role = role
        return value

    def validate_permissions(self, value):
        self._validate_unique_resources(value)
        return value

    @staticmethod
    def _validate_unique_resources(permissions):
        resources = set()
        for permission in permissions:
            resource = permission["resource"]
            if resource in resources:
                raise serializers.ValidationError(
                    "Duplicate permission entries for the same resource are not allowed."
                )
            resources.add(resource)

    def validate(self, attrs):
        role_slug = attrs.get("role_slug")
        reports_to_user = attrs.get("reports_to_user")
        simple_permissions_payload = attrs.pop("simple_permissions", None)

        if role_slug:
            role = (
                self._selected_role
                if self._selected_role and self._selected_role.slug == role_slug
                else _get_role_for_slug(role_slug)
            )
            try:
                validate_reports_to(role, reports_to_user)
            except DjangoValidationError as exc:
                message_dict = exc.message_dict if hasattr(exc, "message_dict") else {}
                reports_errors = message_dict.get("reports_to") or exc.messages
                raise serializers.ValidationError({"reports_to_id": reports_errors})

        if simple_permissions_payload is not None:
            try:
                mapped_permissions, normalized = convert_simple_to_permissions(
                    simple_permissions_payload, attrs.get("permissions")
                )
            except SimplePermissionError as exc:
                raise serializers.ValidationError(
                    {"simple_permissions": [exc.message]}
                ) from exc
            AdminUserCreateSerializer._validate_unique_resources(mapped_permissions)
            attrs["permissions"] = mapped_permissions
            attrs["simple_permissions"] = normalized

        return attrs


class AdminUserUpdateSerializer(serializers.Serializer):
    role_slug = serializers.SlugField(required=False)
    permissions = PermissionEntrySerializer(many=True, required=False)
    simple_permissions = SimplePermissionSerializer(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._selected_role: Optional[RoleCatalog] = None

    def validate(self, attrs):
        simple_permissions_payload = attrs.pop("simple_permissions", None)
        if not attrs and simple_permissions_payload is None:
            raise serializers.ValidationError(
                "At least one of role_slug, permissions or simple_permissions must be provided."
            )
        if simple_permissions_payload is not None:
            try:
                mapped_permissions, normalized = convert_simple_to_permissions(
                    simple_permissions_payload, attrs.get("permissions")
                )
            except SimplePermissionError as exc:
                raise serializers.ValidationError(
                    {"simple_permissions": [exc.message]}
                ) from exc
            AdminUserCreateSerializer._validate_unique_resources(mapped_permissions)
            attrs["permissions"] = mapped_permissions
            attrs["simple_permissions"] = normalized
        return attrs

    def validate_role_slug(self, value):
        role = _get_role_for_slug(value)

        user = self.context.get("user")
        exclude_user_id = user.id if user else None
        try:
            ensure_role_available(role, exclude_user_id=exclude_user_id)
        except DjangoValidationError as exc:
            message_dict = exc.message_dict if hasattr(exc, "message_dict") else {}
            role_errors = message_dict.get("role") or exc.messages
            raise serializers.ValidationError(role_errors)
        self._selected_role = role
        return value

    def validate_permissions(self, value):
        AdminUserCreateSerializer._validate_unique_resources(value)
        return value


def raise_profile_validation_error(exc: DjangoValidationError):
    message_dict = exc.message_dict if hasattr(exc, "message_dict") else {}
    reports_to_errors = message_dict.get("reports_to")
    if reports_to_errors:
        raise serializers.ValidationError({"reports_to_id": reports_to_errors})
    role_errors = message_dict.get("role")
    if role_errors:
        raise serializers.ValidationError({"role_slug": role_errors})
    raise serializers.ValidationError(message_dict or exc.messages)


class OrgNodeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    display_name = serializers.CharField()
    level = serializers.IntegerField()
    parent_id = serializers.IntegerField(allow_null=True)
    role_slug = serializers.CharField(allow_null=True, required=False)
    role_label = serializers.CharField(allow_null=True, required=False)
    children = serializers.SerializerMethodField()

    def get_children(self, instance):
        children = instance.get("children", [])
        serializer = OrgNodeSerializer(children, many=True, context=self.context)
        return serializer.data


class CreateChildUserSerializer(serializers.Serializer):
    parent_id = _ReportsToField(
        queryset=User.objects.all(),
        source="parent",
    )
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    role_slug = serializers.SlugField()
    email = serializers.EmailField(required=False, allow_blank=True)
    initial_permissions = PermissionEntrySerializer(
        many=True, required=False, allow_empty=True
    )
    simple_permissions = SimplePermissionSerializer(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._selected_role: Optional[RoleCatalog] = None

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already in use.")
        return value

    def validate_role_slug(self, value):
        role = _get_role_for_slug(value)
        try:
            ensure_role_available(role)
        except DjangoValidationError as exc:
            message_dict = exc.message_dict if hasattr(exc, "message_dict") else {}
            role_errors = message_dict.get("role") or exc.messages
            raise serializers.ValidationError(role_errors)
        self._selected_role = role
        return value

    def validate_initial_permissions(self, value):
        AdminUserCreateSerializer._validate_unique_resources(value)
        return value

    def validate_parent(self, value):
        try:
            profile = value.profile
        except UserProfile.DoesNotExist as exc:
            raise serializers.ValidationError("Selected parent user lacks a profile.") from exc
        if profile.is_deleted:
            raise serializers.ValidationError("Selected parent user is deleted.")
        return value

    def validate(self, attrs):
        role_slug = attrs.get("role_slug")
        parent = attrs.get("parent")
        simple_permissions_payload = attrs.pop("simple_permissions", None)
        if role_slug:
            role = (
                self._selected_role
                if self._selected_role and self._selected_role.slug == role_slug
                else _get_role_for_slug(role_slug)
            )
            try:
                validate_reports_to(role, parent)
            except DjangoValidationError as exc:
                message_dict = exc.message_dict if hasattr(exc, "message_dict") else {}
                reports_errors = message_dict.get("reports_to") or exc.messages
                raise serializers.ValidationError({"parent_id": reports_errors})
        if simple_permissions_payload is not None:
            try:
                mapped_permissions, normalized = convert_simple_to_permissions(
                    simple_permissions_payload, attrs.get("initial_permissions")
                )
            except SimplePermissionError as exc:
                raise serializers.ValidationError(
                    {"simple_permissions": [exc.message]}
                ) from exc
            AdminUserCreateSerializer._validate_unique_resources(mapped_permissions)
            attrs["initial_permissions"] = mapped_permissions
            attrs["simple_permissions"] = normalized
        return attrs
