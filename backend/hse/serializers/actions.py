from rest_framework import serializers

from ..models import ActionForm, ActionItem


class ActionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionItem
        fields = [
            "id",
            "action",
            "description_text",
            "resources_text",
            "due_date",
            "owner_text",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "action", "created_at", "updated_at"]


class ActionItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionItem
        fields = ["description_text", "resources_text", "due_date", "owner_text"]


class ActionFormSerializer(serializers.ModelSerializer):
    items = ActionItemSerializer(many=True, read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = ActionForm
        fields = [
            "id",
            "indicator",
            "project",
            "project_name",
            "requester_name",
            "requester_unit_text",
            "request_date",
            "request_type",
            "sources",
            "nonconformity_or_change_desc",
            "root_cause_or_goal_desc",
            "needs_risk_update",
            "risk_update_date",
            "creates_knowledge",
            "approved_by_performer_name",
            "approved_by_manager_name",
            "exec1_approved",
            "exec1_note",
            "exec1_new_date",
            "exec2_approved",
            "exec2_note",
            "exec2_new_date",
            "effectiveness_checked_at",
            "effectiveness_method_text",
            "effective",
            "new_action_indicator",
            "created_at",
            "updated_at",
            "items",
        ]
        read_only_fields = [
            "id",
            "indicator",
            "exec1_approved",
            "exec1_note",
            "exec1_new_date",
            "exec2_approved",
            "exec2_note",
            "exec2_new_date",
            "effectiveness_checked_at",
            "effectiveness_method_text",
            "effective",
            "new_action_indicator",
            "created_at",
            "updated_at",
            "items",
            "project_name",
        ]


class ActionExecutionSerializer(serializers.Serializer):
    report_no = serializers.ChoiceField(choices=[1, 2])
    approved = serializers.BooleanField()
    note = serializers.CharField(allow_blank=True, required=False)
    new_date = serializers.DateField(required=False, allow_null=True)

    def save(self, **kwargs):  # type: ignore[override]
        action: ActionForm = self.context["action"]
        if self.validated_data["report_no"] == 1:
            action.exec1_approved = self.validated_data["approved"]
            action.exec1_note = self.validated_data.get("note", "")
            action.exec1_new_date = self.validated_data.get("new_date")
        else:
            action.exec2_approved = self.validated_data["approved"]
            action.exec2_note = self.validated_data.get("note", "")
            action.exec2_new_date = self.validated_data.get("new_date")
        action.save()
        return action


class ActionEffectivenessSerializer(serializers.Serializer):
    checked_at = serializers.DateField()
    method_text = serializers.CharField(allow_blank=True)
    effective = serializers.BooleanField()
    new_action_indicator = serializers.CharField(allow_blank=True, required=False)

    def validate(self, attrs):  # type: ignore[override]
        if not attrs["effective"] and not attrs.get("new_action_indicator"):
            raise serializers.ValidationError(
                {"new_action_indicator": "???? ????? ???????? ??? ????? ????? ???? ?????? ???."}
            )
        return attrs

    def save(self, **kwargs):  # type: ignore[override]
        action: ActionForm = self.context["action"]
        action.effectiveness_checked_at = self.validated_data["checked_at"]
        action.effectiveness_method_text = self.validated_data["method_text"]
        action.effective = self.validated_data["effective"]
        action.new_action_indicator = self.validated_data.get("new_action_indicator")
        action.save()
        return action
