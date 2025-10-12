# HSE Backend — مستند راه‌اندازی و عملیات

## نمای کلان پروژه

| مؤلفه | توضیح |
|-------|-------|
| فریم‌ورک | Django 5 + Django REST Framework |
| احراز هویت | Session-based (کوکی + CSRF) |
| اپلیکیشن‌ها | `accounts` (کاربران، پروفایل، RBAC، سازمان) – `hse` (فرم‌ها و اکشن‌ها) – `common` (ابزارهای مشترک) |
| پایگاه داده | SQLite در توسعه (قابل تغییر به PostgreSQL) |
| Prefixed API | تمام مسیرها تحت `/api/v1/` ارائه می‌شوند. مسیرهای ادمین در حال حاضر از طریق include پروژه زیر `/api/v1/auth/` مونت شده‌اند. |

## راه‌اندازی سریع

```bash
# 1) ایجاد و فعال‌کردن محیط مجازی
python -m venv .venv
.venv\Scripts\activate  # روی ویندوز

# 2) نصب وابستگی‌ها
pip install -r requirements.txt

# 3) تنظیم متغیرهای محیطی (بر اساس نیاز)
copy .env.example .env

# 4) اجرای مهاجرت‌ها
python manage.py migrate

# 5) ساخت ابرکاربر برای ورود به پنل مدیریتی / تست‌ها
python manage.py createsuperuser

# 6) اجرای سرور محلی
python manage.py runserver 0.0.0.0:8000
```

سرور در آدرس `http://localhost:8000/` فعال می‌شود. اسناد Swagger از مسیر `/api/v1/docs/` و Schema از `/api/v1/schema/` قابل دسترس هستند.

## محیط توسعه و متغیرهای مهم

| نام | کارکرد |
|-----|--------|
| `ALLOWED_HOSTS` | برای تست‌های محلی و APIClient باید `["localhost", "127.0.0.1", "testserver"]` یا مشابه را تنظیم کنید. |
| `CORS_ORIGIN_WHITELIST` | دامنه‌های مجاز برای CORS. |
| `DEFAULT_CLIENT_ORIGINS` | لیست دامنه‌های مجاز برای کلاینت فرانت‌اند جهت تولید لینک در ایمیل یا پاسخ‌ها. |
| `SECURE_PROXY_SSL_HEADER` | در صورت استفاده پشت ریورس‌پروکسی HTTPS باید تنظیم شود (`('HTTP_X_FORWARDED_PROTO', 'https')`). |
| `CSRF_TRUSTED_ORIGINS` | هنگام توسعه در پورت‌های غیرعادی یا دامنه‌های سفارشی ضروری است. |

**نکته SLASH:** بسیاری از Endpointهای Django انتهای مسیر به اسلش نیاز دارند. برای مثال `GET /api/v1/auth/me/permissions/` معتبر است اما بدون اسلش ممکن است `301` یا `404` بدهد.

## راهنمای احراز هویت و CSRF

1. **ورود**: از مسیر `/api/v1/auth/login/` (POST) با بدنه JSON `{"username": "...", "password": "..."}` استفاده کنید. پاسخ شامل کوکی سشن خواهد بود.
2. **گرفتن CSRF**: پس از ورود، سرور در هدر پاسخ `Set-Cookie: csrftoken=...` قرار می‌دهد. اگر نیاز به توکن تازه دارید می‌توانید `GET /api/v1/csrf/` را فراخوانی کنید.
3. **ارسال درخواست‌های نوشتنی**: برای همه‌ی POST/PUT/PATCH/DELETE باید هدر `X-CSRFToken` را با مقدار کوکی `csrftoken` ارسال کنید و `credentials: include` (در fetch) یا `--cookie` در curl را فراموش نکنید.
4. **آزمون دستی**: با مرورگر به `/admin/login/` یا `/api/v1/auth/login/` بروید، وارد شوید، سپس درخواست‌های REST را با ابزار خود اجرا کنید.

## پیشوند فعلی Endpointها

- مسیرهای عمومی: `/api/v1/...`
- Endpointهای مدیریتی ادمین (کاربران و سازمان): در حال حاضر زیر `/api/v1/auth/admin/...` قرار دارند. در صورت تغییر در آینده تنها کافی است include مربوطه در `backend/config/urls.py` به محل جدید اشاره کند.
- Endpoint «مجوزهای من»: `/api/v1/auth/me/permissions/`

##‌ Smoke Test (دستورهای سریع)

فرض کنید با کاربر ادمین وارد شده‌اید و کوکی سشن + csrftoken را دارید (در مثال از httpie استفاده شده است):

```bash
# بررسی مجوزهای کاربر جاری
http --session=dev GET http://localhost:8000/api/v1/auth/me/permissions/

# تلاش برای ایجاد اکشن (در صورت فقدان forms.create → 403)
http --session=dev POST http://localhost:8000/api/v1/actions/ \
  Content-Type:application/json X-CSRFToken:$(http --session=dev GET http://localhost:8000/api/v1/csrf/ | jq -r '.csrfToken') \
  indicator=TEST-001 project=1 request_type=change
```
در صورت مشاهده خطای 403، سطح دسترسی forms.create را بررسی کنید. خطای 400 نشان‌دهنده ولیدیشن داخلی است.

## Seed و تست‌ها

### اسکریپت Seed داده نمونه

```bash
python manage.py seed_org \
  [--password Seed_1234] \
  [--hse-can-create] \
  [--reset-password]
```

خروجی شامل خلاصه JSON سه کاربر است:

- `seed_ceo` → مدیرعامل (کلیه CRUD روی forms/actions/archive)
- `seed_hse` → مدیر HSE (read/update روی forms/actions و در صورت فعال‌سازی فلگ create)
- `seed_nurse` → پرستار (فقط archive.read)

برای اطمینان:
- ساختار درخت: `GET /api/v1/auth/admin/org/tree/`
- مجوزهای کاربر وارد شده: `GET /api/v1/auth/me/permissions/`

### تست‌های خودکار

```bash
python manage.py test accounts -v 2
```

این تست‌ها شامل موارد زیر هستند:
1. جلوگیری از ایجاد حلقه در ساختار reports_to هنگام جابه‌جایی نودها.
2. اطمینان از enforce شدن `HasResourcePermission` روی Endpoint عملیاتی (`POST /api/v1/actions/`).
3. صحت اعتبارسنجی مدل UserProfile برای حلقه‌های گزارش‌دهی.

## اسناد تکمیلی

- [docs/API-Admin.md](../docs/API-Admin.md) — شرح Endpointهای مدیریتی و نمونه درخواست/پاسخ.
- [docs/Permissions.md](../docs/Permissions.md) — مدل PermissionEntry، کلاس HasResourcePermission و JSON مجوزها.
- [docs/Organization.md](../docs/Organization.md) — ساختار درخت سازمان و عملیات مرتبط.

## Best Practices و تروبل‌شوت

- **ALLOWED_HOSTS**: برای تست‌های خودکار یا استفاده از `APIClient` لازم است `testserver` و `localhost` در لیست باشند؛ در غیر این صورت خطای `DisallowedHost` دریافت می‌کنید.
- **اسلش پایانی**: Endpointهایی مانند `/api/v1/auth/me/permissions/` و مسیرهای org/users نیازمند اسلش هستند؛ بدون آن پاسخ Redirect یا 404 دریافت می‌کنید.
- **کدهای وضعیت**: خطای `403` نشان‌دهنده عدم دسترسی (Gatekeeping) است؛ درحالی‌که `400` خطای ولیدیشن داده یا منطق (مثلاً جلوگیری از حلقه) را نشان می‌دهد.
- **فرانت‌اند**: برای استفاده از کلاینت‌های جدید، مقدار `NEXT_PUBLIC_API_PREFIX` را با پیشوند واقعی (`/api/v1/auth`) هماهنگ نگه دارید. این مقدار در `lib/api/_client.ts` مصرف می‌شود.
