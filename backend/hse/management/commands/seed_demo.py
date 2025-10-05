from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from ...models import (
    AcceptanceStatus,
    ActionForm,
    ActionItem,
    ActionTracking,
    ChangeLog,
    Contractor,
    LegalStatus,
    OrgUnit,
    Project,
    RiskRecord,
    SafetyTeam,
    Section,
    TBMAttendee,
    TeamMember,
    ToolboxMeeting,
)
from ...services.indicator import next_indicator
from ...services.risk import calculate_metrics


class Command(BaseCommand):
    help = "Seed demo data for HSE flows"

    def handle(self, *args, **options):
        User = get_user_model()
        user = User.objects.filter(is_superuser=True).first()
        if not user:
            raise CommandError("ابتدا با createsuperuser یک کاربر ادمین بسازید.")

        with transaction.atomic():
            project_np, _ = Project.objects.get_or_create(
                code="NP",
                defaults={"name": "Negin Pars", "is_active": True, "created_by": user},
            )
            Project.objects.get_or_create(
                code="AS",
                defaults={"name": "Acid Sarcheshmeh", "is_active": True, "created_by": user},
            )

            contractor_a, _ = Contractor.objects.get_or_create(name="شرکت الف", defaults={"created_by": user})
            contractor_b, _ = Contractor.objects.get_or_create(name="شرکت ب", defaults={"created_by": user})

            unit_prod, _ = OrgUnit.objects.get_or_create(name="واحد تولید", defaults={"created_by": user})
            unit_hse, _ = OrgUnit.objects.get_or_create(name="واحد HSE", defaults={"created_by": user})
            unit_main, _ = OrgUnit.objects.get_or_create(name="امور Main", defaults={"created_by": user})

            section_cut, _ = Section.objects.get_or_create(
                name="برش",
                org_unit=unit_prod,
                defaults={"created_by": user},
            )
            Section.objects.get_or_create(
                name="بسته بندی",
                org_unit=unit_prod,
                defaults={"created_by": user},
            )
            section_hse, _ = Section.objects.get_or_create(
                name="HSE",
                org_unit=unit_hse,
                defaults={"created_by": user},
            )

            safety_team, _ = SafetyTeam.objects.get_or_create(
                project=project_np,
                defaults={
                    "prepared_by_name": "حسین احمدی",
                    "approved_by_name": "مریم صالحی",
                    "created_by": user,
                },
            )
            TeamMember.objects.get_or_create(
                team=safety_team,
                representative_name="علی رضایی",
                defaults={
                    "contractor": contractor_a,
                    "unit": unit_prod,
                    "section": section_cut,
                    "signature_text": "امضا",
                    "tbm_no": "TBM-1403-027",
                    "created_by": user,
                },
            )
            TeamMember.objects.get_or_create(
                team=safety_team,
                representative_name="سارا مرادی",
                defaults={
                    "contractor": contractor_b,
                    "unit": unit_hse,
                    "section": section_hse,
                    "signature_text": "",
                    "tbm_no": "TBM-1403-027",
                    "created_by": user,
                },
            )

            toolbox, _ = ToolboxMeeting.objects.get_or_create(
                tbm_no="TBM-1403-027",
                defaults={
                    "project": project_np,
                    "date": timezone.now().date(),
                    "topic_text": "کار در ارتفاع",
                    "trainer_text": "کارشناس HSE",
                    "created_by": user,
                },
            )
            TBMAttendee.objects.get_or_create(
                tbm=toolbox,
                full_name="علی رضایی",
                defaults={"role_text": "اپراتور", "signature_text": "", "created_by": user},
            )
            TBMAttendee.objects.get_or_create(
                tbm=toolbox,
                full_name="سارا مرادی",
                defaults={"role_text": "ناظر HSE", "signature_text": "", "created_by": user},
            )

            indicator = next_indicator(project_np.code, f"{timezone.now().year % 100:02d}")
            action, _ = ActionForm.objects.get_or_create(
                indicator=indicator,
                defaults={
                    "project": project_np,
                    "requester_name": "مجتبی نوروزی",
                    "requester_unit_text": "تولید/برش",
                    "request_date": timezone.now().date(),
                    "request_type": "CORRECTIVE",
                    "sources": ["INCIDENTS", "CHECKLIST"],
                    "nonconformity_or_change_desc": "نبود گارد اره",
                    "root_cause_or_goal_desc": "نبود استاندارد",
                    "needs_risk_update": True,
                    "risk_update_date": timezone.now().date(),
                    "creates_knowledge": True,
                    "created_by": user,
                },
            )
            ActionItem.objects.get_or_create(
                action=action,
                description_text="نصب گارد",
                defaults={
                    "resources_text": "واحد تعمیرات",
                    "due_date": timezone.now().date(),
                    "owner_text": "سرپرست تولید",
                    "created_by": user,
                },
            )
            ActionItem.objects.get_or_create(
                action=action,
                description_text="آموزش ایمنی",
                defaults={
                    "resources_text": "واحد آموزش",
                    "due_date": timezone.now().date(),
                    "owner_text": "مسئول HSE",
                    "created_by": user,
                },
            )

            ActionTracking.objects.get_or_create(
                action=action,
                issue_desc="نبود گارد",
                defaults={
                    "action_desc": "نصب گارد جدید",
                    "source": "INCIDENTS",
                    "executor_text": "سرپرست تعمیرات",
                    "due_date": timezone.now().date(),
                    "review_date_1": timezone.now().date(),
                    "resolved": True,
                    "effective": True,
                    "created_by": user,
                },
            )

            action.effective = True
            action.effectiveness_checked_at = timezone.now().date()
            action.effectiveness_method_text = "بازرسی میدانی"
            action.save()

            ChangeLog.objects.get_or_create(
                action=action,
                subject_text="جایگزینی حلال",
                defaults={
                    "date_registered": timezone.now().date(),
                    "date_applied": timezone.now().date(),
                    "owner_text": "واحد خرید",
                    "required_actions_text": "آموزش + MSDS",
                    "related_action_no_text": action.indicator,
                    "notes_text": "",
                    "created_by": user,
                },
            )

            risk_defaults = {
                "unit": unit_prod,
                "section": section_cut,
                "process_title": "برش کاری",
                "activity_desc": "کار با سنگ فرز",
                "routine_flag": "R",
                "hazard_desc": "شکست دیسک",
                "event_desc": "پرتاب قطعه",
                "consequence_desc": "آسیب چشم",
                "root_cause_desc": "گارد معیوب",
                "existing_controls_desc": "عینک ایمنی",
                "inputs": ["INCIDENTS", "NEAR_MISS"],
                "legal_requirement_text": "مجوز",
                "legal_status": LegalStatus.COMPLIANT,
                "risk_type": "SAFETY",
                "A": 2,
                "B": 3,
                "C": 2,
                "S": 8,
                "D": 5,
                "action_number_text": action.indicator,
                "created_by": user,
            }
            metrics = calculate_metrics(2, 3, 2, 8, 5, LegalStatus.COMPLIANT)
            risk_defaults.update(metrics)
            risk, _ = RiskRecord.objects.get_or_create(project=project_np, defaults=risk_defaults)

            ree_metrics = calculate_metrics(1, 3, 1, 6, 3, LegalStatus.COMPLIANT)
            risk.A2 = 1
            risk.B2 = 3
            risk.C2 = 1
            risk.S2 = 6
            risk.D2 = 3
            risk.E2 = ree_metrics["E"]
            risk.P2 = ree_metrics["P"]
            risk.RPN2 = ree_metrics["RPN"]
            risk.acceptance2 = AcceptanceStatus.LOW_ACCEPTABLE
            risk.action_number_text2 = action.indicator
            risk.save()

        self.stdout.write(self.style.SUCCESS("داده‌های نمایشی با موفقیت ایجاد شد."))
        self.stdout.write(f"Project NP id: {project_np.id}")
        self.stdout.write(f"Action id: {action.id}")
        self.stdout.write(f"Risk id: {risk.id}")
        self.stdout.write(f"Safety team id: {safety_team.id}")
