from rest_framework import serializers


class ArchiveFormSerializer(serializers.Serializer):
    id = serializers.CharField()
    form_type = serializers.CharField()
    form_code = serializers.CharField()
    entry_id = serializers.IntegerField()
    form_title = serializers.CharField()
    form_number = serializers.CharField()
    project = serializers.CharField()
    created_at = serializers.DateTimeField()
    created_by = serializers.DictField(allow_null=True)
    status = serializers.CharField()
    data = serializers.DictField()
