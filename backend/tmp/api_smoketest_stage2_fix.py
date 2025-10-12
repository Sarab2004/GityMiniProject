import json
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework.test import APIClient

# --- Fix: اجازه‌ی testserver/localhost برای اسکریپت تست ---
for host in ("testserver","localhost","127.0.0.1"):
    if host not in settings.ALLOWED_HOSTS:
        settings.ALLOWED_HOSTS.append(host)

User = get_user_model()
client = APIClient()
# --- Fix: هدر Host را به localhost ست کن تا اصلاً به testserver برخورد نکنیم ---
client.credentials(HTTP_HOST="localhost")

BASE = "/api/v1/auth/admin/users/"  # طبق خروجی ایجنت

# 1) لاگین به‌عنوان سوپریوزر (اگر نبود، بساز)
admin, _ = User.objects.get_or_create(username="apitest_admin", defaults={"is_superuser": True, "is_staff": True})
if not admin.is_superuser or not admin.is_staff:
    admin.is_superuser = True; admin.is_staff = True; admin.set_password("Xx_ap1_!234"); admin.save()
client.force_login(admin)
print("AUTH: logged in as superuser  OK")

# داده‌های تست
u_payload = {
    "username": "apit_u1",
    "password": "StrongPass_1234",
    "display_name": "کاربر تست ",
    "permissions": [
        {"resource":"forms","can_create":True,"can_read":True,"can_update":False,"can_delete":False},
        {"resource":"archive","can_read":True}
    ]
}

def pp(resp):
    try:
        return json.dumps(resp.json(), ensure_ascii=False)
    except Exception:
        return f"[{resp.status_code}] " + resp.content.decode("utf-8", "ignore")[:400]

# پاک‌سازی قبلی
try:
    User.objects.get(username="apit_u1").delete()
except User.DoesNotExist:
    pass

# 2) POST create
resp = client.post(BASE, data=u_payload, format="json")
status_created = resp.status_code in (200,201)
print("CREATE:", resp.status_code, "", "PASS" if status_created else "FAIL", "|", pp(resp))
assert status_created, "create failed"
uid = resp.json().get("id")

# 3) LIST و SEARCH
resp_all = client.get(BASE)
ok_list = resp_all.status_code==200 and any(r.get("id")==uid for r in resp_all.json())
print("LIST:", resp_all.status_code, "", "PASS" if ok_list else "FAIL", "| count=", len(resp_all.json()) if resp_all.status_code==200 else "n/a")
assert ok_list, "list missing created user"

resp_search = client.get(BASE, {"search":"کاربر تست"})
ok_search = resp_search.status_code==200 and any(r.get("id")==uid for r in resp_search.json())
print("SEARCH:", resp_search.status_code, "", "PASS" if ok_search else "FAIL", "|", pp(resp_search))
assert ok_search, "search failed"

# 4) PATCH فقط display_name و permissions (replace)
patch_payload = {
    "display_name": "کاربر تست  (ویرایش)",
    "permissions": [
        {"resource":"forms","can_create":False,"can_read":True,"can_update":True,"can_delete":False}
    ]
}
resp_patch = client.patch(f"{BASE}{uid}/", data=patch_payload, format="json")
ok_patch = resp_patch.status_code==200 and resp_patch.json().get("display_name")=="کاربر تست  (ویرایش)"
print("PATCH:", resp_patch.status_code, "", "PASS" if ok_patch else "FAIL", "|", pp(resp_patch))
assert ok_patch, "patch failed"

# 5) GET و PUT permissions
resp_get_perms = client.get(f"{BASE}{uid}/permissions/")
ok_get_perms = resp_get_perms.status_code==200 and isinstance(resp_get_perms.json(), list)
print("GET /permissions:", resp_get_perms.status_code, "", "PASS" if ok_get_perms else "FAIL", "|", pp(resp_get_perms))
assert ok_get_perms, "get permissions failed"

put_perms = [{"resource":"archive","can_read":True,"can_create":False,"can_update":False,"can_delete":False}]
resp_put_perms = client.put(f"{BASE}{uid}/permissions/", data=put_perms, format="json")
ok_put_perms = resp_put_perms.status_code in (200,204)
print("PUT /permissions:", resp_put_perms.status_code, "", "PASS" if ok_put_perms else "FAIL", "|", pp(resp_put_perms))
assert ok_put_perms, "put permissions failed"

# 6) DELETE نرم
resp_del_soft = client.delete(f"{BASE}{uid}/")
ok_del_soft = resp_del_soft.status_code in (200,204)
print("DELETE (soft):", resp_del_soft.status_code, "", "PASS" if ok_del_soft else "FAIL", "|", pp(resp_del_soft))
assert ok_del_soft, "soft delete failed"

# 7) DELETE سخت: کاربر را دوباره بساز و hard=true
resp2 = client.post(BASE, data=u_payload, format="json")
uid2 = resp2.json()["id"]
resp_del_hard = client.delete(f"{BASE}{uid2}/", {"hard":"true"})
ok_del_hard = resp_del_hard.status_code in (200,204)
print("DELETE (hard):", resp_del_hard.status_code, "", "PASS" if ok_del_hard else "FAIL", "|", pp(resp_del_hard))
assert ok_del_hard, "hard delete failed"

print("\n=== SMOKE DONE: Stage-2 looks OK ===")
