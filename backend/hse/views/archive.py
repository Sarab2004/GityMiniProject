from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as django_filters
from accounts.permissions import SimpleArchivePermission
from ..models import (
    ActionForm,
    ActionTracking,
    ChangeLog,
    ToolboxMeeting,
    SafetyTeam,
    RiskRecord,
)
from ..serializers.archive import ArchiveFormSerializer
from ..forms_registry import get_form_metadata


class ArchiveFormFilter(django_filters.FilterSet):
    project = django_filters.CharFilter(field_name='project__code')
    form_type = django_filters.CharFilter(method='filter_form_type')

    class Meta:
        model = None  # We'll handle this dynamically
        fields = ['project', 'form_type']

    def filter_form_type(self, queryset, name, value):
        # This will be handled in the view
        return queryset


class ArchiveViewSet(viewsets.ModelViewSet):
    """
    ViewSet for archive functionality that aggregates all form types
    """
    serializer_class = ArchiveFormSerializer
    filterset_class = ArchiveFormFilter
    permission_classes = [SimpleArchivePermission]

    @staticmethod
    def _serialize_created_by(obj):
        user = getattr(obj, "created_by", None)
        if not user:
            return None
        profile = getattr(user, "profile", None)
        display_name = getattr(profile, "display_name", None) if profile else None
        if not display_name:
            display_name = user.get_full_name() or user.username
        return {
            "id": user.id,
            "username": user.username,
            "display_name": display_name,
        }
    
    def create(self, request, *args, **kwargs):
        return Response({'error': 'Create not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
    def update(self, request, *args, **kwargs):
        return Response({'error': 'Update not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
    def partial_update(self, request, *args, **kwargs):
        return Response({'error': 'Partial update not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def get_queryset(self):
        archive_forms = []

        def add_entry(form_type, obj, form_number, project_code, status, payload):
            meta = get_form_metadata(form_type)
            archive_forms.append(
                {
                    "id": f"{form_type}_{obj.id}",
                    "form_type": form_type,
                    "form_code": meta["form_code"],
                    "form_title": meta["form_title"],
                    "form_number": form_number,
                    "entry_id": obj.id,
                    "project": project_code,
                    "created_at": obj.created_at,
                    "created_by": self._serialize_created_by(obj),
                    "status": status,
                    "data": payload,
                }
            )

        action_forms = ActionForm.objects.filter(is_deleted=False).select_related("project")
        for form in action_forms:
            add_entry(
                "action",
                form,
                form.indicator,
                form.project.code if form.project else None,
                "submitted",
                {
                    "indicator": form.indicator,
                    "requester_name": form.requester_name,
                    "requester_unit": form.requester_unit_text,
                    "request_date": form.request_date.isoformat(),
                    "request_type": form.request_type,
                    "nonconformity_desc": form.nonconformity_or_change_desc,
                    "root_cause_desc": form.root_cause_or_goal_desc,
                    "needs_risk_update": form.needs_risk_update,
                    "creates_knowledge": form.creates_knowledge,
                },
            )

        tracking_forms = ActionTracking.objects.filter(is_deleted=False).select_related("action__project")
        for form in tracking_forms:
            add_entry(
                "tracking",
                form,
                f"TR-{form.id}",
                form.action.project.code if form.action and form.action.project else None,
                "submitted",
                {
                    "action_indicator": form.action.indicator if form.action else None,
                    "issue_desc": form.issue_desc,
                    "action_desc": form.action_desc,
                    "source": form.source,
                    "executor": form.executor_text,
                    "due_date": form.due_date.isoformat(),
                    "resolved": form.resolved,
                    "is_knowledge": form.is_knowledge,
                    "effective": form.effective,
                },
            )

        change_forms = ChangeLog.objects.filter(is_deleted=False).select_related("action__project")
        for form in change_forms:
            add_entry(
                "change",
                form,
                f"CH-{form.id}",
                form.action.project.code if form.action and form.action.project else None,
                "submitted",
                {
                    "action_indicator": form.action.indicator if form.action else None,
                    "subject": form.subject_text,
                    "date_registered": form.date_registered.isoformat(),
                    "date_applied": form.date_applied.isoformat(),
                    "owner": form.owner_text,
                    "required_actions": form.required_actions_text,
                    "related_action_no": form.related_action_no_text,
                    "notes": form.notes_text,
                },
            )

        tbm_forms = ToolboxMeeting.objects.filter(is_deleted=False).select_related("project")
        for form in tbm_forms:
            add_entry(
                "tbm",
                form,
                form.tbm_no,
                form.project.code if form.project else None,
                "submitted",
                {
                    "topic": form.topic_text,
                    "trainer": form.trainer_text,
                    "date": form.date.isoformat(),
                    "attendees_count": form.attendees.count(),
                },
            )

        team_forms = SafetyTeam.objects.filter(is_deleted=False).select_related("project")
        for form in team_forms:
            add_entry(
                "team",
                form,
                f"ST-{form.id}",
                form.project.code if form.project else None,
                "submitted",
                {
                    "prepared_by": form.prepared_by_name,
                    "approved_by": form.approved_by_name,
                    "members_count": form.members.count(),
                },
            )

        risk_forms = RiskRecord.objects.filter(is_deleted=False).select_related("project")
        for form in risk_forms:
            add_entry(
                "risk",
                form,
                f"RK-{form.id}",
                form.project.code if form.project else None,
                "submitted",
                {
                    "process_title": form.process_title,
                    "activity_desc": form.activity_desc,
                    "hazard_desc": form.hazard_desc,
                    "event_desc": form.event_desc,
                    "consequence_desc": form.consequence_desc,
                    "root_cause_desc": form.root_cause_desc,
                    "existing_controls_desc": form.existing_controls_desc,
                    "legal_requirement_text": form.legal_requirement_text,
                    "legal_status": form.legal_status,
                    "risk_type": form.risk_type,
                    "A": form.A,
                    "B": form.B,
                    "C": form.C,
                    "E": form.E,
                    "S": form.S,
                    "P": form.P,
                    "D": form.D,
                    "RPN": form.RPN,
                    "acceptance": form.acceptance,
                    "action_number": form.action_number_text,
                },
            )

        project_filter = self.request.query_params.get("project")
        form_type_filter = self.request.query_params.get("form_type")

        if project_filter:
            archive_forms = [f for f in archive_forms if f["project"] == project_filter]

        if form_type_filter:
            archive_forms = [f for f in archive_forms if f["form_type"] == form_type_filter]

        archive_forms.sort(key=lambda x: x["created_at"], reverse=True)

        return archive_forms

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        # Extract the ID and type from the composite ID
        composite_id = kwargs.get('pk')
        if '_' not in composite_id:
            return Response({'error': 'Invalid ID format'}, status=status.HTTP_400_BAD_REQUEST)
        
        form_type, form_id = composite_id.split('_', 1)
        
        # Get the specific form based on type
        queryset = self.get_queryset()
        form = next((f for f in queryset if f['id'] == composite_id), None)
        
        if not form:
            return Response({'error': 'Form not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(form)
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        """Soft delete a form by setting is_deleted=True"""
        composite_id = pk
        if '_' not in composite_id:
            return Response({'error': 'Invalid ID format'}, status=status.HTTP_400_BAD_REQUEST)
        
        form_type, form_id = composite_id.split('_', 1)
        
        try:
            if form_type == 'action':
                form = ActionForm.objects.get(id=form_id)
            elif form_type == 'tracking':
                form = ActionTracking.objects.get(id=form_id)
            elif form_type == 'change':
                form = ChangeLog.objects.get(id=form_id)
            elif form_type == 'tbm':
                form = ToolboxMeeting.objects.get(id=form_id)
            elif form_type == 'team':
                form = SafetyTeam.objects.get(id=form_id)
            elif form_type == 'risk':
                form = RiskRecord.objects.get(id=form_id)
            else:
                return Response({'error': 'Invalid form type'}, status=status.HTTP_400_BAD_REQUEST)
            
            form.is_deleted = True
            form.save()
            
            return Response({'message': 'Form deleted successfully'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
