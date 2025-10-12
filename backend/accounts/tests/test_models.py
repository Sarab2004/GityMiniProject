from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.test import TestCase


class UserProfileModelTests(TestCase):
    def test_reports_to_cycle_validation(self):
        manager = User.objects.create_user(username="manager", password="test1234")
        subordinate = User.objects.create_user(
            username="subordinate", password="test1234"
        )

        subordinate_profile = subordinate.profile
        subordinate_profile.reports_to = manager
        subordinate_profile.save()

        manager_profile = manager.profile
        manager_profile.reports_to = subordinate

        with self.assertRaises(ValidationError):
            manager_profile.save()
