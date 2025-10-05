import django_filters
from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import ActionTracking, ChangeLog, ToolboxMeeting
from ..serializers.tracking import (
    ActionTrackingSerializer,
    ChangeLogSerializer,
    TBMAttendeeSerializer,
    ToolboxMeetingSerializer,
)
from .base import AuditModelViewSet


class ActionTrackingFilter(django_filters.FilterSet):
    class Meta:
        model = ActionTracking
        fields = {
            "action": ["exact"],
            "resolved": ["exact"],
            "effective": ["exact"],
        }


class ActionTrackingViewSet(AuditModelViewSet):
    queryset = ActionTracking.objects.select_related("action")
    serializer_class = ActionTrackingSerializer
    filterset_class = ActionTrackingFilter
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):  # type: ignore[override]
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):  # type: ignore[override]
        instance.delete()


class ChangeLogFilter(django_filters.FilterSet):
    class Meta:
        model = ChangeLog
        fields = {"action": ["exact"]}


class ChangeLogViewSet(AuditModelViewSet):
    queryset = ChangeLog.objects.select_related("action")
    serializer_class = ChangeLogSerializer
    filterset_class = ChangeLogFilter
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):  # type: ignore[override]
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):  # type: ignore[override]
        instance.delete()


class ToolboxMeetingFilter(django_filters.FilterSet):
    class Meta:
        model = ToolboxMeeting
        fields = {"project": ["exact"]}


class ToolboxMeetingViewSet(AuditModelViewSet):
    queryset = ToolboxMeeting.objects.select_related("project").prefetch_related("attendees")
    serializer_class = ToolboxMeetingSerializer
    filterset_class = ToolboxMeetingFilter
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=["post"], url_path="attendees")
    def add_attendee(self, request, pk=None):
        meeting = self.get_object()
        serializer = TBMAttendeeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        attendee = serializer.save(tbm=meeting, created_by=request.user)
        return Response(TBMAttendeeSerializer(attendee).data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):  # type: ignore[override]
        instance.delete()
