import json
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

# اجازه به test client
settings.ALLOWED_HOSTS = list(set(settings.ALLOWED_HOSTS or []) | {"testserver","localhost","127.0.0.1"})

User = get_user_model()

# سوپراَدمین برای کال‌کردن APIهای ادمین
admin, _ = User.objects.get_or_create(username="apitest_admin", defaults={"is_superuser": True, "is_staff": True})
if not admin.is_superuser or not admin.is_staff:
    admin.is_superuser = True; admin.is_staff = True; admin.set_password("Xx_ap1_!234"); admin.save()

def pp(resp):
    try: return json.dumps(resp.json(), ensure_ascii=False)
    except: return (resp.content or b"")[:200].decode("utf-8","ignore")

BASE_USERS = "/api/v1/auth/admin/users/"
BASE_ORG   = "/api/v1/auth/admin/org"
ME_PERMS   = "/api/v1/auth/me/permissions/"

# کلاینت ادمین
c = APIClient(); c.force_login(admin); c.defaults["HTTP_HOST"]="localhost"

# کمک‌تابع: پیدا کردن کاربر با search
def find_user(username):
    r = c.get(BASE_USERS, {"search": username})
    assert r.status_code==200 and len(r.json())>=1, f"cannot find {username}"
    return r.json()[0]  # {id, username, display_name, reports_to_id, permissions:[...]}

ceo   = find_user("seed_ceo")
hse   = find_user("seed_hse")
nurse = find_user("seed_nurse")

# 2.1) صحت رابطه‌های reports_to
assert hse["reports_to_id"]   == ceo["id"],   "HSE must report to CEO"
assert nurse["reports_to_id"] == hse["id"],   "Nurse must report to HSE"

print("RELATIONS OK →", {"ceo":ceo["id"], "hse":hse["id"], "nurse":nurse["id"]})

# 2.2) درخت کامل
rtree = c.get(f"{BASE_ORG}/tree/")
print("TREE:", rtree.status_code); assert rtree.status_code==200

# 2.3) me/permissions برای سه کاربر
def me_perms_as(username):
    u = User.objects.get(username=username)
    cc = APIClient(); cc.force_login(u); cc.defaults["HTTP_HOST"]="localhost"
    r = cc.get(ME_PERMS)
    print(f"ME {username}:", r.status_code, "|", pp(r))
    assert r.status_code==200
    return r.json()

ceo_perms   = me_perms_as("seed_ceo")
hse_perms   = me_perms_as("seed_hse")
nurse_perms = me_perms_as("seed_nurse")

# CEO همه true (سه ریسورس × CRUD) – حداقل چند کلیدِ نمونه را چک می‌کنیم
for res in ("forms","actions","archive"):
    assert all(ceo_perms[res][k] is True for k in ("create","read","update","delete")), "CEO should have full perms"

# HSE: read/update=true روی forms/actions؛ create هم به‌دلیل فلگ اجرا true شده است؛ delete=false
assert hse_perms["forms"]["read"]   is True and hse_perms["forms"]["update"] is True
assert hse_perms["actions"]["read"] is True and hse_perms["actions"]["update"] is True
assert hse_perms["forms"]["delete"]   is False and hse_perms["actions"]["delete"] is False

# Nurse: فقط archive.read=true
assert nurse_perms["archive"]["read"] is True
assert all(not nurse_perms["forms"][k] for k in ("create","read","update","delete"))

print("PERMISSIONS MAP OK")

# 2.4) تلاش move چرخه‌ای: CEO زیر Nurse → باید 400
r_cyclic = c.patch(f"{BASE_ORG}/{ceo['id']}/move/", data={"parent_id": nurse["id"]}, format="json")
print("MOVE CYCLIC:", r_cyclic.status_code, "|", pp(r_cyclic))
assert r_cyclic.status_code==400, "Cyclic move must be rejected with 400"

# 2.5) دروازه‌ی PermissionClass روی /api/v1/actions/:
# Nurse (بدون forms.create) → 403
cc_nurse = APIClient(); cc_nurse.force_login(User.objects.get(username="seed_nurse")); cc_nurse.defaults["HTTP_HOST"]="localhost"
r_denied = cc_nurse.post("/api/v1/actions/", data={}, format="json")
print("POST /actions as nurse:", r_denied.status_code, "|", pp(r_denied))
assert r_denied.status_code==403

# CEO (با forms.create) → نباید 403 (احتمالاً 400 به‌خاطر ولیدیشن)
cc_ceo = APIClient(); cc_ceo.force_login(User.objects.get(username="seed_ceo")); cc_ceo.defaults["HTTP_HOST"]="localhost"
r_allowed = cc_ceo.post("/api/v1/actions/", data={}, format="json")
print("POST /actions as CEO:", r_allowed.status_code, "|", pp(r_allowed))
assert r_allowed.status_code != 403

print("=== Stage-10 seed + smoke OK ===")
