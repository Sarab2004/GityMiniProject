import json
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()
client = APIClient()

BASE_USERS = "/api/v1/auth/admin/users/"

# ورود ادمین
admin, _ = User.objects.get_or_create(username="ui_admin", defaults={"is_superuser": True, "is_staff": True})
if not admin.is_superuser or not admin.is_staff:
    admin.is_superuser = True; admin.is_staff = True; admin.set_password("UiAdm1n_123"); admin.save()
client.force_login(admin)

def pp(r):
    try: return json.dumps(r.json(), ensure_ascii=False)
    except: return r.content.decode("utf-8","ignore")

# 1) ساخت
payload = {
  "username": "ui_user_1",
  "password": "StrongPass_123!",
  "display_name": "کاربر UI ",
  "permissions": [
    {"resource":"forms","can_create":True,"can_read":True,"can_update":False,"can_delete":False}
  ]
}
resp = client.post(BASE_USERS, data=payload, format="json")
print("CREATE:", resp.status_code, "|", pp(resp))
assert resp.status_code in (200,201)
uid = resp.json()["id"]

# 2) جست‌وجو
resp_s = client.get(BASE_USERS, {"search":"ui_user_1"})
print("SEARCH:", resp_s.status_code, "| count=", len(resp_s.json()) if resp_s.status_code==200 else "n/a")
assert resp_s.status_code==200

# 3) ویرایش نمایش‌نام و مجوزها (replace)
patch_payload = {
  "display_name":"کاربر UI  (ویرایش)",
  "permissions":[{"resource":"archive","can_read":True,"can_create":False,"can_update":False,"can_delete":False}]
}
resp_p = client.patch(f"{BASE_USERS}{uid}/", data=patch_payload, format="json")
print("PATCH:", resp_p.status_code, "|", pp(resp_p))
assert resp_p.status_code==200

# 4) حذف نرم
resp_d = client.delete(f"{BASE_USERS}{uid}/")
print("DELETE soft:", resp_d.status_code)
assert resp_d.status_code in (200,204)

# 5) ساخت مجدد و حذف سخت
resp2 = client.post(BASE_USERS, data=payload, format="json")
uid2 = resp2.json()["id"]
resp_h = client.delete(f"{BASE_USERS}{uid2}/", {"hard":"true"})
print("DELETE hard:", resp_h.status_code)
assert resp_h.status_code in (200,204)

print("=== API smoke OK ===")
