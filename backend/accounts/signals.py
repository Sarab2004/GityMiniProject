from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserProfile


@receiver(post_save, sender=User)
def ensure_user_profile(sender, instance, **kwargs):
    display_name = (instance.get_full_name() or "").strip() or instance.username
    UserProfile.objects.get_or_create(
        user=instance,
        defaults={"display_name": display_name},
    )
