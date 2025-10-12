import json
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from accounts.models import PermissionEntry

# allow APIClient host
if "testserver" not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append("testserver")

User = get_user_model()
client = APIClient()

# ---------- helpers ----------
def j(resp):
    try:
        return json.dumps(resp.json(), ensure_ascii=False)
    except Exception:
        return resp.content.decode("utf-8","ignore")

def login(u):
    client.force_login(u)

# ---------- users ----------
# u_denied: بدون forms.create
u_denied, _ = User.objects.get_or_create(username="perm_denied_user")
if not u_denied.has_usable_password():
    u_denied.set_password("Xx_ap1_!234"); u_denied.save()
PermissionEntry.objects.filter(user=u_denied, resource="forms").delete()
PermissionEntry.objects.get_or_create(user=u_denied, resource="forms", defaults={
    "can_create": False, "can_read": False, "can_update": False, "can_delete": False
})

# u_allowed: با forms.create=True
u_allowed, _ = User.objects.get_or_create(username="perm_allowed_user")
if not u_allowed.has_usable_password():
    u_allowed.set_password("Xx_ap1_!234"); u_allowed.save()
pe, _ = PermissionEntry.objects.get_or_create(user=u_allowed, resource="forms", defaults={
    "can_create": True, "can_read": True, "can_update": False, "can_delete": False
})
# اطمینان از True بودن create
if not pe.can_create:
    pe.can_create = True; pe.can_read = True; pe.save()

# ---------- 1) /api/v1/auth/me/permissions ----------
login(u_denied)
resp = client.get("/api/v1/auth/me/permissions/")
print("ME(denied):", resp.status_code, j(resp))

login(u_allowed)
resp2 = client.get("/api/v1/auth/me/permissions/")
print("ME(allowed):", resp2.status_code, j(resp2))

# ---------- 2) پیدا کردن آدرس create یکی از ویوهای عملیاتی فرم ----------
CANDIDATES = [
    "/api/v1/forms/actions/",      # حدس 1
    "/api/v1/hse/actions/",        # حدس 2
    "/api/v1/actions/",            # حدس 3
    "/api/v1/forms/",              # حدس 4
    "/api/v1/auth/hse/actions/",   # اگر زیر auth مونت شده باشد
]

create_url = None
for url in CANDIDATES:
    # با کاربر مجاز تست می‌کنیم که 404 نباشد و روش POST پشتیبانی شود
    login(u_allowed)
    r = client.post(url, data={}, format="json")
    if r.status_code not in (404, 301, 302, 405):  # 400/201/403 یعنی مسیر درست است
        create_url = url
        print("FOUND create endpoint:", url, "->", r.status_code)
        break

if not create_url:
    print("ERROR: نتوانستم آدرس create را پیدا کنم. لیست candidate ها را در بالا بررسی کن.")
else:
    # ---------- 3) enforce: کاربرِ بدون مجوز باید 403 بگیرد ----------
    login(u_denied)
    r_denied = client.post(create_url, data={}, format="json")
    print("CREATE as denied:", r_denied.status_code, "(expect 403) |", j(r_denied))

    # ---------- 4) کاربرِ مجاز: نباید 403 باشد (ممکن است 400 ولیدیشن باشد که OK است) ----------
    login(u_allowed)
    r_allowed = client.post(create_url, data={}, format="json")
    print("CREATE as allowed:", r_allowed.status_code, "(expect != 403) |", j(r_allowed))

print("\n=== Stage-4 smoke done ===")
