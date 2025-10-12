from django.contrib.auth import authenticate, get_user_model, login, logout
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import parsers, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PermissionEntry, UserProfile, RESOURCE_CHOICES
from .serializers import (
    AdminUserCreateSerializer,
    AdminUserSerializer,
    AdminUserUpdateSerializer,
    AuthUserSerializer,
    CreateChildUserSerializer,
    LoginSerializer,
    OrgNodeSerializer,
    PermissionEntrySerializer,
    raise_profile_validation_error,
    _ReportsToField,
)

User = get_user_model()


def _truthy_param(value):
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    return str(value).lower() in {"1", "true", "yes", "on"}


def _replace_permissions(user, permissions_payload):
    PermissionEntry.objects.filter(user=user).delete()
    if not permissions_payload:
        if hasattr(user, "_prefetched_objects_cache"):
            user._prefetched_objects_cache.pop("resource_permissions", None)
        return

    PermissionEntry.objects.bulk_create(
        [
            PermissionEntry(
                user=user,
                resource=entry["resource"],
                can_create=entry.get("can_create", False),
                can_read=entry.get("can_read", False),
                can_update=entry.get("can_update", False),
                can_delete=entry.get("can_delete", False),
            )
            for entry in permissions_payload
        ]
    )
    if hasattr(user, "_prefetched_objects_cache"):
        user._prefetched_objects_cache.pop("resource_permissions", None)


def _soft_delete_user(user):
    if user.is_active:
        user.is_active = False
        user.save(update_fields=["is_active"])

    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return

    if not profile.is_deleted:
        profile.is_deleted = True
        profile.save(update_fields=["is_deleted", "updated_at"])


def _compute_profile_level(profile):
    level = 0
    manager = profile.reports_to
    visited = set()
    while manager:
        manager_id = manager.id
        if manager_id is None or manager_id in visited:
            break
        visited.add(manager_id)
        level += 1
        try:
            manager_profile = manager.profile
        except UserProfile.DoesNotExist:
            break
        if manager_profile.is_deleted:
            break
        manager = manager_profile.reports_to
    return level


def _profile_to_node(profile):
    return {
        "id": profile.user_id,
        "display_name": profile.display_name,
        "level": _compute_profile_level(profile),
        "parent_id": profile.reports_to_id,
        "children": [],
    }


def _build_org_tree(root_only):
    profiles = (
        UserProfile.objects.filter(is_deleted=False, user__is_active=True)
        .select_related("user", "reports_to")
        .order_by("user__id")
    )

    node_map = {}
    for profile in profiles:
        node_map[profile.user_id] = {
            "id": profile.user_id,
            "display_name": profile.display_name,
            "level": 0,
            "parent_id": profile.reports_to_id,
            "children": [],
        }

    roots = []
    for profile in profiles:
        node = node_map[profile.user_id]
        parent_id = profile.reports_to_id
        if parent_id and parent_id in node_map:
            node_map[parent_id]["children"].append(node)
        else:
            roots.append(node)

    def assign_levels(node, level):
        node["level"] = level
        node["children"].sort(key=lambda child: (child["display_name"].lower(), child["id"]))
        for child in node["children"]:
            assign_levels(child, level + 1)

    for root in roots:
        assign_levels(root, 0)

    if root_only:
        return [
            {
                "id": root["id"],
                "display_name": root["display_name"],
                "level": root["level"],
                "parent_id": root["parent_id"],
                "children": [],
            }
            for root in roots
        ]

    return roots


class CsrfEnsureMixin:
    @method_decorator(ensure_csrf_cookie)
    def dispatch(self, request, *args, **kwargs):  # type: ignore[override]
        return super().dispatch(request, *args, **kwargs)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.JSONParser, parsers.FormParser, parsers.MultiPartParser]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "??? ?????? ?? ??? ???? ?????? ???."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        login(request, user)
        return Response({"user": AuthUserSerializer(user).data}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if request.user.is_authenticated:
            logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(CsrfEnsureMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response({"user": AuthUserSerializer(request.user).data})
        return Response(
            {"detail": "????? ???? ???? ?????? ????."},
            status=status.HTTP_401_UNAUTHORIZED,
        )


class MePermissionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        permissions_map = {
            resource: {
                "create": False,
                "read": False,
                "update": False,
                "delete": False,
            }
            for resource, _ in RESOURCE_CHOICES
        }

        entries = (
            PermissionEntry.objects.filter(user=request.user)
            .only(
                "resource",
                "can_create",
                "can_read",
                "can_update",
                "can_delete",
            )
        )
        for entry in entries:
            if entry.resource not in permissions_map:
                continue
            permissions_map[entry.resource] = {
                "create": bool(entry.can_create),
                "read": bool(entry.can_read),
                "update": bool(entry.can_update),
                "delete": bool(entry.can_delete),
            }

        return Response(permissions_map)


class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        queryset = (
            User.objects.all()
            .select_related("profile")
            .prefetch_related("resource_permissions")
        )
        search_term = self.request.query_params.get("search")
        if search_term:
            queryset = queryset.filter(
                Q(username__icontains=search_term)
                | Q(profile__display_name__icontains=search_term)
            )
        return queryset.order_by("id")

    def get_serializer_class(self):
        if self.action == "create":
            return AdminUserCreateSerializer
        if self.action in {"partial_update", "update"}:
            return AdminUserUpdateSerializer
        return AdminUserSerializer

    def update(self, request, *args, **kwargs):
        raise MethodNotAllowed("PUT")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        permissions_payload = validated_data.pop("permissions", None)
        reports_to_user = validated_data.pop("reports_to_user", None)
        password = validated_data.pop("password")
        display_name = validated_data.pop("display_name").strip()
        email = validated_data.pop("email", "").strip()
        username = validated_data.pop("username")

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
            )
            profile = getattr(user, "profile", None)
            if profile is None:
                profile = UserProfile.objects.create(
                    user=user, display_name=display_name
                )
            profile.display_name = display_name
            profile.reports_to = reports_to_user
            profile.is_deleted = False
            try:
                profile.save()
            except DjangoValidationError as exc:
                raise_profile_validation_error(exc)

            if permissions_payload is not None:
                AdminUserCreateSerializer._validate_unique_resources(
                    permissions_payload
                )
                _replace_permissions(user, permissions_payload)

        user.refresh_from_db()
        response_serializer = AdminUserSerializer(
            user, context=self.get_serializer_context()
        )
        headers = self.get_success_headers(response_serializer.data)
        return Response(
            response_serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        with transaction.atomic():
            if "display_name" in validated_data:
                profile = getattr(user, "profile", None)
                display_name = validated_data["display_name"].strip()
                if profile is None:
                    profile = UserProfile.objects.create(
                        user=user, display_name=display_name
                    )
                else:
                    profile.display_name = display_name
                try:
                    profile.save()
                except DjangoValidationError as exc:
                    raise_profile_validation_error(exc)

            if "permissions" in validated_data:
                AdminUserCreateSerializer._validate_unique_resources(
                    validated_data["permissions"]
                )
                _replace_permissions(user, validated_data["permissions"])

        user.refresh_from_db()
        response_serializer = AdminUserSerializer(
            user, context=self.get_serializer_context()
        )
        return Response(response_serializer.data)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        hard_delete = _truthy_param(request.query_params.get("hard"))

        if hard_delete:
            return super().destroy(request, *args, **kwargs)

        with transaction.atomic():
            _soft_delete_user(user)

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get", "put"], url_path="permissions")
    def permissions(self, request, pk=None):
        user = self.get_object()
        if request.method == "GET":
            serializer = PermissionEntrySerializer(
                user.resource_permissions.all(), many=True
            )
            return Response(serializer.data)

        serializer = PermissionEntrySerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        AdminUserCreateSerializer._validate_unique_resources(
            serializer.validated_data
        )

        with transaction.atomic():
            _replace_permissions(user, serializer.validated_data)

        refreshed = PermissionEntrySerializer(
            user.resource_permissions.all(), many=True
        )
        return Response(refreshed.data)


class MovePayloadSerializer(serializers.Serializer):
    parent_id = _ReportsToField(
        queryset=User.objects.all(), allow_null=True, required=False, source="parent"
    )

    def validate_parent(self, value):
        if value is None:
            return value
        try:
            profile = value.profile
        except UserProfile.DoesNotExist as exc:
            raise serializers.ValidationError(
                "Selected parent user lacks a profile."
            ) from exc
        if profile.is_deleted:
            raise serializers.ValidationError("Selected parent user is deleted.")
        return value


class RenamePayloadSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=150)

    def validate_display_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Display name cannot be blank.")
        return cleaned


class OrganizationViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.select_related("profile", "profile__reports_to")

    @action(detail=False, methods=["get"], url_path="tree")
    def tree(self, request):
        root_only = _truthy_param(request.query_params.get("root_only"))
        nodes = _build_org_tree(root_only=root_only)
        serializer = OrgNodeSerializer(nodes, many=True, context=self.get_serializer_context())
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="children")
    def create_child(self, request):
        serializer = CreateChildUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        parent = validated_data["parent"]
        username = validated_data["username"]
        password = validated_data["password"]
        display_name = validated_data["display_name"].strip()
        email = validated_data.get("email", "").strip()
        permissions_payload = validated_data.get("initial_permissions")

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
            )
            profile = getattr(user, "profile", None)
            if profile is None:
                profile = UserProfile.objects.create(user=user, display_name=display_name)
            profile.display_name = display_name
            profile.reports_to = parent
            profile.is_deleted = False
            try:
                profile.save()
            except DjangoValidationError as exc:
                raise_profile_validation_error(exc)

            if permissions_payload is not None:
                _replace_permissions(user, permissions_payload)

        node = _profile_to_node(profile)
        serializer = OrgNodeSerializer(node, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="move")
    def move(self, request, pk=None):
        user = self.get_object()
        serializer = MovePayloadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_parent = serializer.validated_data.get("parent")

        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            return Response(
                {"detail": "User profile not found."}, status=status.HTTP_400_BAD_REQUEST
            )

        profile.reports_to = new_parent
        try:
            profile.save()
        except DjangoValidationError as exc:
            raise_profile_validation_error(exc)

        node = _profile_to_node(profile)
        serializer = OrgNodeSerializer(node, context=self.get_serializer_context())
        return Response(serializer.data)

    @action(detail=True, methods=["patch"], url_path="rename")
    def rename(self, request, pk=None):
        user = self.get_object()
        serializer = RenamePayloadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        display_name = serializer.validated_data["display_name"]

        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile(user=user)

        profile.display_name = display_name
        try:
            profile.save()
        except DjangoValidationError as exc:
            raise_profile_validation_error(exc)

        node = _profile_to_node(profile)
        serializer = OrgNodeSerializer(node, context=self.get_serializer_context())
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        force = _truthy_param(request.query_params.get("force"))

        active_children = UserProfile.objects.filter(
            reports_to=user,
            is_deleted=False,
            user__is_active=True,
        ).exists()

        if active_children and not force:
            return Response(
                {"detail": "Cannot delete a node that has active subordinates."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            _soft_delete_user(user)

        return Response(status=status.HTTP_204_NO_CONTENT)
