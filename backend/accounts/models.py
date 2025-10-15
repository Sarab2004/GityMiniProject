from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models


RESOURCE_CHOICES = [
    ("forms", "Forms"),
    ("actions", "CorrectiveActions"),
    ("archive", "Archive"),
]


class RoleCatalog(models.Model):
    slug = models.SlugField(max_length=64, unique=True)
    label = models.CharField(max_length=150)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="children",
    )
    is_unique = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["label"]
        verbose_name = "Role"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.label


class UserProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.ForeignKey(
        RoleCatalog,
        on_delete=models.PROTECT,
        related_name="profiles",
        null=True,
        blank=True,
    )
    display_name = models.CharField(max_length=150)
    reports_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="subordinates",
        null=True,
        blank=True,
    )
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()
        if not self.reports_to:
            return

        manager = self.reports_to
        visited_user_ids = {self.user_id} if self.user_id else set()

        while manager is not None:
            manager_id = manager.id
            if manager_id is None:
                break
            if manager_id in visited_user_ids:
                raise ValidationError(
                    {"reports_to": "Cannot create a reporting cycle for this user."}
                )
            visited_user_ids.add(manager_id)

            try:
                manager_profile = manager.profile
            except UserProfile.DoesNotExist:
                break

            manager = manager_profile.reports_to

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        role_label = self.role.label if self.role else "بدون نقش"
        return f"{self.display_name} ({self.user.username}) - {role_label}"


class PermissionEntry(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="resource_permissions",
    )
    resource = models.CharField(max_length=50, choices=RESOURCE_CHOICES)
    can_create = models.BooleanField(default=False)
    can_read = models.BooleanField(default=False)
    can_update = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "resource")

    def __str__(self):
        return f"{self.user.username} -> {self.get_resource_display()}"
