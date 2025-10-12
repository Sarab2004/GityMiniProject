# 📋 مستندات کامل سیستم HSE - نسخه 2.0

## 🎯 معرفی کلی سیستم

**سیستم فرم‌های HSE** یک سیستم جامع مدیریت فرم‌های ایمنی، بهداشت و محیط زیست است که با استفاده از تکنولوژی‌های مدرن وب توسعه یافته است. این سیستم برای مدیریت و پیگیری فرآیندهای HSE در سازمان‌ها طراحی شده و شامل 6 فرم اصلی HSE می‌باشد.

### 🏗️ معماری کلی سیستم

```
Frontend (Next.js) ←→ Backend (Django REST API) ←→ Database (SQLite/PostgreSQL)
```

- **Frontend**: Next.js 14 با TypeScript و Tailwind CSS
- **Backend**: Django 5.0 با Django REST Framework
- **Database**: SQLite (توسعه) / PostgreSQL (Production)
- **Deployment**: Netlify (Frontend) / Railway (Backend)

---

## 📁 ساختار پروژه

### 🎨 Frontend Structure
```
├── app/                          # Next.js App Router
│   ├── page.tsx                  # صفحه اصلی (داشبورد)
│   ├── layout.tsx                # Layout اصلی
│   ├── globals.css               # استایل‌های全局
│   ├── login/                    # صفحه ورود
│   ├── forms/                    # فرم‌های HSE
│   │   ├── fr-01-01/            # اقدام اصلاحی/پیشگیرانه
│   │   ├── fr-01-02/            # پیگیری اقدامات
│   │   ├── fr-01-03/            # ثبت تغییرات
│   │   ├── fr-01-10/            # TBM - آموزش حین کار
│   │   ├── fr-01-12/            # تشکیل تیم همیاران
│   │   └── fr-01-28/            # ارزیابی ریسک
│   ├── archive/                  # آرشیو فرم‌ها
│   └── completed/                # فرم‌های تکمیل شده
├── components/                   # کامپوننت‌های قابل استفاده مجدد
│   ├── forms/
│   │   └── FormLayout.tsx       # Layout مشترک فرم‌ها
│   └── ui/                      # کامپوننت‌های UI
│       ├── TextInput.tsx
│       ├── Select.tsx
│       ├── DateInput.tsx
│       ├── JalaliDateInput.tsx
│       ├── NumberInput.tsx
│       ├── Textarea.tsx
│       ├── RadioGroup.tsx
│       ├── CheckboxGroup.tsx
│       ├── FormSection.tsx
│       └── RowRepeater.tsx
├── contexts/
│   └── AuthContext.tsx          # مدیریت احراز هویت
├── lib/                         # توابع کمکی و API
│   ├── auth.ts                  # احراز هویت و API calls
│   ├── hse.ts                   # API های HSE
│   └── data.ts                  # توابع داده
└── public/
    └── fonts/                   # فونت‌های فارسی (Peyda)
```

### 🔧 Backend Structure
```
├── backend/
│   ├── config/                  # تنظیمات Django
│   │   ├── settings.py          # تنظیمات اصلی
│   │   ├── urls.py              # URL routing
│   │   ├── wsgi.py              # WSGI config
│   │   ├── asgi.py              # ASGI config
│   │   ├── cors_middleware.py   # CORS middleware
│   │   └── csrf_middleware.py   # CSRF middleware
│   ├── hse/                     # اپلیکیشن اصلی HSE
│   │   ├── models.py            # مدل‌های دیتابیس
│   │   ├── urls.py              # URL routing HSE
│   │   ├── views/               # ViewSets و Views
│   │   │   ├── base.py          # Base ViewSet
│   │   │   ├── actions.py       # مدیریت اقدامات
│   │   │   ├── risks.py         # مدیریت ریسک‌ها
│   │   │   ├── reference.py     # داده‌های مرجع
│   │   │   ├── teams.py         # مدیریت تیم‌ها
│   │   │   ├── tracking.py      # پیگیری اقدامات
│   │   │   ├── completed.py     # فرم‌های تکمیل شده
│   │   │   └── archive.py       # آرشیو
│   │   ├── serializers/         # Serializers
│   │   │   ├── actions.py
│   │   │   ├── risks.py
│   │   │   ├── reference.py
│   │   │   ├── teams.py
│   │   │   ├── tracking.py
│   │   │   └── archive.py
│   │   ├── services/            # Business Logic
│   │   │   ├── indicator.py     # تولید شناسه خودکار
│   │   │   └── risk.py          # محاسبات ریسک
│   │   ├── management/          # Django Commands
│   │   │   └── commands/
│   │   │       └── seed_demo.py # داده‌های نمونه
│   │   └── migrations/          # Database migrations
│   ├── accounts/                # مدیریت کاربران
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── common/                  # مدل‌های مشترک
│   │   └── models.py            # Base models
│   ├── manage.py                # Django management
│   ├── requirements.txt         # Dependencies
│   ├── create_superuser.py      # ایجاد superuser
│   ├── setup.sh                 # Setup script
│   ├── Procfile                 # Heroku/Railway config
│   └── railway.json             # Railway config
```

---

## 🗄️ ساختار دیتابیس

### 📊 مدل‌های اصلی

#### 1. **مدل‌های مرجع (Reference Models)**
```python
# Project - پروژه‌ها
class Project(CodeNamedModel):
    code: str (unique)           # کد پروژه (مثل AS, NP)
    name: str                    # نام پروژه
    is_active: bool              # وضعیت فعال/غیرفعال

# Contractor - پیمانکاران
class Contractor(NamedModel):
    name: str                    # نام پیمانکار

# OrgUnit - واحدهای سازمانی
class OrgUnit(NamedModel):
    name: str                    # نام واحد

# Section - بخش‌ها
class Section(NamedModel):
    name: str                    # نام بخش
    org_unit: ForeignKey         # واحد سازمانی

# Person - اشخاص
class Person(TimeStampedModel):
    full_name: str               # نام کامل
    role: str                    # نقش/سمت
    phone: str                   # تلفن
    email: str                   # ایمیل
    contractor: ForeignKey       # پیمانکار
```

#### 2. **مدل‌های HSE اصلی**

##### **ActionForm - فرم اقدامات**
```python
class ActionForm(TimeStampedModel):
    indicator: str (unique)      # شناسه اقدام (مثل NP-25-001)
    project: ForeignKey          # پروژه
    requester_name: str          # نام درخواست‌کننده
    requester_unit_text: str     # واحد درخواست‌کننده
    request_date: Date           # تاریخ درخواست
    request_type: str            # نوع درخواست (CORRECTIVE/PREVENTIVE/CHANGE/SUGGESTION)
    sources: JSONField           # منابع شناسایی
    nonconformity_or_change_desc: TextField  # توضیح عدم انطباق/تغییر
    root_cause_or_goal_desc: TextField       # علت ریشه‌ای/هدف
    needs_risk_update: bool      # نیاز به به‌روزرسانی ریسک
    risk_update_date: Date       # تاریخ به‌روزرسانی ریسک
    creates_knowledge: bool      # ایجاد دانش
    approved_by_performer_name: str    # تاییدکننده اجرا
    approved_by_manager_name: str      # تاییدکننده مدیر
    exec1_approved: bool         # تایید اجرا 1
    exec1_note: TextField        # یادداشت اجرا 1
    exec1_new_date: Date         # تاریخ جدید اجرا 1
    exec2_approved: bool         # تایید اجرا 2
    exec2_note: TextField        # یادداشت اجرا 2
    exec2_new_date: Date         # تاریخ جدید اجرا 2
    effectiveness_checked_at: Date     # تاریخ بررسی اثربخشی
    effectiveness_method_text: TextField    # روش بررسی اثربخشی
    effective: bool              # اثربخش بودن
    new_action_indicator: str    # شناسه اقدام جدید
```

##### **ActionItem - آیتم‌های اقدام**
```python
class ActionItem(TimeStampedModel):
    action: ForeignKey           # اقدام مربوطه
    description_text: TextField  # توضیح اقدام
    resources_text: TextField    # منابع مورد نیاز
    due_date: Date               # تاریخ سررسید
    owner_text: str              # مسئول اجرا
```

##### **RiskRecord - سوابق ریسک**
```python
class RiskRecord(TimeStampedModel):
    project: ForeignKey          # پروژه
    unit: ForeignKey             # واحد
    section: ForeignKey          # بخش
    process_title: str           # عنوان فرآیند
    activity_desc: TextField     # توضیح فعالیت
    routine_flag: str            # روتین/غیرروتین (R/N)
    hazard_desc: TextField       # توضیح خطر
    event_desc: TextField        # توضیح رویداد
    consequence_desc: TextField  # توضیح پیامد
    root_cause_desc: TextField   # توضیح علت ریشه‌ای
    existing_controls_desc: TextField  # کنترل‌های موجود
    inputs: JSONField            # ورودی‌ها
    legal_requirement_text: TextField  # الزام قانونی
    legal_status: str            # وضعیت قانونی (COMPLIANT/NONCOMPLIANT)
    risk_type: str               # نوع ریسک (SAFETY/HEALTH/PROPERTY)
    
    # محاسبات ریسک اولیه
    A: int                       # احتمال (1-5)
    B: int                       # قرارگیری در معرض (1-5)
    C: int                       # پیامد (1-5)
    E: int (auto)                # احتمال × قرارگیری (A×B)
    S: int                       # شدت (1-5)
    P: int (auto)                # احتمال × شدت (E×S)
    D: int                       # قابلیت کشف (1-5)
    RPN: int (auto)              # RPN (P×D)
    acceptance: str              # وضعیت پذیرش
    
    # محاسبات ریسک ثانویه (بعد از اقدامات)
    A2: int                      # احتمال 2
    B2: int                      # قرارگیری 2
    C2: int                      # پیامد 2
    E2: int                      # احتمال × قرارگیری 2
    S2: int                      # شدت 2
    P2: int                      # احتمال × شدت 2
    D2: int                      # قابلیت کشف 2
    RPN2: int                    # RPN 2
    acceptance2: str             # وضعیت پذیرش 2
```

##### **SafetyTeam - تیم‌های ایمنی**
```python
class SafetyTeam(TimeStampedModel):
    project: ForeignKey          # پروژه
    prepared_by_name: str        # تهیه‌کننده
    approved_by_name: str        # تاییدکننده

class TeamMember(TimeStampedModel):
    team: ForeignKey             # تیم
    contractor: ForeignKey       # پیمانکار
    unit: ForeignKey             # واحد
    section: ForeignKey          # بخش
    representative_name: str     # نام نماینده
    signature_text: str          # امضا
    tbm_no: str                  # شماره TBM
```

##### **ToolboxMeeting - جلسات آموزش**
```python
class ToolboxMeeting(TimeStampedModel):
    tbm_no: str (unique)         # شماره TBM
    project: ForeignKey          # پروژه
    date: Date                   # تاریخ
    topic_text: str              # موضوع
    trainer_text: str            # مربی

class TBMAttendee(TimeStampedModel):
    tbm: ForeignKey              # جلسه TBM
    full_name: str               # نام کامل
    role_text: str               # نقش
    signature_text: str          # امضا
```

##### **ActionTracking - پیگیری اقدامات**
```python
class ActionTracking(TimeStampedModel):
    action: ForeignKey           # اقدام
    issue_desc: TextField        # توضیح مسئله
    action_desc: TextField       # توضیح اقدام
    source: str                  # منبع
    executor_text: str           # مجری
    due_date: Date               # تاریخ سررسید
    review_date_1: Date          # تاریخ بررسی 1
    review_date_2: Date          # تاریخ بررسی 2
    review_date_3: Date          # تاریخ بررسی 3
    resolved: bool               # حل شده
    is_knowledge: bool           # دانش
    effective: bool              # اثربخش
    new_action_indicator: str    # شناسه اقدام جدید
```

##### **ChangeLog - ثبت تغییرات**
```python
class ChangeLog(TimeStampedModel):
    action: ForeignKey           # اقدام
    subject_text: TextField      # موضوع
    date_registered: Date        # تاریخ ثبت
    date_applied: Date           # تاریخ اعمال
    owner_text: str              # مالک
    required_actions_text: TextField  # اقدامات مورد نیاز
    related_action_no_text: str  # شماره اقدام مرتبط
    notes_text: TextField        # یادداشت‌ها
```

##### **SequenceCounter - شمارنده‌های ترتیبی**
```python
class SequenceCounter(models.Model):
    origin_code: str             # کد مبدا (2 کاراکتر)
    year2: str                   # سال (2 رقم)
    last_serial: int             # آخرین شماره سریال
```

---

## 🔌 API Endpoints

### 📡 ساختار کلی API
```
Base URL: /api/v1/
Authentication: Session-based
Content-Type: application/json
```

### 🎯 Endpoints اصلی

#### **1. Reference Data (داده‌های مرجع)**
```
GET    /api/v1/projects/                    # لیست پروژه‌ها
POST   /api/v1/projects/                    # ایجاد پروژه جدید

GET    /api/v1/contractors/                 # لیست پیمانکاران
POST   /api/v1/contractors/                 # ایجاد پیمانکار جدید

GET    /api/v1/org-units/                   # لیست واحدهای سازمانی
POST   /api/v1/org-units/                   # ایجاد واحد جدید

GET    /api/v1/sections/                    # لیست بخش‌ها
POST   /api/v1/sections/                    # ایجاد بخش جدید

GET    /api/v1/persons/                     # لیست اشخاص
POST   /api/v1/persons/                     # ایجاد شخص جدید
```

#### **2. Actions (اقدامات)**
```
GET    /api/v1/actions/                     # لیست اقدامات
POST   /api/v1/actions/                     # ایجاد اقدام جدید
GET    /api/v1/actions/{id}/                # جزئیات اقدام
PUT    /api/v1/actions/{id}/                # ویرایش اقدام
DELETE /api/v1/actions/{id}/                # حذف اقدام

POST   /api/v1/actions/{id}/items/          # افزودن آیتم اقدام
POST   /api/v1/actions/{id}/execution-report/  # گزارش اجرا
POST   /api/v1/actions/{id}/effectiveness/     # ارزیابی اثربخشی
```

#### **3. Risks (ریسک‌ها)**
```
GET    /api/v1/risks/                       # لیست ریسک‌ها
POST   /api/v1/risks/                       # ایجاد ریسک جدید
GET    /api/v1/risks/{id}/                  # جزئیات ریسک
PUT    /api/v1/risks/{id}/                  # ویرایش ریسک
DELETE /api/v1/risks/{id}/                  # حذف ریسک

POST   /api/v1/risks/{id}/reeval/           # ارزیابی مجدد ریسک
```

#### **4. Safety Teams (تیم‌های ایمنی)**
```
GET    /api/v1/safety-teams/                # لیست تیم‌ها
POST   /api/v1/safety-teams/                # ایجاد تیم جدید
GET    /api/v1/safety-teams/{id}/           # جزئیات تیم
PUT    /api/v1/safety-teams/{id}/           # ویرایش تیم
DELETE /api/v1/safety-teams/{id}/           # حذف تیم

POST   /api/v1/safety-teams/{id}/members/   # افزودن عضو تیم
```

#### **5. Toolbox Meetings (جلسات آموزش)**
```
GET    /api/v1/tbm/                         # لیست جلسات TBM
POST   /api/v1/tbm/                         # ایجاد جلسه جدید
GET    /api/v1/tbm/{id}/                    # جزئیات جلسه
PUT    /api/v1/tbm/{id}/                    # ویرایش جلسه
DELETE /api/v1/tbm/{id}/                    # حذف جلسه

POST   /api/v1/tbm/{id}/attendees/          # افزودن حاضر
```

#### **6. Action Tracking (پیگیری اقدامات)**
```
GET    /api/v1/action-trackings/            # لیست پیگیری‌ها
POST   /api/v1/action-trackings/            # ایجاد پیگیری جدید
GET    /api/v1/action-trackings/{id}/       # جزئیات پیگیری
PUT    /api/v1/action-trackings/{id}/       # ویرایش پیگیری
DELETE /api/v1/action-trackings/{id}/       # حذف پیگیری
```

#### **7. Change Logs (ثبت تغییرات)**
```
GET    /api/v1/changes/                     # لیست تغییرات
POST   /api/v1/changes/                     # ایجاد تغییر جدید
GET    /api/v1/changes/{id}/                # جزئیات تغییر
PUT    /api/v1/changes/{id}/                # ویرایش تغییر
DELETE /api/v1/changes/{id}/                # حذف تغییر
```

#### **8. Archive (آرشیو)**
```
GET    /api/v1/archive/                     # لیست فرم‌های آرشیو
GET    /api/v1/archive/{id}/                # جزئیات فرم آرشیو
DELETE /api/v1/archive/{id}/                # حذف فرم آرشیو
```

#### **9. Completed Forms (فرم‌های تکمیل شده)**
```
GET    /api/v1/completed/risks              # ریسک‌های تکمیل شده
GET    /api/v1/completed/actions            # اقدامات تکمیل شده
```

#### **10. Authentication (احراز هویت)**
```
GET    /api/v1/auth/me/                     # اطلاعات کاربر فعلی
POST   /api/v1/auth/login/                  # ورود
POST   /api/v1/auth/logout/                 # خروج
GET    /api/v1/csrf/                        # دریافت CSRF token
```

---

## 🎨 Frontend Components

### 🧩 کامپوننت‌های UI

#### **1. FormLayout**
```typescript
interface FormLayoutProps {
    title: string                 // عنوان فرم
    code?: string                 // کد فرم
    children: React.ReactNode     // محتوای فرم
    onReset?: () => void          // تابع پاک‌کردن
    onSubmit?: () => void         // تابع ارسال
    loading?: boolean             // وضعیت بارگذاری
    error?: string | null         // پیام خطا
    success?: string | null       // پیام موفقیت
    footer?: React.ReactNode      // محتوای footer
}
```

#### **2. Input Components**
```typescript
// TextInput
interface TextInputProps {
    label: string
    value: string
    onChange: (value: string) => void
    error?: string
    required?: boolean
    placeholder?: string
    disabled?: boolean
}

// Select
interface SelectProps {
    label: string
    value: string
    onChange: (value: string) => void
    options: Option[]
    error?: string
    required?: boolean
    placeholder?: string
    disabled?: boolean
}

// DateInput
interface DateInputProps {
    label: string
    value: string
    onChange: (value: string) => void
    error?: string
    required?: boolean
    disabled?: boolean
}

// JalaliDateInput (تقویم شمسی)
interface JalaliDateInputProps {
    label: string
    value: string
    onChange: (value: string) => void
    error?: string
    required?: boolean
    disabled?: boolean
}

// NumberInput
interface NumberInputProps {
    label: string
    value: number
    onChange: (value: number) => void
    error?: string
    required?: boolean
    min?: number
    max?: number
    step?: number
    disabled?: boolean
}

// Textarea
interface TextareaProps {
    label: string
    value: string
    onChange: (value: string) => void
    error?: string
    required?: boolean
    placeholder?: string
    rows?: number
    disabled?: boolean
}

// RadioGroup
interface RadioGroupProps {
    label: string
    value: string
    onChange: (value: string) => void
    options: Option[]
    error?: string
    required?: boolean
    disabled?: boolean
}

// CheckboxGroup
interface CheckboxGroupProps {
    label: string
    value: string[]
    onChange: (value: string[]) => void
    options: Option[]
    error?: string
    required?: boolean
    disabled?: boolean
}

// FormSection
interface FormSectionProps {
    title: string
    children: React.ReactNode
    collapsible?: boolean
    defaultCollapsed?: boolean
}

// RowRepeater
interface RowRepeaterProps {
    label: string
    rows: any[]
    onAdd: () => void
    onRemove: (index: number) => void
    onUpdate: (index: number, data: any) => void
    children: (row: any, index: number) => React.ReactNode
    error?: string
    minRows?: number
    maxRows?: number
}
```

### 🔐 Authentication Context
```typescript
interface AuthContextValue {
    user: AuthUser | null         // کاربر فعلی
    loading: boolean              // وضعیت بارگذاری
    login: (username: string, password: string) => Promise<{ error?: string }>
    logout: () => Promise<void>
    refresh: () => Promise<void>
}

interface AuthUser {
    id: number
    username: string
    full_name: string
}
```

---

## 📋 فرم‌های HSE

### 🎯 فرم‌های پیاده‌سازی شده

#### **1. FR-01-01: اقدام اصلاحی/پیشگیرانه/تغییرات**
- **مسیر**: `/forms/fr-01-01`
- **هدف**: ثبت و پیگیری اقدامات اصلاحی، پیشگیرانه و تغییرات
- **ویژگی‌ها**:
  - تولید خودکار شناسه اقدام (مثل NP-25-001)
  - ثبت آیتم‌های اقدام
  - گزارش‌های اجرا (2 مرحله)
  - ارزیابی اثربخشی
  - پیوند با ریسک‌ها

#### **2. FR-01-02: پیگیری اقدامات**
- **مسیر**: `/forms/fr-01-02`
- **هدف**: پیگیری و بررسی وضعیت اقدامات انجام شده
- **ویژگی‌ها**:
  - انتخاب اقدام از لیست موجود
  - ثبت گزارش پیگیری
  - تعیین وضعیت حل مسئله
  - ارزیابی اثربخشی

#### **3. FR-01-03: ثبت و پیگیری تغییرات**
- **مسیر**: `/forms/fr-01-03`
- **هدف**: ثبت و مدیریت تغییرات در فرآیندها و سیستم‌ها
- **ویژگی‌ها**:
  - ثبت تغییرات جدید
  - تعیین تاریخ اعمال
  - تعیین مسئول
  - پیوند با اقدامات مرتبط

#### **4. FR-01-10: TBM - آموزش حین کار**
- **مسیر**: `/forms/fr-01-10`
- **هدف**: ثبت جلسات آموزش حین کار و آموزش‌های ایمنی
- **ویژگی‌ها**:
  - تولید خودکار شماره TBM
  - ثبت موضوع و مربی
  - ثبت حاضرین جلسه
  - امضاهای دیجیتال

#### **5. FR-01-12: تشکیل تیم همیاران HSE**
- **مسیر**: `/forms/fr-01-12`
- **هدف**: تشکیل و مدیریت تیم‌های همیاران ایمنی و بهداشت
- **ویژگی‌ها**:
  - انتخاب پروژه
  - تعیین تهیه‌کننده و تاییدکننده
  - ثبت اعضای تیم
  - تعیین نمایندگان از هر بخش

#### **6. FR-01-28: شناسایی و ارزیابی ریسک**
- **مسیر**: `/forms/fr-01-28`
- **هدف**: شناسایی، ارزیابی و مدیریت ریسک‌های ایمنی، بهداشتی و اموال
- **ویژگی‌ها**:
  - محاسبه خودکار RPN
  - ارزیابی اولیه و ثانویه
  - تعیین وضعیت پذیرش
  - پیوند با اقدامات اصلاحی

---

## 🔧 ویژگی‌های فنی

### ⚡ محاسبات خودکار

#### **1. تولید شناسه اقدام**
```python
def next_indicator(origin_code: str, year2: str) -> str:
    """
    تولید شناسه اقدام خودکار
    فرمت: {ORIGIN}-{YEAR}-{SERIAL}
    مثال: NP-25-001
    """
    counter, created = SequenceCounter.objects.get_or_create(
        origin_code=origin_code[:2],
        year2=year2,
        defaults={'last_serial': 0}
    )
    counter.last_serial += 1
    counter.save()
    return f"{origin_code[:2]}-{year2}-{counter.last_serial:03d}"
```

#### **2. محاسبات ریسک**
```python
def calculate_risk_values(A: int, B: int, C: int, S: int, D: int):
    """
    محاسبه خودکار مقادیر ریسک
    """
    E = A * B                    # احتمال × قرارگیری
    P = E * S                    # احتمال × شدت
    RPN = P * D                  # RPN
    
    # تعیین وضعیت پذیرش
    if RPN <= 25:
        acceptance = "L_ACCEPTABLE"
    elif RPN <= 100:
        acceptance = "H_UNACCEPTABLE"
    else:
        acceptance = "LEGAL_NONCOMPLIANT"
    
    return E, P, RPN, acceptance
```

### 🎨 رابط کاربری

#### **1. طراحی RTL**
- پشتیبانی کامل از راست به چپ
- فونت فارسی Peyda
- رنگ‌بندی مناسب برای محیط کار

#### **2. Responsive Design**
- سازگار با موبایل و تبلت
- استفاده از Tailwind CSS
- Grid و Flexbox layouts

#### **3. تجربه کاربری**
- فرم‌های مرحله‌ای
- اعتبارسنجی real-time
- پیام‌های خطا و موفقیت
- امکان پرینت فرم‌ها

### 🔒 امنیت

#### **1. احراز هویت**
- Session-based authentication
- CSRF protection
- Secure cookies

#### **2. اعتبارسنجی**
- Server-side validation
- Client-side validation
- Sanitization of inputs

#### **3. CORS Configuration**
- تنظیمات دقیق CORS
- Whitelist origins
- Credential support

---

## 🚀 Deployment

### 🌐 Frontend (Netlify)
- **URL**: https://phenomenal-lebkuchen-289df9.netlify.app
- **Build Command**: `npm run build`
- **Publish Directory**: `out/`
- **Environment Variables**:
  ```
  NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
  NODE_ENV=production
  ```

### 🔧 Backend (Railway)
- **URL**: `https://your-railway-domain.railway.app`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python manage.py migrate && python manage.py collectstatic --noinput && python create_superuser.py && python manage.py seed_demo && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --forwarded-allow-ips '*'`
- **Environment Variables**:
  ```
  DEBUG=False
  SECRET_KEY=django-insecure-change-me-for-production
  ALLOWED_HOSTS=*
  CORS_ALLOWED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app
  CSRF_TRUSTED_ORIGINS=https://your-railway-domain.railway.app
  DATABASE_URL=postgresql://...
  ```

### 📊 Database
- **Development**: SQLite
- **Production**: PostgreSQL
- **Migrations**: Django migrations
- **Backup**: Manual backup scripts

---

## 📈 وضعیت فعلی سیستم

### ✅ ویژگی‌های پیاده‌سازی شده

#### **Backend**
- ✅ Django REST API کامل
- ✅ 6 فرم HSE اصلی
- ✅ سیستم احراز هویت
- ✅ محاسبات خودکار ریسک
- ✅ تولید شناسه خودکار
- ✅ Soft delete
- ✅ API documentation (Swagger)
- ✅ CORS configuration
- ✅ Database migrations

#### **Frontend**
- ✅ Next.js 14 با App Router
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ 6 فرم HSE کامل
- ✅ سیستم آرشیو
- ✅ Authentication context
- ✅ Responsive design
- ✅ RTL support
- ✅ Print functionality

#### **Database**
- ✅ 15+ مدل اصلی
- ✅ روابط Foreign Key
- ✅ Indexes برای performance
- ✅ JSON fields برای داده‌های پیچیده
- ✅ Soft delete implementation

### 🎯 قابلیت‌های کلیدی

1. **مدیریت کامل فرم‌ها**: ایجاد، ویرایش، حذف، مشاهده
2. **سیستم آرشیو**: جستجو، فیلتر، مشاهده فرم‌های تکمیل شده
3. **محاسبات خودکار**: RPN، شناسه اقدامات، وضعیت پذیرش
4. **رابط کاربری فارسی**: RTL، فونت فارسی، رنگ‌بندی مناسب
5. **احراز هویت**: Session-based، امن و قابل اعتماد
6. **پرینت فرم‌ها**: امکان پرینت مستقیم از مرورگر
7. **Responsive**: سازگار با تمام دستگاه‌ها
8. **API کامل**: RESTful API با documentation

### 🔄 Workflow سیستم

1. **ورود کاربر**: احراز هویت با username/password
2. **انتخاب فرم**: از داشبورد اصلی
3. **پر کردن فرم**: با اعتبارسنجی real-time
4. **ثبت اطلاعات**: ذخیره در دیتابیس
5. **مشاهده آرشیو**: جستجو و فیلتر فرم‌ها
6. **مدیریت داده‌ها**: از طریق Admin Panel

---

## 🛠️ راه‌اندازی و توسعه

### 📋 پیش‌نیازها
- Node.js 18+
- Python 3.11+
- Git

### 🚀 راه‌اندازی محلی

#### **Backend**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo
python manage.py runserver
```

#### **Frontend**
```bash
npm install
npm run dev
```

### 🔧 دستورات مفید

#### **Backend**
```bash
# ایجاد migration جدید
python manage.py makemigrations

# اعمال migrations
python manage.py migrate

# ایجاد superuser
python manage.py createsuperuser

# بارگذاری داده‌های نمونه
python manage.py seed_demo

# اجرای tests
python manage.py test

# جمع‌آوری فایل‌های static
python manage.py collectstatic
```

#### **Frontend**
```bash
# نصب dependencies
npm install

# اجرای development server
npm run dev

# Build برای production
npm run build

# Export static files
npm run export

# Linting
npm run lint
```

---

## 📚 منابع و مستندات

### 🔗 لینک‌های مفید
- **Frontend**: https://phenomenal-lebkuchen-289df9.netlify.app
- **Backend Admin**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/api/v1/docs/
- **API Schema**: http://localhost:8000/api/v1/schema/

### 📖 فایل‌های مستندات موجود
- `README.md` - راهنمای کلی
- `LIVE_SYSTEM_GUIDE.md` - راهنمای سیستم زنده
- `SYSTEM_STATUS.md` - وضعیت فعلی سیستم
- `راهنمای_استفاده_سیستم_HSE.md` - راهنمای کاربری
- `DEPLOYMENT_GUIDE.md` - راهنمای deployment
- `RAILWAY_*.md` - راهنماهای Railway deployment

### 🎯 نکات مهم برای توسعه

1. **Database Changes**: همیشه migration ایجاد کنید
2. **API Changes**: Serializers را به‌روزرسانی کنید
3. **Frontend Changes**: TypeScript types را به‌روزرسانی کنید
4. **Testing**: قبل از deployment تست کنید
5. **Documentation**: تغییرات را مستند کنید

---

## 🎉 خلاصه

**سیستم فرم‌های HSE** یک سیستم کامل و جامع برای مدیریت فرآیندهای ایمنی، بهداشت و محیط زیست است که شامل:

- **6 فرم HSE اصلی** با قابلیت‌های کامل
- **Backend Django** با API RESTful
- **Frontend Next.js** با رابط کاربری فارسی
- **سیستم آرشیو** با جستجو و فیلتر
- **محاسبات خودکار** ریسک و شناسه‌ها
- **احراز هویت** امن و قابل اعتماد
- **Deployment** آماده برای production

سیستم آماده استفاده است و می‌تواند برای مدیریت HSE در سازمان‌ها مورد استفاده قرار گیرد.

---

**نسخه**: 2.0  
**تاریخ**: 1403/10/05  
**وضعیت**: آماده برای Production  
**توسعه‌دهنده**: تیم توسعه HSE

