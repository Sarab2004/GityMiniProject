from django.db import models

from common.models import CodeNamedModel, NamedModel, TimeStampedModel


class Project(CodeNamedModel):
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class Contractor(NamedModel):
    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class OrgUnit(NamedModel):
    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Section(NamedModel):
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.CASCADE, related_name="sections")

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.org_unit.name} / {self.name}"


class Person(TimeStampedModel):
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=120)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    contractor = models.ForeignKey(Contractor, on_delete=models.SET_NULL, null=True, blank=True, related_name="persons")

    class Meta:
        ordering = ["full_name"]

    def __str__(self) -> str:
        return self.full_name


class SafetyTeam(TimeStampedModel):
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="safety_teams")
    prepared_by_name = models.CharField(max_length=255)
    approved_by_name = models.CharField(max_length=255)

    class Meta:
        indexes = [
            models.Index(fields=["project", "is_deleted"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"Safety team {self.project.code}"


class TeamMember(TimeStampedModel):
    team = models.ForeignKey(SafetyTeam, on_delete=models.CASCADE, related_name="members")
    contractor = models.ForeignKey(Contractor, on_delete=models.SET_NULL, null=True, blank=True)
    unit = models.ForeignKey(OrgUnit, on_delete=models.SET_NULL, null=True, blank=True)
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True)
    representative_name = models.CharField(max_length=255)
    signature_text = models.CharField(max_length=255, blank=True)
    tbm_no = models.CharField(max_length=50, blank=True)

    class Meta:
        indexes = [models.Index(fields=["team"])]

    def __str__(self) -> str:
        return self.representative_name


class RoutineFlag(models.TextChoices):
    ROUTINE = "R", "Routine"
    NON_ROUTINE = "N", "Non Routine"


class LegalStatus(models.TextChoices):
    COMPLIANT = "COMPLIANT", "Compliant"
    NONCOMPLIANT = "NONCOMPLIANT", "Non Compliant"


class RiskType(models.TextChoices):
    SAFETY = "SAFETY", "Safety"
    HEALTH = "HEALTH", "Health"
    PROPERTY = "PROPERTY", "Property"


class AcceptanceStatus(models.TextChoices):
    LOW_ACCEPTABLE = "L_ACCEPTABLE", "Low acceptable"
    HIGH_UNACCEPTABLE = "H_UNACCEPTABLE", "High unacceptable"
    LEGAL_NONCOMPLIANT = "LEGAL_NONCOMPLIANT", "Legal noncompliant"


class RiskRecord(TimeStampedModel):
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="risks")
    unit = models.ForeignKey(OrgUnit, on_delete=models.PROTECT, related_name="risks")
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name="risks")
    process_title = models.CharField(max_length=255)
    activity_desc = models.TextField()
    routine_flag = models.CharField(max_length=1, choices=RoutineFlag.choices)
    hazard_desc = models.TextField()
    event_desc = models.TextField()
    consequence_desc = models.TextField()
    root_cause_desc = models.TextField()
    existing_controls_desc = models.TextField()
    inputs = models.JSONField(default=list, blank=True)
    legal_requirement_text = models.TextField(blank=True)
    legal_status = models.CharField(max_length=20, choices=LegalStatus.choices)
    risk_type = models.CharField(max_length=20, choices=RiskType.choices)
    A = models.PositiveIntegerField()
    B = models.PositiveIntegerField()
    C = models.PositiveIntegerField()
    E = models.PositiveIntegerField(editable=False)
    S = models.PositiveIntegerField()
    P = models.PositiveIntegerField(editable=False)
    D = models.PositiveIntegerField()
    RPN = models.PositiveIntegerField(editable=False)
    acceptance = models.CharField(max_length=40, choices=AcceptanceStatus.choices)
    action_number_text = models.CharField(max_length=50, blank=True, null=True)
    A2 = models.PositiveIntegerField(null=True, blank=True)
    B2 = models.PositiveIntegerField(null=True, blank=True)
    C2 = models.PositiveIntegerField(null=True, blank=True)
    E2 = models.PositiveIntegerField(null=True, blank=True)
    S2 = models.PositiveIntegerField(null=True, blank=True)
    P2 = models.PositiveIntegerField(null=True, blank=True)
    D2 = models.PositiveIntegerField(null=True, blank=True)
    RPN2 = models.PositiveIntegerField(null=True, blank=True)
    acceptance2 = models.CharField(max_length=40, choices=AcceptanceStatus.choices, null=True, blank=True)
    action_number_text2 = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["project", "is_deleted"]),
            models.Index(fields=["acceptance"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.project.code} - {self.process_title}"


class RequestType(models.TextChoices):
    CORRECTIVE = "CORRECTIVE", "Corrective"
    PREVENTIVE = "PREVENTIVE", "Preventive"
    CHANGE = "CHANGE", "Change"
    SUGGESTION = "SUGGESTION", "Suggestion"


class ActionForm(TimeStampedModel):
    indicator = models.CharField(max_length=7, unique=True)
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="actions")
    requester_name = models.CharField(max_length=255)
    requester_unit_text = models.CharField(max_length=255)
    request_date = models.DateField()
    request_type = models.CharField(max_length=20, choices=RequestType.choices)
    sources = models.JSONField(default=list, blank=True)
    nonconformity_or_change_desc = models.TextField()
    root_cause_or_goal_desc = models.TextField()
    needs_risk_update = models.BooleanField(default=False)
    risk_update_date = models.DateField(null=True, blank=True)
    creates_knowledge = models.BooleanField(default=False)
    approved_by_performer_name = models.CharField(max_length=255, null=True, blank=True)
    approved_by_manager_name = models.CharField(max_length=255, null=True, blank=True)
    exec1_approved = models.BooleanField(null=True, blank=True)
    exec1_note = models.TextField(null=True, blank=True)
    exec1_new_date = models.DateField(null=True, blank=True)
    exec2_approved = models.BooleanBooleanField = models.BooleanField
    exec2_approved = models.BooleanField(null=True, blank=True)
    exec2_note = models.TextField(null=True, blank=True)
    exec2_new_date = models.DateField(null=True, blank=True)
    effectiveness_checked_at = models.DateField(null=True, blank=True)
    effectiveness_method_text = models.TextField(null=True, blank=True)
    effective = models.BooleanField(null=True, blank=True)
    new_action_indicator = models.CharField(max_length=7, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["indicator"]),
            models.Index(fields=["project", "is_deleted"]),
            models.Index(fields=["request_type"]),
            models.Index(fields=["effective"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return self.indicator


class ActionItem(TimeStampedModel):
    action = models.ForeignKey(ActionForm, on_delete=models.CASCADE, related_name="items")
    description_text = models.TextField()
    resources_text = models.TextField()
    due_date = models.DateField()
    owner_text = models.CharField(max_length=255)

    class Meta:
        indexes = [models.Index(fields=["action"])]

    def __str__(self) -> str:
        return self.description_text


class TrackingSource(models.TextChoices):
    AUDIT = "AUDIT", "AUDIT"
    LEGAL = "LEGAL", "LEGAL"
    PROCESS_RISKS = "PROCESS_RISKS", "PROCESS_RISKS"
    INCIDENTS = "INCIDENTS", "INCIDENTS"
    NEAR_MISS = "NEAR_MISS", "NEAR_MISS"
    UNSAFE_CONDITION = "UNSAFE_CONDITION", "UNSAFE_CONDITION"
    UNSAFE_ACT = "UNSAFE_ACT", "UNSAFE_ACT"
    CHECKLIST = "CHECKLIST", "CHECKLIST"
    HSE_RISKS = "HSE_RISKS", "HSE_RISKS"
    ENV_ASPECTS = "ENV_ASPECTS", "ENV_ASPECTS"
    MGT_REVIEW = "MGT_REVIEW", "MGT_REVIEW"
    OTHER = "OTHER", "OTHER"


class ActionTracking(TimeStampedModel):
    action = models.ForeignKey(ActionForm, on_delete=models.CASCADE, related_name="trackings")
    issue_desc = models.TextField()
    action_desc = models.TextField()
    source = models.CharField(max_length=30, choices=TrackingSource.choices)
    executor_text = models.CharField(max_length=255)
    due_date = models.DateField()
    review_date_1 = models.DateField(null=True, blank=True)
    review_date_2 = models.DateField(null=True, blank=True)
    review_date_3 = models.DateField(null=True, blank=True)
    resolved = models.BooleanField(null=True, blank=True)
    is_knowledge = models.BooleanField(null=True, blank=True)
    effective = models.BooleanField(null=True, blank=True)
    new_action_indicator = models.CharField(max_length=7, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["action", "is_deleted"]),
            models.Index(fields=["resolved"]),
            models.Index(fields=["effective"]),
        ]

    def __str__(self) -> str:
        return f"Tracking {self.action.indicator}"


class ChangeLog(TimeStampedModel):
    action = models.ForeignKey(ActionForm, on_delete=models.CASCADE, related_name="changes")
    subject_text = models.TextField()
    date_registered = models.DateField()
    date_applied = models.DateField()
    owner_text = models.CharField(max_length=255)
    required_actions_text = models.TextField()
    related_action_no_text = models.CharField(max_length=50, blank=True)
    notes_text = models.TextField(blank=True)

    class Meta:
        indexes = [models.Index(fields=["action", "is_deleted"])]

    def __str__(self) -> str:
        return f"Change {self.action.indicator}"


class ToolboxMeeting(TimeStampedModel):
    tbm_no = models.CharField(max_length=50, unique=True)
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="toolbox_meetings")
    date = models.DateField()
    topic_text = models.CharField(max_length=255)
    trainer_text = models.CharField(max_length=255)

    class Meta:
        indexes = [models.Index(fields=["project", "is_deleted"])]

    def __str__(self) -> str:
        return self.tbm_no


class TBMAttendee(TimeStampedModel):
    tbm = models.ForeignKey(ToolboxMeeting, on_delete=models.CASCADE, related_name="attendees")
    full_name = models.CharField(max_length=255)
    role_text = models.CharField(max_length=255)
    signature_text = models.CharField(max_length=255, blank=True)

    class Meta:
        indexes = [models.Index(fields=["tbm"])]

    def __str__(self) -> str:
        return self.full_name


class SequenceCounter(models.Model):
    origin_code = models.CharField(max_length=10)
    year2 = models.CharField(max_length=2)
    last_serial = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("origin_code", "year2")

    def __str__(self) -> str:
        return f"{self.origin_code}-{self.year2}: {self.last_serial}"
