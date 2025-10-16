from rest_framework import serializers

from ..models import Contractor, OrgUnit, Person, Project, ProjectStatus, Section


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id", 
            "code", 
            "name", 
            "status", 
            "start_date", 
            "end_date", 
            "description",
            "is_active", 
            "created_at", 
            "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_code(self, value):
        """Validate code uniqueness and length"""
        if len(value) > 20:
            raise serializers.ValidationError("کد پروژه نمی‌تواند بیش از 20 کاراکتر باشد.")
        return value

    def validate_name(self, value):
        """Validate name length"""
        if len(value) > 120:
            raise serializers.ValidationError("نام پروژه نمی‌تواند بیش از 120 کاراکتر باشد.")
        return value

    def validate_description(self, value):
        """Validate description length"""
        if value and len(value) > 500:
            raise serializers.ValidationError("توضیحات نمی‌تواند بیش از 500 کاراکتر باشد.")
        return value

    def validate(self, data):
        """Validate date order"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'تاریخ پایان باید بعد از تاریخ شروع باشد.'
            })
        
        return data


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
