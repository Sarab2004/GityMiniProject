from django.test import TestCase

from ..models import Project, SafetyTeam, TeamMember
from ..serializers.teams import SafetyTeamSerializer, TeamMemberCreateSerializer


class SafetyTeamSerializerTests(TestCase):
    def setUp(self) -> None:
        self.project = Project.objects.create(code="NP", name="New Project", created_by=None)
        self.team = SafetyTeam.objects.create(
            project=self.project,
            prepared_by_name="تهیه‌کننده",
            approved_by_name="تأییدکننده",
            created_by=None,
        )

    def test_serialized_member_includes_contact_info(self) -> None:
        member = TeamMember.objects.create(
            team=self.team,
            representative_name="عضو اول",
            contact_info="09121234567",
            signature_text="امضا",
            tbm_no="TBM-1403-001",
            created_by=None,
        )

        data = SafetyTeamSerializer(self.team).data
        self.assertEqual(len(data["members"]), 1)
        self.assertEqual(data["members"][0]["id"], member.id)
        self.assertEqual(data["members"][0]["contact_info"], "09121234567")

    def test_create_serializer_trims_and_nulls_blank_contact_info(self) -> None:
        serializer = TeamMemberCreateSerializer(
            data={
                "representative_name": "عضو دوم",
                "contact_info": "   ",
                "signature_text": "  ",
                "tbm_no": "",
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        member = serializer.save(team=self.team, created_by=None)
        self.assertIsNone(member.contact_info)
        self.assertEqual(member.signature_text, "")
