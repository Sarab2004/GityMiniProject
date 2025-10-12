# CHANGELOG

## v1.1 – Admin & Org & RBAC (2025-10-12)

- ایجاد مدل‌های `UserProfile` و `PermissionEntry` برای ساختار سازمانی و RBAC.
- اضافه‌شدن Endpointهای مدیریتی کاربران در `/api/v1/auth/admin/users/` (CRUD، جست‌وجو، مدیریت مجوزها).
- انتشار Endpoint درخت سازمان شامل ایجاد زیردست، جابه‌جایی، تغییر نام و حذف (soft/hard).
- پیاده‌سازی Endpoint `GET /api/v1/auth/me/permissions/` جهت مصرف مستقیم فرانت‌اند.
- اضافه‌شدن کلاس `HasResourcePermission` برای Gatekeeping ویوهای عملیاتی (مثال: `POST /api/v1/actions/`).
- توسعه کلاینت‌های فرانت‌اند (`lib/api/admin.ts`) و هوک/کامپوننت Gate (`usePermissions`, `PermissionGate`).
- ساخت شِل پنل ادمین و سپس صفحه کامل Users (لیست، ساخت، ویرایش، حذف) و Organization (درخت تعاملی).
- نگارش اسکریپت seed سازمانی (`seed_org`) و تست‌های واحد برای جلوگیری از حلقه و enforce شدن PermissionClass.
- به‌روزرسانی کامل مستندات و اضافه‌شدن بخش‌های API-Admin، Permissions و Organization.
