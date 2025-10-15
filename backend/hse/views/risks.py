from accounts.permissions import SimpleArchivePermission
import django_filters
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import RiskRecord
from ..serializers.risks import RiskRecordSerializer, RiskReevaluationSerializer
from .base import AuditModelViewSet


class RiskRecordFilter(django_filters.FilterSet):
    created_at_from = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_at_to = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = RiskRecord
        fields = ["project", "acceptance"]


class RiskRecordViewSet(AuditModelViewSet):
    queryset = RiskRecord.objects.select_related("project", "unit", "section")
    serializer_class = RiskRecordSerializer
    filterset_class = RiskRecordFilter
    search_fields = ["process_title", "activity_desc"]
    permission_classes = [SimpleArchivePermission]

    @action(detail=True, methods=["post"], url_path="reeval")
    def reeval(self, request, pk=None):
        risk = self.get_object()
        serializer = RiskReevaluationSerializer(instance=risk, data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(RiskRecordSerializer(risk).data)

    def perform_create(self, serializer):  # type: ignore[override]
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):  # type: ignore[override]
        serializer.save()

    def perform_destroy(self, instance):  # type: ignore[override]
        instance.delete()
