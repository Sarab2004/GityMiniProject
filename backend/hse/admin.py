from django.contrib import admin

from .models import (
    ActionForm,
    ActionItem,
    ActionTracking,
    ChangeLog,
    Contractor,
    OrgUnit,
    Person,
    Project,
    RiskRecord,
    SafetyTeam,
    Section,
    TBMAttendee,
    ToolboxMeeting,
    TeamMember,
)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_active", "created_at")
    search_fields = ("code", "name")
    list_filter = ("is_active",)


@admin.register(Contractor)
class ContractorAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)


@admin.register(OrgUnit)
class OrgUnitAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ("name", "org_unit", "created_at")
    list_filter = ("org_unit",)
    search_fields = ("name",)


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("full_name", "role", "contractor", "created_at")
    list_filter = ("contractor",)
    search_fields = ("full_name", "role")


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 1


@admin.register(SafetyTeam)
class SafetyTeamAdmin(admin.ModelAdmin):
    list_display = ("project", "prepared_by_name", "created_at", "is_deleted")
    list_filter = ("project", "is_deleted")
    search_fields = ("project__name", "prepared_by_name")
    inlines = [TeamMemberInline]


@admin.register(RiskRecord)
class RiskRecordAdmin(admin.ModelAdmin):
    list_display = ("project", "process_title", "acceptance", "created_at")
    list_filter = ("project", "acceptance", "legal_status")
    search_fields = ("process_title", "activity_desc")


class ActionItemInline(admin.TabularInline):
    model = ActionItem
    extra = 1


@admin.register(ActionForm)
class ActionFormAdmin(admin.ModelAdmin):
    list_display = ("indicator", "project", "request_type", "effective", "created_at")
    list_filter = ("project", "request_type", "effective")
    search_fields = ("indicator", "requester_name")
    inlines = [ActionItemInline]


@admin.register(ActionTracking)
class ActionTrackingAdmin(admin.ModelAdmin):
    list_display = ("action", "resolved", "effective", "created_at")
    list_filter = ("resolved", "effective")
    search_fields = ("action__indicator", "issue_desc")


@admin.register(ChangeLog)
class ChangeLogAdmin(admin.ModelAdmin):
    list_display = ("action", "subject_text", "date_registered")
    list_filter = ("action",)
    search_fields = ("subject_text", "action__indicator")


class TBMAttendeeInline(admin.TabularInline):
    model = TBMAttendee
    extra = 1


@admin.register(ToolboxMeeting)
class ToolboxMeetingAdmin(admin.ModelAdmin):
    list_display = ("tbm_no", "project", "date")
    list_filter = ("project",)
    search_fields = ("tbm_no", "topic_text")
    inlines = [TBMAttendeeInline]
