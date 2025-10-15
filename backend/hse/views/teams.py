from accounts.permissions import SimpleArchivePermission
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import SafetyTeam
from ..serializers.teams import SafetyTeamSerializer, TeamMemberCreateSerializer, TeamMemberSerializer
from .base import AuditModelViewSet


class SafetyTeamViewSet(AuditModelViewSet):
    queryset = SafetyTeam.objects.select_related("project").prefetch_related("members")
    serializer_class = SafetyTeamSerializer
    filterset_fields = ["project"]
    permission_classes = [SimpleArchivePermission]

    @action(detail=True, methods=["post"])
    def members(self, request, pk=None):
        team = self.get_object()
        serializer = TeamMemberCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        member = serializer.save(team=team, created_by=request.user)
        output = TeamMemberSerializer(member).data
        return Response(output, status=status.HTTP_201_CREATED)
