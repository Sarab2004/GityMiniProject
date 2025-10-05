from django.conf import settings
from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return super().update(is_deleted=True, updated_at=timezone.now())

    def hard_delete(self):
        return super().delete()

    def alive(self):
        return self.filter(is_deleted=False)


class SoftDeleteManager(models.Manager.from_queryset(SoftDeleteQuerySet)):  # type: ignore[misc]
    def get_queryset(self):
        return super().get_queryset().alive()


class AuditModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_created",
    )
    is_deleted = models.BooleanField(default=False)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):  # type: ignore[override]
        self.is_deleted = True
        self.save(update_fields=["is_deleted", "updated_at"])


class TimeStampedModel(AuditModel):
    class Meta:
        abstract = True


class NamedModel(TimeStampedModel):
    name = models.CharField(max_length=255)

    class Meta:
        abstract = True


class CodeNamedModel(NamedModel):
    code = models.CharField(max_length=50, unique=True)

    class Meta:
        abstract = True
