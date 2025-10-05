from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as django_filters
from django.db.models import Q

from ..models import (
    ActionForm, ActionTracking, ChangeLog, 
    ToolboxMeeting, SafetyTeam, RiskRecord
)
from ..serializers.archive import ArchiveFormSerializer


class ArchiveFormFilter(django_filters.FilterSet):
    project = django_filters.CharFilter(field_name='project__code')
    form_type = django_filters.CharFilter(method='filter_form_type')

    class Meta:
        model = None  # We'll handle this dynamically
        fields = ['project', 'form_type']

    def filter_form_type(self, queryset, name, value):
        # This will be handled in the view
        return queryset


class ArchiveViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for archive functionality that aggregates all form types
    """
    serializer_class = ArchiveFormSerializer
    filterset_class = ArchiveFormFilter
    permission_classes = [permissions.AllowAny]  # Allow access for now, can be changed to IsAuthenticated later

    def get_queryset(self):
        # Get all forms from different models
        archive_forms = []
        
        # Action Forms
        action_forms = ActionForm.objects.filter(is_deleted=False).select_related('project')
        for form in action_forms:
            archive_forms.append({
                'id': f'action_{form.id}',
                'form_type': 'action',
                'form_number': form.indicator,
                'project': form.project.code,
                'created_at': form.created_at,
                'status': 'active',
                'data': {
                    'indicator': form.indicator,
                    'requester_name': form.requester_name,
                    'requester_unit': form.requester_unit_text,
                    'request_date': form.request_date.isoformat(),
                    'request_type': form.request_type,
                    'nonconformity_desc': form.nonconformity_or_change_desc,
                    'root_cause_desc': form.root_cause_or_goal_desc,
                    'needs_risk_update': form.needs_risk_update,
                    'creates_knowledge': form.creates_knowledge,
                }
            })

        # Action Tracking
        tracking_forms = ActionTracking.objects.filter(is_deleted=False).select_related('action__project')
        for form in tracking_forms:
            archive_forms.append({
                'id': f'tracking_{form.id}',
                'form_type': 'tracking',
                'form_number': f'TR-{form.id}',
                'project': form.action.project.code,
                'created_at': form.created_at,
                'status': 'active',
                'data': {
                    'action_indicator': form.action.indicator,
                    'issue_desc': form.issue_desc,
                    'action_desc': form.action_desc,
                    'source': form.source,
                    'executor': form.executor_text,
                    'due_date': form.due_date.isoformat(),
                    'resolved': form.resolved,
                    'is_knowledge': form.is_knowledge,
                    'effective': form.effective,
                }
            })

        # Change Logs
        change_forms = ChangeLog.objects.filter(is_deleted=False).select_related('action__project')
        for form in change_forms:
            archive_forms.append({
                'id': f'change_{form.id}',
                'form_type': 'change',
                'form_number': f'CH-{form.id}',
                'project': form.action.project.code,
                'created_at': form.created_at,
                'status': 'active',
                'data': {
                    'action_indicator': form.action.indicator,
                    'subject': form.subject_text,
                    'date_registered': form.date_registered.isoformat(),
                    'date_applied': form.date_applied.isoformat(),
                    'owner': form.owner_text,
                    'required_actions': form.required_actions_text,
                    'related_action_no': form.related_action_no_text,
                    'notes': form.notes_text,
                }
            })

        # TBM Forms
        tbm_forms = ToolboxMeeting.objects.filter(is_deleted=False).select_related('project')
        for form in tbm_forms:
            archive_forms.append({
                'id': f'tbm_{form.id}',
                'form_type': 'tbm',
                'form_number': form.tbm_no,
                'project': form.project.code,
                'created_at': form.created_at,
                'status': 'active',
                'data': {
                    'topic': form.topic_text,
                    'trainer': form.trainer_text,
                    'date': form.date.isoformat(),
                    'attendees_count': form.attendees.count(),
                }
            })

        # Safety Teams
        team_forms = SafetyTeam.objects.filter(is_deleted=False).select_related('project')
        for form in team_forms:
            archive_forms.append({
                'id': f'team_{form.id}',
                'form_type': 'team',
                'form_number': f'ST-{form.id}',
                'project': form.project.code,
                'created_at': form.created_at,
                'status': 'active',
                'data': {
                    'prepared_by': form.prepared_by_name,
                    'approved_by': form.approved_by_name,
                    'members_count': form.members.count(),
                }
            })

        # Risk Records
        risk_forms = RiskRecord.objects.filter(is_deleted=False).select_related('project')
        for form in risk_forms:
            archive_forms.append({
                'id': f'risk_{form.id}',
                'form_type': 'risk',
                'form_number': f'RK-{form.id}',
                'project': form.project.code,
                'created_at': form.created_at,
                'status': 'active',
                'data': {
                    'process_title': form.process_title,
                    'activity_desc': form.activity_desc,
                    'hazard_desc': form.hazard_desc,
                    'event_desc': form.event_desc,
                    'consequence_desc': form.consequence_desc,
                    'root_cause_desc': form.root_cause_desc,
                    'existing_controls_desc': form.existing_controls_desc,
                    'legal_requirement_text': form.legal_requirement_text,
                    'legal_status': form.legal_status,
                    'risk_type': form.risk_type,
                    'A': form.A,
                    'B': form.B,
                    'C': form.C,
                    'E': form.E,
                    'S': form.S,
                    'P': form.P,
                    'D': form.D,
                    'RPN': form.RPN,
                    'acceptance': form.acceptance,
                    'action_number': form.action_number_text,
                }
            })

        # Apply filters
        project_filter = self.request.query_params.get('project')
        form_type_filter = self.request.query_params.get('form_type')

        if project_filter:
            archive_forms = [f for f in archive_forms if f['project'] == project_filter]
        
        if form_type_filter:
            archive_forms = [f for f in archive_forms if f['form_type'] == form_type_filter]

        # Sort by created_at descending
        archive_forms.sort(key=lambda x: x['created_at'], reverse=True)
        
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

    @action(detail=True, methods=['delete'])
    def soft_delete(self, request, pk=None):
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
