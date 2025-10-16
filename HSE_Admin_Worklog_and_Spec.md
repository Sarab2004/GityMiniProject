# HSE Admin — Worklog & Technical Spec (تا اینجا)

> **هدف این سند**: جمع‌بندی دقیق تمام تغییرات و تصمیم‌های انجام‌شده در این چت، به‌همراه راهنمای اجرا، تست، و ادامهٔ کار. این فایل را می‌توانید در چت جدید ارسال کنید تا ادامهٔ توسعه/دیباگ با همین زمینه انجام شود.

---

## فهرست مطالب
1. [خلاصه مدیریتی](#خلاصه-مدیریتی)
2. [تایم‌لاین کارها (به‌تفکیک مراحل)](#تایم‌لاین-کارها-به-تفکیک-مراحل)
3. [تغییرات بک‌اند](#تغییرات-بک-اند)
   - 3.1 [Role Catalog قفل‌شده در کد](#role-catalog-قفل-شده-در-کد)
   - 3.2 [Endpoints و قراردادهای API](#endpoints-و-قراردادهای-api)
   - 3.3 [Permission: چهار پرمیژن ساده](#permission-چهار-پرمیژن-ساده)
   - 3.4 [Archive: نرمال‌سازی خروجی و Dispatcher فرم‌ها](#archive-نرمال-سازی-خروجی-و-dispatcher-فرم-ها)
   - 3.5 [CSRF/Session](#csrfsession)
4. [تغییرات فرانت‌اند](#تغییرات-فرانت-اند)
   - 4.1 [Users: UI چهار چک‌باکس مجوز](#users-ui-چهار-چک-باکس-مجوز)
   - 4.2 [Organization: onChange و فیلتر نقش/والد](#organization-onchange-و-فیلتر-نقشوالد)
   - 4.3 [Archive UI: اکشن‌های ویرایش/حذف](#archive-ui-اکشن-های-ویرایشحذف)
   - 4.4 [Phase A: لایه‌ی Adapter مشترک فرم‌ها](#phase-a-لایهی-adapter-مشترک-فرم-ها)
   - 4.5 [Phase B: فعال‌سازی Edit برای همه فرم‌ها](#phase-b-فعال-سازی-edit-برای-همه-فرم-ها)
   - 4.6 [Responsive](#responsive)
5. [راهنمای اجرا (Runbook)](#راهنمای-اجرا-runbook)
6. [راهنمای تست/QA](#راهنمای-تستqa)
7. [Known Issues / محدودیت‌ها](#known-issues--محدودیت-ها)
8. [TODO / ادامه کار پیشنهادی](#todo--ادامه-کار-پیشنهادی)
9. [ضمیمه A — فایل‌ها و نقاط لمس‌شده](#ضمیمه-a--فایل-ها-و-نقاط-لمس-شده)
10. [ضمیمه B — دستورات متداول](#ضمیمه-b--دستورات-متداول)

---

## خلاصه مدیریتی
- **Role Catalog** به‌صورت **کُد-محور و Read-Only** پیاده شد. پیام یکتایی: «مدیر HSE فقط یک بار مجاز است.» ولیدیشن parent/child در ساخت/ویرایش/جابجایی اعمال می‌شود.
- **پرمیژن‌ها ساده‌سازی شدند به ۴ کلید**:
  1) `can_submit_forms` (ارسال/ثبت همه ۶ فرم)  
  2) `can_view_archive` (مشاهده آرشیو)  
  3) `can_edit_archive_entries` (ویرایش رکورد در آرشیو، وابسته به ۲)  
  4) `can_delete_archive_entries` (حذف رکورد در آرشیو، وابسته به ۲)
- **Archive**:
  - خروجی `GET /api/v1/archive/` نرمال شد (اضافه‌شدن `form_code`, `form_title`, `entry_id`, `created_by`).
  - **Dispatcher یکپارچهٔ فرم‌ها**: `GET|PATCH|DELETE /api/v1/forms/{form_code}/entries/{id}/` برای prefill/update/delete.
  - **SimpleArchivePermission** جایگزین AllowAny شد و به ۴ فلگ احترام می‌گذارد.
- **Users UI** بازطراحی شد (۴ چک‌باکس ساده + Badge در جدول).  
- **Organization**: onChangeها و فیلتر نقش/والد درست شد.  
- **Phase A (Adapter)**: رجیستری و utilهای نگاشت snake⇄camel و API مشترک فرم‌ها ساخته شد.  
- **Phase B (Edit)**: حالت ویرایش برای **تمام ۶ فرم** فعال شد (FR-01-01, FR-01-02, FR-01-03, FR-01-10/PR-01-07-01, FR-01-12, FR-01-28). مسیر create دست‌نخورده و سالم است.  
- **CSRF/Session**: wrapper فرانت با `credentials:'include'` و هدر `X-CSRFToken` فعال است.

---

## تایم‌لاین کارها (به‌تفکیک مراحل)
- **مرحله ۱ (بک‌اند پرمیژن ساده و Role Catalog):** ۴ پرمیژن ساده در serializers/views مپ شدند، پیام‌ها فارسی، تست نقش‌ها پاس شد. مایگریشن `accounts.0002` برای `RoleCatalog` و `UserProfile.role` اعمال شد.
- **مرحله ۲ (Users UI):** فرم ایجاد/ویرایش کاربر به ۴ چک‌باکس ساده تبدیل شد؛ وابستگی‌های منطقی (Edit/Delete ⇒ View) در UI enforce می‌شود؛ API فقط ۴ کلید جدید را می‌پذیرد.
- **مرحله ۳ (Archive/Permissions/API):**
  - گام ۱: `SimpleArchivePermission` جایگزین AllowAny در ویوست‌های آرشیو و فرم‌ها.
  - گام ۲: نرمال‌سازی خروجی `/archive` با `forms_registry.py`.
  - گام ۳: اضافه‌شدن `FormEntryView` (یکپارچه‌سازی GET|PATCH|DELETE).
  - گام ۴: UI آرشیو + اتصال دکمه‌های Edit/Delete (در ادامه Phase B تکمیل شد).
- **Phase A:** زیرساخت Adapter (types/registry/utils) + APIهای مشترک (`lib/api/archive.ts`, `lib/api/formEntry.ts`).
- **Phase B:** پایلوت FR-01-02 → تعمیم FR-01-01 → تعمیم به ۴ فرم باقی‌مانده (مجموعاً ۶ فرم).

---

## تغییرات بک‌اند

### Role Catalog قفل‌شده در کد
- **role_utils.py**: `ROLE_DEFINITIONS`/`ensure_roles_exist`/`generate_display_name` (scoped توسط والد + ارقام فارسی).  
- پیام یکتایی فارسی: «مدیر HSE فقط یک بار مجاز است.»  
- **serializers.py**: اعتبارسنجی نقش‌ها از روی کاتالوگ ثابت (ولیدیشن parent/child).  
- **views.py**: اندپوینت `GET /api/v1/auth/admin/roles/` لیست ثابت را برمی‌گرداند.

### Endpoints و قراردادهای API
- **نقش‌ها**: `GET /api/v1/auth/admin/roles/`  
- **پروفایل/مجوز**: `GET /api/v1/auth/me/` و `.../profile/`, `.../permissions/`  
- **آرشیو**: `GET /api/v1/archive/` (اکنون شامل `form_code`, `form_title`, `entry_id`, `created_by`)  
- **Entry یکپارچه**: `GET|PATCH|DELETE /api/v1/forms/{form_code}/entries/{id}/`  
- **CSRF**: `GET /api/v1/csrf/` (یا از `/auth/me/` برای ست‌کردن کوکی)

### Permission: چهار پرمیژن ساده
- **SimpleArchivePermission** (accounts/permissions.py):  
  - `list/retrieve` ⇒ `can_view_archive`  
  - `update/partial_update` ⇒ `can_view_archive` + `can_edit_archive_entries`  
  - `destroy` ⇒ `can_view_archive` + `can_delete_archive_entries`  
- این Permission روی `ArchiveViewSet` و ویوست‌های مرتبط با فرم‌ها اعمال شد.

### Archive: نرمال‌سازی خروجی و Dispatcher فرم‌ها
- **forms_registry.py**: مپ `form_type` → `form_code`/`form_title` (برای ۶ فرم فعلی).  
- **ArchiveViewSet**: خروجی یکدست + `created_by` شیء.  
- **FormEntryView**: با اتکا به رجیستری، مدل/serializer صحیح هر فرم را resolve می‌کند (GET/PUT/PATCH/DELETE).

### CSRF/Session
- **settings.py**: اعتماد به `http://localhost:3000` در CORS/CSRF (طبق محیط توسعه).  
- **فرانت**: fetch wrapper با `credentials:'include'` و هدر `X-CSRFToken` (خوانده‌شده از کوکی `csrftoken`).

---

## تغییرات فرانت‌اند

### Users: UI چهار چک‌باکس مجوز
- **app/admin/users/page.tsx**: حذف ماتریس CRUD و جایگزین با ۴ چک‌باکس.  
- **lib/api/admin.ts**: Create/Update با `simple_permissions`.  
- **lib/permissions/simple.ts**: نگاشت دوطرفه legacy↔︎simple (برای سازگاری).  
- **types/admin.ts**: کلیدها و تایپ‌های جدید.  
- جدول کاربران: Badgeهای Submit/Archive/Edit/Delete.

### Organization: onChange و فیلتر نقش/والد
- **app/admin/organization/page.tsx**: onChangeهای استاندارد (`e.target.value`)، کنترل‌شده، فیلتر نقش‌ها براساس والد، auto-select در صورت تنها گزینه، و حذف خطای `currentTarget.value`/null.

### Archive UI: اکشن‌های ویرایش/حذف
- **app/archive/page.tsx**: ستون Action با دکمه‌های Edit/Delete (نمایش بر اساس مجوزها)، دیالوگ تأیید حذف، Toast فارسی، ریسپانسیو مودال/جدول.  
- هدایت **Edit**: `/forms/{form_code}?entryId={entry_id}&mode=edit`.

### Phase A: لایه‌ی Adapter مشترک فرم‌ها
- **lib/formEntry/**:  
  - `types.ts` (اینترفیس `FormEntryAdapter<TServer, TState>`)  
  - `utils.ts` (snake⇄camel با cache)  
  - `registry.ts` + `index.ts` (register/resolve)  
- **lib/api/formEntry.ts**: `getEntry`, `updateEntry` (pass-through).  
- **lib/api/archive.ts**: `getArchiveList`, `deleteEntry`.

### Phase B: فعال‌سازی Edit برای همه فرم‌ها
- فرم‌های زیر به حالت Edit مجهز شدند (prefill + update + پیام‌های فارسی + حفظ مسیر create):
  - **FR-01-01**, **FR-01-02**, **FR-01-03**, **FR-01-10 (PR-01-07-01)**, **FR-01-12**, **FR-01-28**
- برای هر کدام **Adapter اختصاصی** در `lib/formEntry/adapters/*` اضافه شد و در رجیستری ثبت شد.

### Responsive
- جداول در موبایل: `overflow-x-auto`
- دکمه‌ها/ورودی‌ها: حداقل تاچ‌تارگت **44px**
- مودال‌ها: `max-w-[95vw]`, `p-4`, فیلدها `w-full`
- بهبود focus state و متن/هشدارهای فارسی

---

## راهنمای اجرا (Runbook)

### Backend
```powershell
cd C:\Mahdi\WebProjects\Gity\backend
.venv\Scripts\activate
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
> در اولین بار:  
> `python manage.py makemigrations accounts` (در صورت تغییر مدل) → `python manage.py migrate`  
> تست واحد نقش‌ها:  
> `python manage.py test accounts.tests.test_admin_roles -v 2`

### Frontend
```powershell
cd C:\Mahdi\WebProjects\Gity
# پاک‌سازی اختیاری
# rimraf .next node_modules
npm ci
npm run dev
```
> نکته: `npm run lint` در محیط فعلی Next.js نیاز به پیکربندی تعاملی ESLint دارد. بعداً فایل پیکربندی را اضافه کنید تا lint بلاک نشود.

---

## راهنمای تست/QA

### نقش‌ها و دسترسی
- `GET /api/v1/auth/admin/roles/` باید لیست ثابت نقش‌ها را برگرداند.
- تلاش برای ساخت دومین `hse_manager` ⇒ **400** با پیام فارسی.

### Users
- ساخت کاربر با چهار پرمیژن مختلف (Submit / Archive / Edit / Delete) و مشاهده Badgeها.
- وابستگی‌ها: فعال‌کردن Edit/Delete باید به‌صورت خودکار View را فعال کند (یا خطای ولیدیشن).

### Organization
- **Add+** زیر نودهای سطح ۲/۳ بدون خطا و با فیلتر نقش براساس والد.  
- **Move** نامعتبر در UI بلوکه شود؛ اگر ارسال شد ⇒ 400 با پیام فارسی.

### Archive
- لیست `/archive` شامل `form_code/title/entry_id/created_by` باشد.
- **Edit**: از آرشیو → صفحه فرم با **prefill کامل** → **بروزرسانی (200)** و Toast فارسی.  
- **Delete**: دیالوگ تأیید → **204/200** و رفرش لیست.  
- حالت کاربر فقط view: بدون دکمه‌های اکشن.

### فرم‌ها (۶ فرم)
- حالت **create** هم‌چنان کار کند (ثبت موفق).  
- حالت **edit** با prefill کامل و update موفق.  
- پیام‌های خطای 400/403/422 فارسی و کنار فیلد/بالا.

### Responsive
- عرض ≤ 360px: استفاده‌پذیری فرم‌ها/آرشیو/Users. اسکرین‌شات از iPhone SE/Pixel.

---

## Known Issues / محدودیت‌ها
- **ESLint**: `npm run lint` تعاملی است (Next.js config). باید فایل پیکربندی استاندارد افزوده شود تا CI بلاک نشود.
- **Versioning فرم‌ها**: در حال حاضر update مستقیم رکورد انجام می‌شود؛ اگر نیاز به history/نسخه‌ها باشد، باید به‌صورت soft-versioning اضافه شود.
- **Prefill Edge Cases**: اگر در آینده فیلدهای پیچیده/دینامیک اضافه شوند، ممکن است نیاز به بهبود آداپترها باشد.
- **Permission Mapping Legacy**: لایه‌ی نگاشت legacy↔︎simple موجود است؛ بهتر است مصرف legacy در UI حذف و یکپارچه شود.

---

## TODO / ادامه کار پیشنهادی
1. **ESLint/Prettier**: افزودن پیکربندی غیرتعاملی و تثبیت قواعد.
2. **Integration Tests (FE/BE)** برای موارد آرشیو (Edit/Delete) و Users (۴ پرمیژن).
3. **Soft Versioning** برای رکوردهای فرم (اختیاری، اگر نیاز مشتری باشد).
4. **Form Catalog** (اختیاری برای مقیاس‌پذیری تا ۵۰+ فرم): رجیستری فرم‌ها + مسیر داینامیک `/forms/[slug]`.
5. **بهبود پیام‌های خطا**: یکپارچه‌سازی نمایش خطاهای فیلدی و عمومی در همه فرم‌ها.
6. **Performance**: ایندکس‌های DB روی `reports_to_id`, `role_id`, `(form_code, created_at)` + pagination/filters در آرشیو.
7. **Docs**: README توسعه‌دهندگان دربارهٔ «چطور فرم جدید را برای Edit اضافه کنیم (Adapter)».

---

## ضمیمه A — فایل‌ها و نقاط لمس‌شده
> *اسامی دقیق ممکن است در پروژهٔ شما کمی متفاوت باشد؛ لیست زیر برای رجوع سریع است.*

- **Backend**
  - `backend/accounts/role_utils.py` (ROLE_DEFINITIONS, ensure_roles_exist, generate_display_name)
  - `backend/accounts/serializers.py` (ولیدیشن نقش/والد، simple perms mapping)
  - `backend/accounts/views.py` (roles endpoint، منطق admin users)
  - `backend/accounts/permissions.py` (**SimpleArchivePermission**)
  - `backend/hse/forms_registry.py` (نقشه‌ی `form_type` → `form_code/title`)
  - `backend/hse/views/archive.py` (نرمال‌سازی خروجی /archive)
  - `backend/hse/views/form_entries.py` (**FormEntryView** GET|PATCH|DELETE)
  - `backend/hse/urls.py`
  - Migration: `accounts.0002_rolecatalog_userprofile_role`
- **Frontend**
  - `app/admin/users/page.tsx` (۴ چک‌باکس مجوز + Badgeها)
  - `app/admin/organization/page.tsx` (onChange استاندارد + فیلتر نقش/والد)
  - `app/archive/page.tsx` (دکمه‌های Edit/Delete + ریسپانسیو)
  - `app/forms/fr-01-01/page.tsx`
  - `app/forms/fr-01-02/page.tsx`
  - `app/forms/fr-01-03/page.tsx`
  - `app/forms/fr-01-10/page.tsx`
  - `app/forms/fr-01-12/page.tsx`
  - `app/forms/fr-01-28/page.tsx`
  - `lib/api/_client.ts` (wrapper با CSRF)
  - `lib/api/admin.ts`, `lib/api/archive.ts`, `lib/api/formEntry.ts`
  - `lib/permissions/simple.ts`
  - `lib/formEntry/types.ts`, `utils.ts`, `registry.ts`, `index.ts`
  - `lib/formEntry/adapters/FR-01-01.ts`, `FR-01-02.ts`, `FR-01-03.ts`, `FR-01-10.ts`, `FR-01-12.ts`, `FR-01-28.ts`

---

## ضمیمه B — دستورات متداول

### مایگریشن و تست بک‌اند
```bash
python manage.py makemigrations accounts
python manage.py migrate
python manage.py test accounts.tests.test_admin_roles -v 2
```

### اجرای لوکال
```bash
# Backend
cd backend && .venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000

# Frontend
npm run dev
```

### نکتهٔ CSRF
- فرانت: wrapper با `credentials:'include'` و هدر `X-CSRFToken` (از کوکی).
- بک‌اند: `CsrfViewMiddleware` فعال + `CSRF_TRUSTED_ORIGINS` و `CORS_ALLOWED_ORIGINS` برای `http://localhost:3000`.
