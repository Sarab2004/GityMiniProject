from rest_framework import filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Contractor, OrgUnit, Person, Project, Section
from ..serializers.reference import (
    ContractorSerializer,
    OrgUnitSerializer,
    PersonSerializer,
    ProjectSerializer,
    SectionSerializer,
)
from .base import AuditModelViewSet


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit projects.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed for admin users
        return request.user and request.user.is_authenticated and request.user.is_staff


class ProjectViewSet(AuditModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filterset_fields = ["is_active", "status"]
    search_fields = ["name", "code"]
    permission_classes = [IsAdminOrReadOnly]


class ContractorViewSet(AuditModelViewSet):
    queryset = Contractor.objects.all()
    serializer_class = ContractorSerializer
    filterset_fields = ["name"]
    search_fields = ["name"]
    permission_classes = [permissions.AllowAny]


class OrgUnitViewSet(AuditModelViewSet):
    queryset = OrgUnit.objects.all()
    serializer_class = OrgUnitSerializer
    search_fields = ["name"]
    permission_classes = [permissions.AllowAny]


class SectionViewSet(AuditModelViewSet):
    queryset = Section.objects.select_related("org_unit").all()
    serializer_class = SectionSerializer
    filterset_fields = ["org_unit"]
    search_fields = ["name"]
    permission_classes = [permissions.AllowAny]


class PersonViewSet(AuditModelViewSet):
    queryset = Person.objects.select_related("contractor").all()
    serializer_class = PersonSerializer
    filterset_fields = ["contractor"]
    search_fields = ["full_name", "role"]
    permission_classes = [permissions.AllowAny]
