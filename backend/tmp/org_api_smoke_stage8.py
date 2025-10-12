import json
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

# allow test hosts
need = {"testserver","localhost","127.0.0.1"}
current = set(settings.ALLOWED_HOSTS or [])
settings.ALLOWED_HOSTS = list(current | need)

User = get_user_model()
admin, _ = User.objects.get_or_create(username="org_stage8_admin", defaults={"is_superuser": True, "is_staff": True})
if not admin.is_superuser or not admin.is_staff:
    admin.is_superuser = True; admin.is_staff = True; admin.set_password("Xx_ap1_!234"); admin.save()

c = APIClient(); c.force_login(admin); c.defaults["HTTP_HOST"] = "localhost"

BASE = "/api/v1/auth/admin/org"
def j(r): 
    try: return json.dumps(r.json(), ensure_ascii=False)
    except: return r.content.decode("utf-8","ignore")[:200]

# 1) tree (root_only)
r = c.get(f"{BASE}/tree/", {"root_only":"true"})
print("TREE root_only:", r.status_code); assert r.status_code==200

# 2) parent ریشه بساز اگر خالی است
data = r.json() if r.status_code==200 else []
if isinstance(data, list) and not data:
    # یک ریشه بسازیم
    r_root = c.post(f"{BASE}/children/", data={
        "parent_id": None,
        "username":"org_root_s8",
        "password":"StrongPass_1234",
        "display_name":"ریشه مرحله ۸",
        "initial_permissions":[{"resource":"forms","can_create":True,"can_read":True,"can_update":True,"can_delete":False}]
    }, format="json")
    assert r_root.status_code in (200,201), j(r_root)
    parent_id = r_root.json()["id"]
else:
    # اولین ریشه موجود
    parent_id = data[0]["id"]

print("PARENT id:", parent_id)

# 3) ایجاد child
r_child = c.post(f"{BASE}/children/", data={
    "parent_id": parent_id,
    "username":"org_child_s8",
    "password":"StrongPass_1234",
    "display_name":"فرزند مرحله ",
    "initial_permissions":[{"resource":"archive","can_read":True}]
}, format="json")
print("CREATE child:", r_child.status_code, "|", j(r_child))
assert r_child.status_code in (200,201)
child_id = r_child.json()["id"]

# 4) rename
r_ren = c.patch(f"{BASE}/{child_id}/rename/", data={"display_name":"فرزند مرحله  (ویرایش)"}, format="json")
print("RENAME:", r_ren.status_code, "|", j(r_ren)); assert r_ren.status_code==200

# 5) move به ریشه
r_mv = c.patch(f"{BASE}/{child_id}/move/", data={"parent_id": None}, format="json")
print("MOVE to root:", r_mv.status_code, "|", j(r_mv)); assert r_mv.status_code==200

# 6) حذف نرم child
r_del = c.delete(f"{BASE}/{child_id}/")
print("DELETE soft child:", r_del.status_code); assert r_del.status_code in (200,204)

# 7) اگر parent هنوز children دارد، force delete
r_tree = c.get(f"{BASE}/tree/", {"root_only":"false"})
has_kids = any(n["id"]==parent_id and n.get("children") for n in (r_tree.json() if r_tree.status_code==200 else []))
if has_kids:
    r_force = c.delete(f"{BASE}/{parent_id}/", {"force":"true"})
    print("DELETE parent (force):", r_force.status_code); assert r_force.status_code in (200,204)

print("=== ORG API smoke OK ===")
