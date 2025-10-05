import django_filters
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import ActionForm
from ..serializers.actions import (
    ActionEffectivenessSerializer,
    ActionExecutionSerializer,
    ActionFormSerializer,
    ActionItemCreateSerializer,
    ActionItemSerializer,
)
from ..serializers.tracking import ActionTrackingSerializer
from ..services.indicator import next_indicator
from .base import AuditModelViewSet


class ActionFormFilter(django_filters.FilterSet):
    class Meta:
        model = ActionForm
        fields = {
            "project": ["exact"],
            "request_type": ["exact"],
            "indicator": ["exact"],
            "effective": ["exact"],
        }


class ActionFormViewSet(AuditModelViewSet):
    queryset = ActionForm.objects.select_related("project").prefetch_related("items", "trackings")
    serializer_class = ActionFormSerializer
    filterset_class = ActionFormFilter
    search_fields = ["indicator", "requester_name", "nonconformity_or_change_desc"]

    def perform_create(self, serializer):  # type: ignore[override]
        project = serializer.validated_data["project"]
        request_date = serializer.validated_data.get("request_date") or timezone.now().date()
        year2 = f"{request_date.year % 100:02d}"
        origin = (project.code or "AA")[:2]
        indicator_value = next_indicator(origin, year2)
        serializer.save(created_by=self.request.user, indicator=indicator_value)

    @action(detail=True, methods=["post"], url_path="items")
    def add_item(self, request, pk=None):
        action = self.get_object()
        serializer = ActionItemCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        item = serializer.save(action=action, created_by=request.user)
        return Response(ActionItemSerializer(item).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="execution-report")
    def execution_report(self, request, pk=None):
        action = self.get_object()
        serializer = ActionExecutionSerializer(data=request.data, context={"action": action, "request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ActionFormSerializer(action).data)

    @action(detail=True, methods=["post"], url_path="effectiveness")
    def effectiveness(self, request, pk=None):
        action = self.get_object()
        serializer = ActionEffectivenessSerializer(data=request.data, context={"action": action, "request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ActionFormSerializer(action).data)

    def perform_destroy(self, instance):  # type: ignore[override]
        instance.delete()
