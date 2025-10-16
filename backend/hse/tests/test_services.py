from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from ..models import (
    AcceptanceStatus,
    LegalStatus,
    Project,
    RiskRecord,
    Section,
    OrgUnit,
    Contractor,
    ActionForm,
    ToolboxMeeting,
)
from ..services.indicator import next_indicator
from ..services.risk import calculate_metrics
from ..serializers.actions import ActionEffectivenessSerializer, ActionFormSerializer
from ..serializers.risks import RiskRecordSerializer
from ..serializers.tracking import ToolboxMeetingSerializer


class IndicatorServiceTests(TestCase):
    def test_sequence_increments(self):
        first = next_indicator("NP", "25")
        second = next_indicator("NP", "25")
        self.assertTrue(first.endswith("001"))
        self.assertTrue(second.endswith("002"))
        self.assertNotEqual(first, second)


class RiskServiceTests(TestCase):
    def setUp(self):
        self.project = Project.objects.create(code="NP", name="Central", created_by=None)
        self.unit = OrgUnit.objects.create(name="Unit A", created_by=None)

    def test_calculate_metrics_acceptance_rules(self):
        metrics = calculate_metrics(2, 3, 2, 8, 5, LegalStatus.COMPLIANT)
        self.assertEqual(metrics["E"], 12)
        self.assertEqual(metrics["P"], 4)
        self.assertEqual(metrics["RPN"], 160)
        self.assertEqual(metrics["acceptance"], AcceptanceStatus.HIGH_UNACCEPTABLE)

    def test_serializer_requires_action_when_unacceptable(self):
        data = {
            "project": self.project.pk,
            "unit": self.unit.pk,
            "section": None,
            "process_title": "Test",
            "activity_desc": "Desc",
            "routine_flag": "R",
            "hazard_desc": "Hazard",
            "event_desc": "Event",
            "consequence_desc": "Consequence",
            "root_cause_desc": "Cause",
            "existing_controls_desc": "Controls",
            "inputs": [],
            "legal_requirement_text": "",
            "legal_status": LegalStatus.COMPLIANT,
            "risk_type": "SAFETY",
            "A": 2,
            "B": 3,
            "C": 2,
            "S": 8,
            "D": 5,
        }
        serializer = RiskRecordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("action_number_text", serializer.errors)


class ActionEffectivenessTests(TestCase):
    def setUp(self):
        self.project = Project.objects.create(code="NP", name="Central", created_by=None)
        self.action = ActionForm.objects.create(
            indicator="NP-25-001",
            project=self.project,
            requester_name="Tester",
            requester_unit_text="Unit",
            request_date=timezone.now().date(),
            request_type="CORRECTIVE",
            sources=[],
            nonconformity_or_change_desc="Issue",
            root_cause_or_goal_desc="Cause",
            needs_risk_update=False,
            creates_knowledge=False,
            created_by=None,
        )

    def test_effectiveness_requires_followup(self):
        serializer = ActionEffectivenessSerializer(
            data={
                "checked_at": timezone.now().date(),
                "method_text": "Check",
                "effective": False,
            },
            context={"action": self.action},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("new_action_indicator", serializer.errors)

    def test_effectiveness_updates_action(self):
        serializer = ActionEffectivenessSerializer(
            data={
                "checked_at": timezone.now().date(),
                "method_text": "Check",
                "effective": True,
                "new_action_indicator": "",
            },
            context={"action": self.action},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.action.refresh_from_db()
        self.assertTrue(self.action.effective)


class ActionFormSerializerTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create(username="creator")
        self.project = Project.objects.create(code="NP", name="Central", created_by=self.user)

    def test_accepts_affected_documents(self):
        serializer = ActionFormSerializer(
            data={
                "project": self.project.pk,
                "requester_name": "Tester",
                "requester_unit_text": "Unit",
                "request_date": timezone.now().date().isoformat(),
                "request_type": "CORRECTIVE",
                "sources": ["AUDIT"],
                "nonconformity_or_change_desc": "Issue",
                "root_cause_or_goal_desc": "Cause",
                "affected_documents": ["دستورالعمل نصب", "روش اجرایی جوشکاری"],
                "needs_risk_update": False,
                "creates_knowledge": False,
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save(created_by=self.user)
        self.assertEqual(
            instance.affected_documents,
            ["دستورالعمل نصب", "روش اجرایی جوشکاری"],
        )

    def test_serializer_returns_affected_documents(self):
        action = ActionForm.objects.create(
            indicator="NP-25-050",
            project=self.project,
            requester_name="Tester",
            requester_unit_text="Unit",
            request_date=timezone.now().date(),
            request_type="CORRECTIVE",
            sources=["AUDIT"],
            nonconformity_or_change_desc="Issue",
            root_cause_or_goal_desc="Cause",
            affected_documents=["دستورالعمل نصب", "روش اجرایی جوشکاری"],
            needs_risk_update=False,
            creates_knowledge=False,
            created_by=self.user,
        )

        serializer = ActionFormSerializer(instance=action)
        self.assertEqual(
            serializer.data["affected_documents"],
            ["دستورالعمل نصب", "روش اجرایی جوشکاری"],
        )


class ToolboxMeetingSerializerTests(TestCase):
    def setUp(self):
        self.project = Project.objects.create(code="NP", name="Central", created_by=None)

    def test_accepts_location_and_notes(self):
        serializer = ToolboxMeetingSerializer(
            data={
                "tbm_no": "TBM-1403-027",
                "project": self.project.pk,
                "date": timezone.now().date().isoformat(),
                "topic_text": "ایمنی کار در ارتفاع",
                "trainer_text": "کارشناس ارشد HSE",
                "location_text": "کارگاه A",
                "notes_text": "یادداشت آزمایشی",
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        meeting = serializer.save()
        self.assertEqual(meeting.location_text, "کارگاه A")
        self.assertEqual(meeting.notes_text, "یادداشت آزمایشی")

    def test_serializer_returns_location_and_notes(self):
        meeting = ToolboxMeeting.objects.create(
            tbm_no="TBM-1403-030",
            project=self.project,
            date=timezone.now().date(),
            topic_text="بازآموزی دستورالعمل‌ها",
            trainer_text="سرپرست ایمنی",
            location_text="سالن مونتاژ",
            notes_text="جلسه به صورت عملی برگزار شد.",
        )

        serializer = ToolboxMeetingSerializer(instance=meeting)
        self.assertEqual(serializer.data["location_text"], "سالن مونتاژ")
        self.assertEqual(serializer.data["notes_text"], "جلسه به صورت عملی برگزار شد.")
