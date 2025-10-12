import json
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework.test import APIClient

# اجازه دادن host برای APIClient
for h in ("localhost","testserver","127.0.0.1"):
    if h not in settings.ALLOWED_HOSTS:
        settings.ALLOWED_HOSTS.append(h)

User = get_user_model()
c = APIClient(); c.credentials(HTTP_HOST="localhost")

# لاگین ادمین
admin, _ = User.objects.get_or_create(username="apitest_admin", defaults={"is_superuser": True, "is_staff": True})
admin.is_superuser = True; admin.is_staff = True; admin.save()
c.force_login(admin)

# کشف ORG_BASE (از اسکریپت قبلی)
CANDIDATE_BASES = ["/api/v1/auth/admin/users/org", "/api/v1/auth/admin/org"]
ORG_BASE = None
for base in CANDIDATE_BASES:
    r = c.get(f"{base}/tree/")
    if r.status_code in (200,400):
        ORG_BASE = base; break
print("ORG_BASE:", ORG_BASE)

# اگر child قبلی هنوز هست، از همان استفاده می‌کنیم؛ وگرنه یکی بسازیم
parent = User.objects.filter(username="org_root1").first()
if not parent:
    parent = User.objects.create_user(username="org_root1", password="Str0ng_P@ss", email="")
child = User.objects.filter(username="org_child1").first()
if not child:
    payload_child = {
        "parent_id": parent.id,
        "username": "org_child1",
        "password": "Str0ng_P@ss",
        "display_name": "فرزند برای تست حذف",
    }
    r_child = c.post(f"{ORG_BASE}/children/", data=payload_child, format="json")
    assert r_child.status_code in (200,201), f"cannot create child: {r_child.status_code}"
    child_id = r_child.json()["id"]
else:
    child_id = child.id

# کاندید مسیرهای حذف:
candidates = [
    f"{ORG_BASE}/{child_id}/org/",     # اکشن detail url_path="org"
    f"{ORG_BASE}/{child_id}/",         # destroy خود viewset
    f"/api/v1/auth/admin/users/{child_id}/org/",  # اگر روی users سوار شده باشد
]

print("\n-- Probing DELETE endpoints for child_id", child_id, "--")
for url in candidates:
    r = c.delete(url)  # soft delete
    print(f"DELETE {url} ->", r.status_code)

# مسیر درست را انتخاب کن (اولین که 200/204 بده)
delete_url = None
for url in candidates:
    r = c.delete(url)  # اگر قبلاً soft شده بود، شاید دوباره هم 204 بده
    if r.status_code in (200,204):
        delete_url = url; break

if not delete_url:
    raise SystemExit("هیچ مسیر DELETE معتبری پیدا نشد. خروجی‌های بالا را برای من بفرست.")

print("\nUSING DELETE URL:", delete_url)

# 1) ساخت child جدید برای تست نهایی soft/hard
r_new = c.post(f"{ORG_BASE}/children/", data={
    "parent_id": parent.id, "username": "org_child2",
    "password": "Str0ng_P@ss", "display_name": "child2"
}, format="json")
assert r_new.status_code in (200,201), f"create child2 failed: {r_new.status_code}"
child2_id = r_new.json()["id"]
print("CREATE child2:", r_new.status_code)

# 2) حذف نرم child2 (DELETE روی delete_url با جابجا کردن id)
soft_url = delete_url.replace(str(child_id), str(child2_id))
r_soft = c.delete(soft_url)
print("SOFT DELETE child2:", r_soft.status_code, "(expected 204)")

# 3) ساخت child3 و حذف سخت parent با force=true در QueryString
r_new3 = c.post(f"{ORG_BASE}/children/", data={
    "parent_id": parent.id, "username": "org_child3",
    "password": "Str0ng_P@ss", "display_name": "child3"
}, format="json")
assert r_new3.status_code in (200,201), f"create child3 failed: {r_new3.status_code}"
print("CREATE child3:", r_new3.status_code)

# حذف سخت parent: باید روی detail parent انجام شود
parent_delete_candidates = [
    f"{ORG_BASE}/{parent.id}/org/?force=true",
    f"{ORG_BASE}/{parent.id}/?force=true",
    f"/api/v1/auth/admin/users/{parent.id}/org/?force=true",
]
print("\n-- Probing FORCE DELETE for parent_id", parent.id, "--")
ok_force = False
for url in parent_delete_candidates:
    r = c.delete(url)
    print(f"DELETE {url} ->", r.status_code)
    if r.status_code in (200,204):
        ok_force = True; break

print("\nRESULTS:",
      "\n - soft delete:", "OK" if r_soft.status_code in (200,204) else f"FAIL ({r_soft.status_code})",
      "\n - force delete parent:", "OK" if ok_force else "FAIL")
