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
            "contact_info",
            "signature_text",
            "tbm_no",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "team"]


class TeamMemberCreateSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        attrs = super().validate(attrs)

        def sanitize_required(value: str, max_length: int) -> str:
            trimmed = value.strip()
            return trimmed[:max_length]

        def sanitize_optional(value: str | None, max_length: int) -> str | None:
            if value is None:
                return None
            trimmed = value.strip()
            if not trimmed:
                return None
            return trimmed[:max_length]

        representative = attrs.get("representative_name")
        if representative:
            attrs["representative_name"] = sanitize_required(representative, 60)

        signature = sanitize_optional(attrs.get("signature_text"), 255)
        attrs["signature_text"] = signature or ""

        tbm_no = sanitize_optional(attrs.get("tbm_no"), 50)
        attrs["tbm_no"] = tbm_no or ""

        attrs["contact_info"] = sanitize_optional(attrs.get("contact_info"), 80)

        return attrs

    class Meta:
        model = TeamMember
        fields = [
            "contractor",
            "unit",
            "section",
            "representative_name",
            "contact_info",
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
