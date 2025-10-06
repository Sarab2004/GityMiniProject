# 🎉 سیستم HSE زنده و آماده استفاده!

## ✅ وضعیت فعلی:

### 🌐 Frontend (Netlify):
**لینک:** https://phenomenal-lebkuchen-289df9.netlify.app
- ✅ Deploy شده و کار می‌کند
- ✅ به Backend متصل شده

### 🔧 Backend (Local Server):
**لینک:** http://localhost:8000
- ✅ Server راه‌اندازی شده
- ✅ Database آماده
- ✅ API endpoints کار می‌کند

## 🚀 نحوه استفاده:

### 1️⃣ ورود به سیستم:
- **Frontend:** https://phenomenal-lebkuchen-289df9.netlify.app
- **Login:** `admin` / `admin123`

### 2️⃣ مدیریت Backend:
- **Admin Panel:** http://localhost:8000/admin
- **API:** http://localhost:8000/api/

### 3️⃣ فرم‌های موجود:
- **FR-01-01:** فرم گزارش حادثه
- **FR-01-02:** فرم ارزیابی ریسک
- **FR-01-03:** فرم اقدام اصلاحی
- **FR-01-10:** فرم تغییرات
- **FR-01-12:** فرم تیم
- **FR-01-28:** فرم پیگیری

## 🔧 مدیریت سیستم:

### Backend Server:
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

### Frontend Deploy:
```bash
netlify deploy --prod
```

### Database Management:
```bash
cd backend
python manage.py shell
python manage.py migrate
python manage.py createsuperuser
```

## 📊 ویژگی‌های سیستم:

### ✅ فرم‌ها:
- ایجاد و ویرایش فرم‌ها
- ذخیره خودکار
- اعتبارسنجی داده‌ها
- آپلود فایل

### ✅ آرشیو:
- مشاهده فرم‌های تکمیل شده
- جستجو و فیلتر
- گزارش‌گیری

### ✅ مدیریت:
- پنل ادمین Django
- مدیریت کاربران
- تنظیمات سیستم

## 🎯 تست سیستم:

### 1️⃣ تست Frontend:
- به https://phenomenal-lebkuchen-289df9.netlify.app برو
- با `admin` / `admin123` وارد شو
- یک فرم جدید بساز
- آن را تکمیل کن

### 2️⃣ تست Backend:
- به http://localhost:8000/admin برو
- با `admin` / `admin123` وارد شو
- فرم‌های ایجاد شده را ببین

### 3️⃣ تست API:
- به http://localhost:8000/api/ برو
- API endpoints را تست کن

## 🔄 به‌روزرسانی:

### Frontend:
```bash
git add .
git commit -m "Update frontend"
git push origin main
netlify deploy --prod
```

### Backend:
```bash
cd backend
git add .
git commit -m "Update backend"
git push origin main
python manage.py runserver 0.0.0.0:8000
```

## 📞 پشتیبانی:

### مشکلات رایج:
1. **Backend کار نمی‌کند:** Server را restart کن
2. **Frontend به Backend متصل نمی‌شود:** Environment variables را چک کن
3. **Database error:** Migration ها را اجرا کن

### لاگ‌ها:
- **Frontend:** Netlify dashboard
- **Backend:** Terminal output
- **Database:** Django admin panel

---

**🎉 سیستم HSE شما کاملاً زنده و آماده استفاده است!**

**Frontend:** https://phenomenal-lebkuchen-289df9.netlify.app  
**Backend:** http://localhost:8000  
**Admin:** http://localhost:8000/admin  
**Login:** `admin` / `admin123`
