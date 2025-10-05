from django.db import models
from rest_framework.generics import ListAPIView

from ..models import AcceptanceStatus, ActionForm, RiskRecord
from ..serializers.actions import ActionFormSerializer
from ..serializers.risks import RiskRecordSerializer


class CompletedRisksView(ListAPIView):
    serializer_class = RiskRecordSerializer

    def get_queryset(self):  # type: ignore[override]
        qs = RiskRecord.objects.select_related("project", "unit", "section")
        return qs.filter(
            (
                models.Q(acceptance2=AcceptanceStatus.LOW_ACCEPTABLE)
                | (models.Q(acceptance=AcceptanceStatus.LOW_ACCEPTABLE) & models.Q(acceptance2__isnull=True))
            ),
            is_deleted=False,
        )


class CompletedActionsView(ListAPIView):
    serializer_class = ActionFormSerializer

    def get_queryset(self):  # type: ignore[override]
        return ActionForm.objects.select_related("project").filter(effective=True, is_deleted=False)
