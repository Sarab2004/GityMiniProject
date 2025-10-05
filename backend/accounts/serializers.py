from django.contrib.auth import get_user_model
from rest_framework import serializers


User = get_user_model()


class AuthUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name"]

    def get_full_name(self, obj):
        full_name = obj.get_full_name()
        return full_name or obj.username


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class MessageSerializer(serializers.Serializer):
    detail = serializers.CharField()
