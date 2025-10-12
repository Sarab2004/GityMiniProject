# مستند مجوزها و Gatekeeping

## مدل PermissionEntry

| فیلد | توضیح |
|------|-------|
| `user` | اشاره به کاربر Django (`auth_user`) |
| `resource` | یکی از `forms`, `actions`, `archive` |
| `can_create` | مجوز ایجاد |
| `can_read` | مجوز خواندن |
| `can_update` | مجوز ویرایش |
| `can_delete` | مجوز حذف |

هر `(user, resource)` یکتا است (constraint در مدل). مجوزها به صورت per-user ذخیره می‌شوند و قابلیت توسعه به Role در آینده وجود دارد.

## کلاس HasResourcePermission

این کلاس در `accounts/permissions.py` تعریف شده و روی viewهای DRF اعمال می‌شود. منطق:

1. ویو باید دو ویژگی داشته باشد: `required_resource` و `required_action` (مانند `"forms"` و `"create"`).
2. اگر ویو این ویژگی‌ها را نداشته باشد → حالت fail-open (True) برای جلوگیری از شکستن مسیرهای قدیمی.
3. کاربران `is_staff` یا `is_superuser` همیشه مجاز هستند.
4. در غیر این صورت، PermissionEntry مربوطه خوانده می‌شود؛ اگر پرچم موردنیاز False باشد → 403.

### نمونه اعمال روی ویو

```python
class ActionFormViewSet(AuditModelViewSet):
    permission_classes = [IsAuthenticated, HasResourcePermission]
    required_resource = "forms"
    required_action = "create"
```

## سناریو عملی (POST /api/v1/actions/)

### کاربر بدون forms.create

```bash
http --session=denied POST http://localhost:8000/api/v1/actions/ \
  indicator=DENIED-1 project=1 request_type=change \
  X-CSRFToken:$CSRFTOKEN
```

```json
HTTP 403
{
  "detail": "You do not have permission to perform this action."
}
```

### کاربر دارای forms.create

```bash
http --session=allowed POST http://localhost:8000/api/v1/actions/ \
  indicator=TEST-1 project=1 request_type=change \
  X-CSRFToken:$CSRFTOKEN
```

```json
HTTP 400   # در صورت ناقص بودن داده
{
  "project": ["This field is required."],
  "requester_name": ["This field is required."]
}
```

> مشاهده می‌شود که کد 403 برنمی‌گردد؛ خطا صرفاً به‌خاطر ولیدیشن داخلی است.

## Endpoint مصرف فرانت‌اند

```
GET /api/v1/auth/me/permissions/
```

```json
{
  "forms":   {"create": true,  "read": true,  "update": false, "delete": false},
  "actions": {"create": false, "read": true,  "update": false, "delete": false},
  "archive": {"create": false, "read": true,  "update": false, "delete": false}
}
```

فرانت‌اند این ساختار را کش می‌کند و از آن برای Gate کردن کارت‌ها و فرم‌های عملیاتی استفاده می‌کند (از طریق `hooks/usePermissions.ts` و `components/PermissionGate.tsx`). توصیه می‌شود هنگام تغییر پیشوند (`NEXT_PUBLIC_API_PREFIX`) از هماهنگی با مسیر `/auth/me/permissions/` مطمئن شوید.
