from rest_framework import serializers

from ..models import SafetyTeam, TeamMember


class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = [
            "id",
            "team",
            "contractor",
            "unit",
            "section",
            "representative_name",
            "signature_text",
            "tbm_no",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "team"]


class TeamMemberCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = [
            "contractor",
            "unit",
            "section",
            "representative_name",
            "signature_text",
            "tbm_no",
        ]


class SafetyTeamSerializer(serializers.ModelSerializer):
    members = TeamMemberSerializer(many=True, read_only=True)

    class Meta:
        model = SafetyTeam
        fields = [
            "id",
            "project",
            "prepared_by_name",
            "approved_by_name",
            "created_at",
            "updated_at",
            "members",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "members"]
