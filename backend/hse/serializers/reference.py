from rest_framework import serializers

from ..models import Contractor, OrgUnit, Person, Project, Section


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "code", "name", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ContractorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contractor
        fields = ["id", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class OrgUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ["id", "name", "org_unit", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = [
            "id",
            "full_name",
            "role",
            "phone",
            "email",
            "contractor",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
