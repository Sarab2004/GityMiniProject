from rest_framework import serializers


class ArchiveFormSerializer(serializers.Serializer):
    id = serializers.CharField()
    form_type = serializers.CharField()
    form_number = serializers.CharField()
    project = serializers.CharField()
    created_at = serializers.DateTimeField()
    status = serializers.CharField()
    data = serializers.DictField()
