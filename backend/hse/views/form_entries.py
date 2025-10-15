from __future__ import annotations

from typing import Any, Dict

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import SimpleArchivePermission
from ..forms_registry import get_form_entry_by_code


class FormEntryView(APIView):
    permission_classes = [SimpleArchivePermission]

    def _resolve_entry(self, form_code: str) -> Dict[str, Any]:
        entry = get_form_entry_by_code(form_code)
        if not entry:
            return {}
        if not entry.get("model") or not entry.get("serializer"):
            return {}
        return entry

    def get(self, request: Request, form_code: str, pk: int, *args, **kwargs) -> Response:
        entry = self._resolve_entry(form_code)
        if not entry:
            return Response({"detail": "فرم موردنظر یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        model = entry["model"]
        serializer_class = entry["serializer"]
        instance = get_object_or_404(model.objects.all(), pk=pk, is_deleted=False)
        serializer = serializer_class(instance, context={"request": request})
        return Response(
            {
                "form_type": entry["form_type"],
                "form_code": entry["form_code"],
                "form_title": entry["form_title"],
                "data": serializer.data,
            }
        )

    def put(self, request: Request, form_code: str, pk: int, *args, **kwargs) -> Response:
        return self._update(request, form_code, pk, partial=False)

    def patch(self, request: Request, form_code: str, pk: int, *args, **kwargs) -> Response:
        return self._update(request, form_code, pk, partial=True)

    def delete(self, request: Request, form_code: str, pk: int, *args, **kwargs) -> Response:
        entry = self._resolve_entry(form_code)
        if not entry:
            return Response({"detail": "فرم موردنظر یافت نشد."}, status=status.HTTP_404_NOT_FOUND)
        model = entry["model"]
        instance = get_object_or_404(model.objects.all(), pk=pk, is_deleted=False)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _update(self, request: Request, form_code: str, pk: int, *, partial: bool) -> Response:
        entry = self._resolve_entry(form_code)
        if not entry:
            return Response({"detail": "فرم موردنظر یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        model = entry["model"]
        serializer_class = entry["serializer"]
        instance = get_object_or_404(model.objects.all(), pk=pk, is_deleted=False)
        serializer = serializer_class(
            instance,
            data=request.data,
            partial=partial,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "form_type": entry["form_type"],
                "form_code": entry["form_code"],
                "form_title": entry["form_title"],
                "data": serializer.data,
            }
        )
