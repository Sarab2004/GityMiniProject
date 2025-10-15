from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views.actions import ActionFormViewSet
from .views.reference import ContractorViewSet, OrgUnitViewSet, PersonViewSet, ProjectViewSet, SectionViewSet
from .views.risks import RiskRecordViewSet
from .views.teams import SafetyTeamViewSet
from .views.tracking import ActionTrackingViewSet, ChangeLogViewSet, ToolboxMeetingViewSet
from .views.completed import CompletedActionsView, CompletedRisksView
from .views.archive import ArchiveViewSet
from .views.form_entries import FormEntryView

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="projects")
router.register(r"contractors", ContractorViewSet, basename="contractors")
router.register(r"org-units", OrgUnitViewSet, basename="org-units")
router.register(r"sections", SectionViewSet, basename="sections")
router.register(r"persons", PersonViewSet, basename="persons")
router.register(r"safety-teams", SafetyTeamViewSet, basename="safety-teams")
router.register(r"risks", RiskRecordViewSet, basename="risks")
router.register(r"actions", ActionFormViewSet, basename="actions")
router.register(r"action-trackings", ActionTrackingViewSet, basename="action-trackings")
router.register(r"changes", ChangeLogViewSet, basename="changes")
router.register(r"tbm", ToolboxMeetingViewSet, basename="tbm")
router.register(r"archive", ArchiveViewSet, basename="archive")

urlpatterns = [
    path("", include(router.urls)),
    path("forms/<str:form_code>/entries/<int:pk>/", FormEntryView.as_view(), name="form-entry"),
    path("completed/risks", CompletedRisksView.as_view(), name="completed-risks"),
    path("completed/actions", CompletedActionsView.as_view(), name="completed-actions"),
]
