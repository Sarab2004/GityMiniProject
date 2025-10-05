from rest_framework import filters

from ..models import Contractor, OrgUnit, Person, Project, Section
from ..serializers.reference import (
    ContractorSerializer,
    OrgUnitSerializer,
    PersonSerializer,
    ProjectSerializer,
    SectionSerializer,
)
from .base import AuditModelViewSet


class ProjectViewSet(AuditModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filterset_fields = ["is_active"]
    search_fields = ["name", "code"]


class ContractorViewSet(AuditModelViewSet):
    queryset = Contractor.objects.all()
    serializer_class = ContractorSerializer
    filterset_fields = ["name"]
    search_fields = ["name"]


class OrgUnitViewSet(AuditModelViewSet):
    queryset = OrgUnit.objects.all()
    serializer_class = OrgUnitSerializer
    search_fields = ["name"]


class SectionViewSet(AuditModelViewSet):
    queryset = Section.objects.select_related("org_unit").all()
    serializer_class = SectionSerializer
    filterset_fields = ["org_unit"]
    search_fields = ["name"]


class PersonViewSet(AuditModelViewSet):
    queryset = Person.objects.select_related("contractor").all()
    serializer_class = PersonSerializer
    filterset_fields = ["contractor"]
    search_fields = ["full_name", "role"]
