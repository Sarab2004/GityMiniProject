import json
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()
admin, _ = User.objects.get_or_create(username="apitest_admin", defaults={"is_superuser": True, "is_staff": True})
if not admin.is_superuser or not admin.is_staff:
    admin.is_superuser = True; admin.is_staff = True; admin.set_password("Xx_ap1_!234"); admin.save()

c = APIClient(); c.force_login(admin)
BASE="/api/v1/auth/admin/users/"

u_payload = {
  "username":"u_stage7","password":"StrongPass_1234",
  "display_name":"کاربر UI تست",
  "permissions":[{"resource":"forms","can_create":True,"can_read":True,"can_update":False,"can_delete":False}]
}

def pp(r):
    try: return json.dumps(r.json(), ensure_ascii=False)
    except: return r.content.decode("utf-8","ignore")[:200]

# CREATE
resp = c.post(BASE, data=u_payload, format="json")
print("CREATE:", resp.status_code, "|", pp(resp))
assert resp.status_code in (200,201)
uid = resp.json()["id"]

# SEARCH
resp_s = c.get(BASE, {"search":"u_stage7"})
print("SEARCH:", resp_s.status_code, "| count=", (len(resp_s.json()) if resp_s.status_code==200 else "n/a"))
assert resp_s.status_code==200

# PATCH (نام و مجوزها)
patch_payload = {
  "display_name":"کاربر UI تست (ویرایش)",
  "permissions":[{"resource":"forms","can_create":False,"can_read":True,"can_update":True,"can_delete":False}]
}
resp_p = c.patch(f"{BASE}{uid}/", data=patch_payload, format="json")
print("PATCH:", resp_p.status_code, "|", pp(resp_p))
assert resp_p.status_code==200

# DELETE soft
resp_d = c.delete(f"{BASE}{uid}/")
print("DELETE soft:", resp_d.status_code)
assert resp_d.status_code in (200,204)

print("=== API smoke OK ===")
