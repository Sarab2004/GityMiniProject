# سیستم فرم‌های HSE - نسخه 2.0

## 🚀 راه‌اندازی سریع

### برای توسعه محلی:

#### Backend (Django):
```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo
python manage.py runserver
```

#### Frontend (Next.js):
```bash
npm install
npm run dev
```

### برای Production (Netlify):

1. **Build کردن پروژه:**
```bash
npm run build
```

2. **فایل‌های آماده برای deployment:**
- پوشه `out/` شامل فایل‌های static است
- فایل `netlify.toml` تنظیمات deployment را شامل می‌شود

## 📋 ویژگی‌های سیستم

### فرم‌های HSE:
- **FR-01-01:** ایجاد اقدام اصلاحی/پیشگیرانه
- **FR-01-02:** پیگیری اقدامات
- **FR-01-03:** ثبت و پیگیری تغییرات
- **FR-01-10:** TBM - آموزش حین کار
- **FR-01-12:** تشکیل تیم همیاران HSE
- **FR-01-28:** شناسایی و ارزیابی ریسک

### ویژگی‌های کلیدی:
- ✅ سیستم آرشیو کامل با فیلتر و جستجو
- ✅ محاسبات خودکار ریسک (E/P/RPN)
- ✅ رابط کاربری فارسی با RTL
- ✅ سیستم احراز هویت
- ✅ امکان پرینت فرم‌ها
- ✅ مدیریت کامل داده‌ها

## 🔧 تنظیمات Environment

برای production، متغیرهای زیر را تنظیم کنید:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
NODE_ENV=production
```

## 📱 دسترسی

- **Frontend:** https://your-netlify-app.netlify.app
- **Backend:** https://your-backend-url.com

## 📞 پشتیبانی

برای راهنمای کامل استفاده، فایل `راهنمای_استفاده_سیستم_HSE.md` را مطالعه کنید.

---

**نسخه:** 2.0  
**تاریخ:** 1403/10/05  
**وضعیت:** آماده برای Production