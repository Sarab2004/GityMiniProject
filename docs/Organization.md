# مستند ساختار سازمانی (reports_to)

## مدل سلسله‌مراتبی

- هر `UserProfile` دارای فیلد `reports_to` است که به کاربر والد اشاره می‌کند.
- ریشه‌ها مقدار `reports_to = NULL` دارند.
- سطح (`level`) هنگام پاسخ API محاسبه می‌شود (تعداد گام از ریشه).

ساختار درختی به صورت تو در تو از Endpoint `/api/v1/auth/admin/org/tree/` بازگردانده می‌شود.

## قوانین عملیات

| عملیات | توضیح |
|--------|-------|
| `move` | نمی‌توان یک نود را زیر یکی از فرزندان خودش قرار داد. در این حالت پاسخ `400` به همراه پیام حلقه برگردانده می‌شود. |
| `rename` | فقط `display_name` را تغییر می‌دهد. سایر فیلدها بدون تغییر باقی می‌مانند. |
| `delete` | حذف پیش‌فرض نرم است (کاربر غیرفعال و profile.is_deleted=True). اگر کاربر فرزند فعال داشته باشد، حذف نرم با خطای `400` بازگشت داده می‌شود مگر اینکه `?force=true` تنظیم شود. |
| `children` | ایجاد کاربر جدید تحت والد مشخص و تنظیم مجوزهای اولیه. |

## نمونه‌ها

### ایجاد زیردست

```bash
http POST http://localhost:8000/api/v1/auth/admin/org/children/ \
  parent_id:=2 \
  username=seed_intern password=Temp@123 display_name="کارآموز ایمنی" \
  permissions:='[{"resource":"archive","can_read":true}]' \
  X-CSRFToken:$CSRFTOKEN --session=admin
```

```json
HTTP 201
{
  "id": 6,
  "display_name": "کارآموز ایمنی",
  "level": 2,
  "parent_id": 2,
  "children": []
}
```

### انتقال به ریشه

```bash
http PATCH http://localhost:8000/api/v1/auth/admin/org/6/move/ \
  parent_id:=null \
  X-CSRFToken:$CSRFTOKEN --session=admin
```

```json
HTTP 200
{
  "id": 6,
  "display_name": "کارآموز ایمنی",
  "level": 0,
  "parent_id": null,
  "children": []
}
```

### جلوگیری از حلقه

```bash
http PATCH http://localhost:8000/api/v1/auth/admin/org/1/move/ \
  parent_id:=2 \
  X-CSRFToken:$CSRFTOKEN --session=admin
```

```json
HTTP 400
{
  "reports_to": ["Cannot create a reporting cycle for this user."]
}
```

### حذف نرم و حذف اجباری

```bash
# حذف نرم
http DELETE http://localhost:8000/api/v1/auth/admin/org/6/ X-CSRFToken:$CSRFTOKEN --session=admin
# حذف اجباری با وجود فرزند
http DELETE http://localhost:8000/api/v1/auth/admin/org/2/?force=true X-CSRFToken:$CSRFTOKEN --session=admin
```

پاسخ هر دو `204 No Content` است. در حالت اجباری، حتی اگر نود فرزند داشته باشد حذف می‌شود.

## ساختار پاسخ درخت nested

خروجی `/tree/` (بدون `root_only`) به شکل زیر است:

```json
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

در صورت استفاده از `root_only=true`، همان آرایه بازگردانده می‌شود اما بخش `children` خالی خواهد بود.

## نکات کارایی و آینده

- در حال حاضر برای مجموع نودها از `select_related("profile")` و `prefetch_related("resource_permissions")` استفاده می‌شود تا کوئری‌ها کنترل‌شده باقی بمانند.
- اگر در آینده نیاز به صفحه‌بندی (pagination) در سطوح بالایی وجود داشته باشد، پیشنهاد می‌شود `root_only=true` برای دریافت لیست ریشه‌ها و سپس فراخوانی جداگانه برای هر شاخه پیاده‌سازی شود.
- هنگام تغییرات انبوه، از عملیات bulk (مانند `bulk_create` مجوزها) استفاده شده تا بار پایگاه داده کاهش یابد؛ بهتر است همین الگو در توسعه‌های بعدی حفظ شود.
