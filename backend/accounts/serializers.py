from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import PermissionEntry, UserProfile


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


class AdminUserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source="profile.display_name")
    reports_to_id = serializers.IntegerField(
        source="profile.reports_to_id", allow_null=True
    )
    permissions = PermissionEntrySerializer(
        source="resource_permissions", many=True, read_only=True
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "is_active",
            "display_name",
            "reports_to_id",
            "permissions",
        ]


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
    display_name = serializers.CharField(max_length=150)
    reports_to_id = _ReportsToField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
        source="reports_to_user",
    )
    permissions = PermissionEntrySerializer(many=True, required=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already in use.")
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
        # Ensure display name is not empty or whitespace
        display_name = attrs.get("display_name")
        if display_name and not display_name.strip():
            raise serializers.ValidationError(
                {"display_name": "Display name cannot be blank."}
            )
        return attrs


class AdminUserUpdateSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=150, required=False)
    permissions = PermissionEntrySerializer(many=True, required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "At least one of display_name or permissions must be provided."
            )
        return attrs

    def validate_display_name(self, value):
        if value and not value.strip():
            raise serializers.ValidationError("Display name cannot be blank.")
        return value

    def validate_permissions(self, value):
        AdminUserCreateSerializer._validate_unique_resources(value)
        return value


def raise_profile_validation_error(exc: DjangoValidationError):
    message_dict = exc.message_dict if hasattr(exc, "message_dict") else {}
    reports_to_errors = message_dict.get("reports_to")
    if reports_to_errors:
        raise serializers.ValidationError({"reports_to_id": reports_to_errors})
    raise serializers.ValidationError(message_dict or exc.messages)


class OrgNodeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    display_name = serializers.CharField()
    level = serializers.IntegerField()
    parent_id = serializers.IntegerField(allow_null=True)
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
    display_name = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    initial_permissions = PermissionEntrySerializer(
        many=True, required=False, allow_empty=True
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already in use.")
        return value

    def validate_display_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Display name cannot be blank.")
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
