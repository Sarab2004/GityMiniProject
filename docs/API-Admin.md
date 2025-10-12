# اسناد Endpointهای مدیریتی ادمین

## فهرست سریع

| مسیر | متد | توضیح |
|------|------|-------|
| `/api/v1/auth/admin/users/` | `GET` | لیست کاربران ادمین با فیلتر `?search=` |
| `/api/v1/auth/admin/users/` | `POST` | ایجاد کاربر جدید + پروفایل + مجوزها |
| `/api/v1/auth/admin/users/{id}/` | `GET` | جزئیات کاربر |
| `/api/v1/auth/admin/users/{id}/` | `PATCH` | به‌روزرسانی `display_name` و `permissions` |
| `/api/v1/auth/admin/users/{id}/` | `DELETE` | حذف نرم (یا سخت با `?hard=true`) |
| `/api/v1/auth/admin/users/{id}/permissions/` | `GET` | لیست مجوزهای کاربر |
| `/api/v1/auth/admin/users/{id}/permissions/` | `PUT` | جایگزینی کامل مجوزها |
| `/api/v1/auth/me/permissions/` | `GET` | نقشهٔ مجوزهای کاربر جاری |
| `/api/v1/auth/admin/org/tree/` | `GET` | درخت سازمان (با `?root_only=true` برای ریشه‌ها) |
| `/api/v1/auth/admin/org/children/` | `POST` | ایجاد زیردست برای `parent_id` مشخص |
| `/api/v1/auth/admin/org/{user_id}/move/` | `PATCH` | تغییر والد کاربر (`parent_id`) |
| `/api/v1/auth/admin/org/{user_id}/rename/` | `PATCH` | تغییر `display_name` نود |
| `/api/v1/auth/admin/org/{user_id}/` | `DELETE` | حذف نرم (یا اجباری با `?force=true`) |

> ⚠️ تمام مسیرها اسلش پایانی دارند؛ حذف آن منجر به 404 یا Redirect می‌شود.

## کاربران ادمین

### لیست / جست‌وجو

```
GET /api/v1/auth/admin/users/?search=mahdi
```

```json
HTTP 200
[
  {
    "id": 3,
    "username": "mahdi",
    "email": "mahdi@example.com",
    "is_active": true,
    "display_name": "مهدی رضایی",
    "reports_to_id": 1,
    "permissions": [
      {"resource": "forms", "can_create": true, "can_read": true, "can_update": true, "can_delete": false},
      {"resource": "archive", "can_create": false, "can_read": true, "can_update": false, "can_delete": false}
    ]
  }
]
```

### ایجاد کاربر جدید

```bash
http POST http://localhost:8000/api/v1/auth/admin/users/ \
  username=mahdi password=Temp@123 display_name="مهدی رضایی" \
  permissions:='[{"resource":"forms","can_create":true,"can_read":true,"can_update":false,"can_delete":false}]' \
  X-CSRFToken:$CSRFTOKEN --session=admin
```

```json
HTTP 201
{
  "id": 7,
  "username": "mahdi",
  "email": "",
  "is_active": true,
  "display_name": "مهدی رضایی",
  "reports_to_id": null,
  "permissions": [
    {"resource": "forms", "can_create": true, "can_read": true, "can_update": false, "can_delete": false}
  ]
}
```

### به‌روزرسانی کاربر

```bash
http PATCH http://localhost:8000/api/v1/auth/admin/users/7/ \
  display_name="مهدی رئیسی" \
  permissions:='[{"resource":"archive","can_read":true}]' \
  X-CSRFToken:$CSRFTOKEN --session=admin
```

```json
HTTP 200
{
  "id": 7,
  "username": "mahdi",
  "email": "",
  "is_active": true,
  "display_name": "مهدی رئیسی",
  "reports_to_id": null,
  "permissions": [
    {"resource": "archive", "can_create": false, "can_read": true, "can_update": false, "can_delete": false}
  ]
}
```

### حذف نرم / سخت

```bash
# حذف نرم
http DELETE http://localhost:8000/api/v1/auth/admin/users/7/ X-CSRFToken:$CSRFTOKEN --session=admin

# حذف کامل
http DELETE http://localhost:8000/api/v1/auth/admin/users/7/?hard=true X-CSRFToken:$CSRFTOKEN --session=admin
```

پاسخ هر دو حالت `204 No Content` است. در حالت نرم، `is_active=False` و `profile.is_deleted=True` می‌شود.

## مجوزهای کاربر جاری

```
GET /api/v1/auth/me/permissions/
```

```json
HTTP 200
{
  "forms":   {"create": true,  "read": true,  "update": true,  "delete": false},
  "actions": {"create": false, "read": true,  "update": false, "delete": false},
  "archive": {"create": false, "read": true,  "update": false, "delete": false}
}
```

## ساختار سازمانی

### دریافت درخت

```
GET /api/v1/auth/admin/org/tree/
```

```json
HTTP 200
[
  {
    "id": 1,
    "display_name": "مدیرعامل",
    "level": 0,
    "parent_id": null,
    "children": [
      {
        "id": 2,
        "display_name": "مدیر HSE",
        "level": 1,
        "parent_id": 1,
        "children": [
          {
            "id": 3,
            "display_name": "پرستار",
            "level": 2,
            "parent_id": 2,
            "children": []
          }
        ]
      }
    ]
  }
]
```

در صورتی که فقط ریشه‌ها را نیاز دارید:
```
GET /api/v1/auth/admin/org/tree/?root_only=true
```

### ایجاد زیردست جدید

```bash
http POST http://localhost:8000/api/v1/auth/admin/org/children/ \
  parent_id:=2 username=seed_intern password=Temp@123 display_name="کارآموز" \
  permissions:='[{"resource":"archive","can_read":true}]' \
  X-CSRFToken:$CSRFTOKEN --session=admin
```

```json
HTTP 201
{
  "id": 5,
  "display_name": "کارآموز",
  "level": 2,
  "parent_id": 2,
  "children": []
}
```

### جابه‌جایی نود

```bash
http PATCH http://localhost:8000/api/v1/auth/admin/org/5/move/ \
  parent_id:=null \
  X-CSRFToken:$CSRFTOKEN --session=admin
```

```json
HTTP 200
{
  "id": 5,
  "display_name": "کارآموز",
  "level": 0,
  "parent_id": null,
  "children": []
}
```

> تلاش برای ایجاد حلقه (قرار دادن والد روی یکی از فرزندان خودش) با `400 Bad Request` و پیام ولیدیشن بازگردانده می‌شود.

### تغییر نام

```bash
http PATCH http://localhost:8000/api/v1/auth/admin/org/5/rename/ \
  display_name="کارآموز ارشد" \
  X-CSRFToken:$CSRFTOKEN --session=admin
```

```json
HTTP 200
{
  "id": 5,
  "display_name": "کارآموز ارشد",
  "level": 0,
  "parent_id": null,
  "children": []
}
```

### حذف نود

```bash
# حذف نرم (در صورت داشتن فرزند → 400)
http DELETE http://localhost:8000/api/v1/auth/admin/org/5/ \
  X-CSRFToken:$CSRFTOKEN --session=admin

# حذف اجباری (force=true)
http DELETE http://localhost:8000/api/v1/auth/admin/org/2/?force=true \
  X-CSRFToken:$CSRFTOKEN --session=admin
```

پاسخ `204 No Content` است. در حالت نرم، کاربر غیرفعال می‌شود و `profile.is_deleted=True` می‌گردد.

## کدهای وضعیت و خطاهای رایج

| Status | معنی | سناریوی متداول |
|--------|------|-----------------|
| `200 OK` | موفقیت در درخواست‌های خواندنی و به‌روزرسانی | لیست، جزئیات، rename/move موفق |
| `201 Created` | ایجاد کاربر یا زیردست جدید | POST موفق |
| `204 No Content` | حذف نرم/سخت | DELETE موفق |
| `400 Bad Request` | خطای ولیدیشن (مثلاً ایجاد حلقه در org یا داده ناقص) | move حلقه‌ای، نمایش‌نام خالی |
| `403 Forbidden` | Gatekeeping سطح دسترسی (عدم احراز forms.create و ...) | درخواست عملیات توسط کاربر غیرمجاز |
| `404 Not Found` | مسیر بدون اسلش یا شناسه نامعتبر | فراموش‌کردن اسلش پایانی |

## نکات کارایی

- در دریافت درخت، بک‌اند از `select_related("profile")` و `prefetch_related("resource_permissions")` استفاده می‌کند تا کوئری اضافه تولید نشود.
- پارامتر `root_only=true` برای زمانی است که فقط مدیران ارشد را لازم دارید؛ پاسخ شامل آرایه‌ای از نودهای سطح صفر بدون فرزندان است، درحالی‌که حالت پیش‌فرض ساختار تو در تو را بازمی‌گرداند.
- هنگام mass-update مجوزها، از `PUT /permissions/` استفاده کنید تا فقط یک درخواست به پایگاه داده ارسال شود.
