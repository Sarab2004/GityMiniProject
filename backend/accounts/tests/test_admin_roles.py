from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.role_utils import ensure_roles_exist


@override_settings(ALLOWED_HOSTS=["testserver", "localhost"])
class AdminRoleAssignmentTests(TestCase):
    def setUp(self):
        ensure_roles_exist()
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="StrongPass123!",
        )
        self.client.force_authenticate(user=self.admin)

    def _create_user(
        self,
        username: str,
        role_slug: str,
        *,
        reports_to_id: int | None = None,
    ):
        payload = {
            "username": username,
            "password": "TestPass123!",
            "role_slug": role_slug,
            "permissions": [],
        }
        if reports_to_id is not None:
            payload["reports_to_id"] = reports_to_id
        response = self.client.post(
            "/api/v1/auth/admin/users/",
            data=payload,
            format="json",
            HTTP_HOST="localhost",
        )
        return response

    def test_second_hse_manager_creation_rejected(self):
        ceo_response = self._create_user("ceo_user", "ceo")
        self.assertEqual(ceo_response.status_code, 201)
        ceo_id = ceo_response.data["id"]

        first_manager = self._create_user(
            "manager_one", "hse_manager", reports_to_id=ceo_id
        )
        self.assertEqual(first_manager.status_code, 201)

        second_manager = self._create_user(
            "manager_two", "hse_manager", reports_to_id=ceo_id
        )
        self.assertEqual(second_manager.status_code, 400)
        self.assertIn("role_slug", second_manager.data)
        self.assertIn("مدیر HSE فقط یک بار مجاز است.", second_manager.data["role_slug"][0])

    def test_display_name_scoped_by_manager(self):
        ceo_response = self._create_user("ceo_root", "ceo")
        self.assertEqual(ceo_response.status_code, 201)
        ceo_id = ceo_response.data["id"]

        hse_manager = self._create_user(
            "hse_manager_user", "hse_manager", reports_to_id=ceo_id
        )
        self.assertEqual(hse_manager.status_code, 201)
        manager_id = hse_manager.data["id"]

        safety_parent_a = self._create_user(
            "safety_a", "safety_expert", reports_to_id=manager_id
        )
        self.assertEqual(safety_parent_a.status_code, 201)
        parent_a_id = safety_parent_a.data["id"]

        safety_parent_b = self._create_user(
            "safety_b", "safety_expert", reports_to_id=manager_id
        )
        self.assertEqual(safety_parent_b.status_code, 201)
        parent_b_id = safety_parent_b.data["id"]

        officer_one = self._create_user(
            "officer_a1", "hse_officer", reports_to_id=parent_a_id
        )
        self.assertEqual(officer_one.status_code, 201)
        self.assertEqual(officer_one.data["display_name"], "HSE Officer")

        officer_two = self._create_user(
            "officer_a2", "hse_officer", reports_to_id=parent_a_id
        )
        self.assertEqual(officer_two.status_code, 201)
        self.assertEqual(officer_two.data["display_name"], "HSE Officer ۲")

        officer_three = self._create_user(
            "officer_b1", "hse_officer", reports_to_id=parent_b_id
        )
        self.assertEqual(officer_three.status_code, 201)
        self.assertEqual(officer_three.data["display_name"], "HSE Officer")
