from rest_framework import serializers

from ..models import RiskRecord
from ..services.risk import calculate_metrics, ensure_action_number


class RiskRecordSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = RiskRecord
        fields = [
            "id",
            "project",
            "project_name",
            "unit",
            "section",
            "process_title",
            "activity_desc",
            "routine_flag",
            "hazard_desc",
            "event_desc",
            "consequence_desc",
            "root_cause_desc",
            "existing_controls_desc",
            "inputs",
            "legal_requirement_text",
            "legal_status",
            "risk_type",
            "A",
            "B",
            "C",
            "E",
            "S",
            "P",
            "D",
            "RPN",
            "acceptance",
            "action_number_text",
            "A2",
            "B2",
            "C2",
            "E2",
            "S2",
            "P2",
            "D2",
            "RPN2",
            "acceptance2",
            "action_number_text2",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "E",
            "P",
            "RPN",
            "acceptance",
            "E2",
            "P2",
            "RPN2",
            "acceptance2",
            "created_at",
            "updated_at",
            "project_name",
        ]

    def validate(self, attrs):  # type: ignore[override]
        try:
            metrics = calculate_metrics(
                attrs["A"],
                attrs["B"],
                attrs["C"],
                attrs["S"],
                attrs["D"],
                attrs["legal_status"],
            )
            ensure_action_number(attrs.get("action_number_text"), metrics["acceptance"])
        except KeyError as exc:  # pragma: no cover - defensive
            raise serializers.ValidationError({str(exc): "فیلد اجباری است."}) from exc
        except ValueError as exc:
            raise serializers.ValidationError({"action_number_text": str(exc)}) from exc
        attrs.update(metrics)
        return attrs


class RiskReevaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskRecord
        fields = [
            "A2",
            "B2",
            "C2",
            "S2",
            "D2",
            "action_number_text2",
        ]

    def validate(self, attrs):  # type: ignore[override]
        missing = [field for field in ["A2", "B2", "C2", "S2", "D2"] if attrs.get(field) is None]
        if missing:
            raise serializers.ValidationError({missing[0]: "مقدار اجباری است."})
        try:
            metrics = calculate_metrics(
                attrs["A2"],
                attrs["B2"],
                attrs["C2"],
                attrs["S2"],
                attrs["D2"],
                self.instance.legal_status,
            )
            ensure_action_number(attrs.get("action_number_text2"), metrics["acceptance"])
        except ValueError as exc:
            raise serializers.ValidationError({"action_number_text2": str(exc)}) from exc
        attrs["E2"] = metrics["E"]
        attrs["P2"] = metrics["P"]
        attrs["RPN2"] = metrics["RPN"]
        attrs["acceptance2"] = metrics["acceptance"]
        return attrs

    def update(self, instance, validated_data):  # type: ignore[override]
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
