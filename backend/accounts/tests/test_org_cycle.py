from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient


@override_settings(ALLOWED_HOSTS=["testserver", "localhost"])
class OrgMoveCycleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpass",
        )
        self.client.force_authenticate(user=self.admin)

        self.root = self._create_user("root_ceo", display_name="Root CEO")
        self.child = self._create_user(
            "child_manager", display_name="Child Manager", manager=self.root
        )

    def _create_user(self, username: str, display_name: str, manager: User | None = None):
        user = User.objects.create_user(username=username, password="test1234")
        profile = user.profile
        profile.display_name = display_name
        profile.reports_to = manager
        profile.save()
        return user

    def test_move_rejects_cycle(self):
        response = self.client.patch(
            f"/api/v1/auth/admin/org/{self.root.id}/move/",
            data={"parent_id": self.child.id},
            format="json",
            HTTP_HOST="localhost",
        )
        self.assertEqual(response.status_code, 400)

        self.root.refresh_from_db()
        self.assertIsNone(self.root.profile.reports_to)
