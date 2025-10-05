from rest_framework import serializers

from ..models import ActionTracking, ChangeLog, TBMAttendee, ToolboxMeeting


class ActionTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionTracking
        fields = [
            "id",
            "action",
            "issue_desc",
            "action_desc",
            "source",
            "executor_text",
            "due_date",
            "review_date_1",
            "review_date_2",
            "review_date_3",
            "resolved",
            "is_knowledge",
            "effective",
            "new_action_indicator",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChangeLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChangeLog
        fields = [
            "id",
            "action",
            "subject_text",
            "date_registered",
            "date_applied",
            "owner_text",
            "required_actions_text",
            "related_action_no_text",
            "notes_text",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ToolboxMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolboxMeeting
        fields = [
            "id",
            "tbm_no",
            "project",
            "date",
            "topic_text",
            "trainer_text",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TBMAttendeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TBMAttendee
        fields = [
            "id",
            "tbm",
            "full_name",
            "role_text",
            "signature_text",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "tbm", "created_at", "updated_at"]
