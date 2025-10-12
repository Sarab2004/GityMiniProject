import json
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework.test import APIClient
from django.db import transaction

# --- allow host for APIClient ---
for h in ("localhost","testserver","127.0.0.1"):
    if h not in settings.ALLOWED_HOSTS:
        settings.ALLOWED_HOSTS.append(h)

User = get_user_model()
c = APIClient()
c.credentials(HTTP_HOST="localhost")

# --- ensure admin login ---
admin, _ = User.objects.get_or_create(username="apitest_admin", defaults={"is_superuser": True, "is_staff": True})
if not admin.is_superuser or not admin.is_staff:
    admin.is_superuser = True; admin.is_staff = True; admin.set_password("Xx_ap1_!234"); admin.save()
c.force_login(admin)
print("AUTH: superuser login  OK")

# --- auto-detect base paths for org endpoints ---
CANDIDATE_BASES = [
    "/api/v1/auth/admin/users/org",   # اگر اکشن‌ها روی AdminUserViewSet سوار شده‌اند
    "/api/v1/auth/admin/org",         # اگر ViewSet جدا با prefix=org رجیستر شده
]
ORG_BASE = None
for base in CANDIDATE_BASES:
    r = c.get(f"{base}/tree/")
    if r.status_code in (200, 400):  # 200 = ok, 400=مثلاً پارامتر بد ولی روت درسته
        ORG_BASE = base
        break

if not ORG_BASE:
    raise SystemExit("FAIL: نتونستم مسیر org رو پیدا کنم؛ لطفاً بگو ایجنت چه مسیری ساخته (users/org یا org).")

print("ORG_BASE:", ORG_BASE)

def pp(resp):
    try:
        return json.dumps(resp.json(), ensure_ascii=False)
    except Exception:
        return f"[{resp.status_code}] " + resp.content.decode("utf-8", "ignore")[:400]

# --- تست دیتا: یک والد ریشه و یک فرزند زیرش ---
PARENT_USERNAME = "org_root1"
CHILD_USERNAME  = "org_child1"

# پاکسازی احتمالی قبلی (بدون خطا در نبود)
User.objects.filter(username__in=[CHILD_USERNAME]).delete()
parent = User.objects.filter(username=PARENT_USERNAME).first()
if not parent:
    parent = User.objects.create_user(username=PARENT_USERNAME, password="Str0ng_P@ss", email="")
    # فعال نگه داریم
    parent.is_active = True; parent.save()

# 1) GET tree (root_only=true)
r_tree_roots = c.get(f"{ORG_BASE}/tree/", {"root_only":"true"})
print("TREE (root_only):", r_tree_roots.status_code, "", "PASS" if r_tree_roots.status_code==200 else "FAIL")

# 2) POST children: ساخت فرزند زیر parent
payload_child = {
    "parent_id": parent.id,
    "username": CHILD_USERNAME,
    "password": "Str0ng_P@ss",
    "display_name": "فرزند تست",
    "initial_permissions": [
        {"resource":"forms","can_create":True,"can_read":True,"can_update":False,"can_delete":False}
    ]
}
r_child = c.post(f"{ORG_BASE}/children/", data=payload_child, format="json")
print("CREATE child:", r_child.status_code, "", "PASS" if r_child.status_code in (200,201) else "FAIL", "|", pp(r_child))
assert r_child.status_code in (200,201), "child create failed"
child_id = r_child.json().get("id")

# 3) GET tree (full nested)
r_tree_full = c.get(f"{ORG_BASE}/tree/")
ok_tree = r_tree_full.status_code==200
print("TREE (full):", r_tree_full.status_code, "", "PASS" if ok_tree else "FAIL")

# 4) PATCH rename: تغییر نام نود فرزند
r_rename = c.patch(f"{ORG_BASE}/{child_id}/rename/", data={"display_name":"فرزند تست (ویرایش)"}, format="json")
ok_rename = r_rename.status_code==200 and r_rename.json().get("display_name")=="فرزند تست (ویرایش)"
print("RENAME:", r_rename.status_code, "", "PASS" if ok_rename else "FAIL", "|", pp(r_rename))
assert ok_rename, "rename failed"

# 5) PATCH move: جابجایی فرزند به ریشه (parent_id=null) و برگشت به parent اولیه
r_move_root = c.patch(f"{ORG_BASE}/{child_id}/move/", data={"parent_id": None}, format="json")
ok_move_root = r_move_root.status_code==200 and r_move_root.json().get("parent_id") is None
print("MOVE  root:", r_move_root.status_code, "", "PASS" if ok_move_root else "FAIL", "|", pp(r_move_root))
assert ok_move_root, "move to root failed"

r_move_back = c.patch(f"{ORG_BASE}/{child_id}/move/", data={"parent_id": parent.id}, format="json")
ok_move_back = r_move_back.status_code==200 and r_move_back.json().get("parent_id")==parent.id
print("MOVE  back to parent:", r_move_back.status_code, "", "PASS" if ok_move_back else "FAIL", "|", pp(r_move_back))
assert ok_move_back, "move back failed"

# 6) DELETE org روی parent (باید 400 بده چون child دارد)
r_del_parent = c.delete(f"{ORG_BASE}/{parent.id}/org/")
ok_block_children = r_del_parent.status_code==400
print("DELETE parent (should block):", r_del_parent.status_code, "", "PASS" if ok_block_children else "FAIL", "|", pp(r_del_parent))

# 7) DELETE org روی child (soft)  204
r_del_child_soft = c.delete(f"{ORG_BASE}/{child_id}/org/")
ok_del_soft = r_del_child_soft.status_code in (200,204)
print("DELETE child (soft):", r_del_child_soft.status_code, "", "PASS" if ok_del_soft else "FAIL")
assert ok_del_soft, "soft delete child failed"

# 8) حالا دوباره ساخت child و حذف با force روی parent
r_child2 = c.post(f"{ORG_BASE}/children/", data=payload_child, format="json")
child2_id = r_child2.json().get("id")
r_del_parent_force = c.delete(f"{ORG_BASE}/{parent.id}/org/", {"force":"true"})
ok_del_parent_force = r_del_parent_force.status_code in (200,204)
print("DELETE parent (force):", r_del_parent_force.status_code, "", "PASS" if ok_del_parent_force else "FAIL")
assert ok_del_parent_force, "force delete parent failed"

print("\n=== SMOKE DONE: Stage-3 looks OK ===")
