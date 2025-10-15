from django.core.management.base import BaseCommand

from accounts.role_utils import ensure_roles_exist


class Command(BaseCommand):
    help = "Seed default role catalog entries."

    def handle(self, *args, **options):
        roles = ensure_roles_exist()
        self.stdout.write(self.style.SUCCESS("Seeded roles:"))
        for slug, role in roles.items():
            parent = role.parent.slug if role.parent else "-"
            unique_label = "Unique" if role.is_unique else "Multiple"
            self.stdout.write(
                f"- {slug}: {role.label} (parent={parent}, {unique_label})"
            )
