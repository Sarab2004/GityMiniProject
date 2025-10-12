from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

# اجازه به hostهای تست برای جلوگیری از DisallowedHost
settings.ALLOWED_HOSTS = list(set(settings.ALLOWED_HOSTS or []) | {"testserver","localhost","127.0.0.1"})

User = get_user_model()

def ensure_user(username, is_admin=False, password="Xx_ap1_!234"):
    u, _ = User.objects.get_or_create(username=username, defaults={"is_active": True})
    if not u.has_usable_password(): 
        u.set_password(password)
    if is_admin:
        u.is_staff = True; u.is_superuser = True
    else:
        u.is_staff = False; u.is_superuser = False
    u.is_active = True
    u.save()
    return u

admin = ensure_user("seed_ceo", is_admin=True)     # اگر وجود دارد همان استفاده می‌شود
viewer = ensure_user("viewer_demo", is_admin=False)

def get_profile(u):
    c = APIClient(); c.force_login(u); c.defaults["HTTP_HOST"]="localhost"
    r = c.get("/api/v1/auth/me/profile/")   # مهم: اسلش پایانی
    print(f"{u.username}: status={r.status_code}, ct={r.get('Content-Type')}, body={r.content[:120]}")
    return r

r1 = get_profile(admin)
r2 = get_profile(viewer)

assert r1.status_code == 200 and r1.json()["is_staff"] is True and r1.json()["is_superuser"] is True, "admin flags mismatch"
assert r2.status_code == 200 and r2.json()["is_staff"] is False and r2.json()["is_superuser"] is False, "viewer flags mismatch"

print("\n backend /me/profile OK for admin & viewer")
