from rest_framework import viewsets, permissions


class CreatedByMixin:
    def perform_create(self, serializer):  # type: ignore[override]
        serializer.save(created_by=self.request.user)


class AuditModelViewSet(CreatedByMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
