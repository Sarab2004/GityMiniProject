# 🚀 Railway Deployment - الان انجام بده!

## ⚠️ **مشکل فعلی:**
- Frontend: ✅ روی Netlify deploy شده
- Backend: ❌ هنوز روی Railway deploy نشده
- اتصال: ❌ Frontend به localhost متصل شده (اشتباه!)

## 🔧 **راه‌حل: Railway Deployment**

### **مرحله 1: ورود به Railway**
1. به https://railway.app برو
2. **"Sign in with GitHub"** کلیک کن
3. **Authorize Railway** برای دسترسی به repository

### **مرحله 2: ایجاد پروژه**
1. **"New Project"** کلیک کن
2. **"Deploy from GitHub repo"** انتخاب کن
3. **Repository:** `Sarab2004/GityMiniProject` انتخاب کن
4. **"Deploy Now"** کلیک کن

### **مرحله 3: تنظیمات Service**
1. روی service کلیک کن
2. **Settings** > **Root Directory**
3. **Value:** `backend`
4. **Save** کلیک کن

### **مرحله 4: Environment Variables**
**Settings** > **Variables** > **Add Variable:**

```
DEBUG=False
SECRET_KEY=django-insecure-change-me-for-production
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app
CSRF_TRUSTED_ORIGINS=https://your-railway-domain.railway.app
```

### **مرحله 5: Database**
1. **"New"** > **"Database"** > **"PostgreSQL"**
2. Database خودکار اضافه می‌شه
3. **DATABASE_URL** خودکار تنظیم می‌شه

### **مرحله 6: Deploy**
1. **"Deploy"** کلیک کن
2. منتظر بمان تا build کامل بشه (5-10 دقیقه)
3. **Domain** رو کپی کن (مثل: `https://xxx.railway.app`)

## 🔗 **اتصال Frontend به Railway**

### **بعد از گرفتن Railway URL:**
```bash
netlify env:set NEXT_PUBLIC_API_BASE_URL https://your-railway-domain.railway.app
netlify deploy --prod
```

## ✅ **نتیجه نهایی:**

### **Frontend (Netlify):**
- **لینک:** https://phenomenal-lebkuchen-289df9.netlify.app
- **وضعیت:** ✅ زنده

### **Backend (Railway):**
- **لینک:** `https://your-railway-domain.railway.app`
- **وضعیت:** ✅ زنده و عمومی

### **اتصال:**
- **Frontend** ↔ **Backend:** ✅ متصل
- **دسترسی:** ✅ عمومی (همه می‌تونن استفاده کنن)

## 🎯 **محدودیت‌ها:**

### **Netlify (Frontend):**
- **Bandwidth:** 100GB/ماه رایگان
- **Builds:** 300 دقیقه/ماه رایگان
- **Sites:** نامحدود

### **Railway (Backend):**
- **Usage:** $5/ماه رایگان
- **Database:** 1GB رایگان
- **Bandwidth:** نامحدود

## 📞 **اطلاعات ورود:**
- **نام کاربری:** `admin`
- **رمز عبور:** `admin123`

---

**⏱️ زمان:** 15-20 دقیقه  
**🎯 نتیجه:** سیستم کاملاً عمومی و زنده

**الان Railway رو deploy کن تا سیستم کاملاً عمومی بشه!** 🚀
