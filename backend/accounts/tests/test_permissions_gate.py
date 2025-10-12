from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import PermissionEntry


@override_settings(ALLOWED_HOSTS=["testserver", "localhost"])
class HasResourcePermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def _create_user_with_permission(self, username: str, can_create: bool) -> User:
        user = User.objects.create_user(username=username, password="test1234")
        profile = user.profile
        profile.display_name = username
        profile.save(update_fields=["display_name", "updated_at"])

        PermissionEntry.objects.filter(user=user, resource="forms").delete()
        PermissionEntry.objects.create(
            user=user,
            resource="forms",
            can_create=can_create,
            can_read=can_create,
            can_update=can_create,
            can_delete=False,
        )
        return user

    def test_create_denied_without_permission(self):
        denied_user = self._create_user_with_permission("denied_user", can_create=False)
        self.client.force_authenticate(user=denied_user)

        response = self.client.post(
            "/api/v1/actions/",
            data={},
            format="json",
            HTTP_HOST="localhost",
        )
        self.assertEqual(response.status_code, 403)

    def test_create_allowed_with_permission(self):
        allowed_user = self._create_user_with_permission("allowed_user", can_create=True)
        self.client.force_authenticate(user=allowed_user)

        response = self.client.post(
            "/api/v1/actions/",
            data={},
            format="json",
            HTTP_HOST="localhost",
        )
        self.assertNotEqual(response.status_code, 403)
