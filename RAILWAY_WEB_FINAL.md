# 🚀 Railway Web Interface - راهنمای کامل

## ✅ **وضعیت فعلی:**
- **Frontend:** https://phenomenal-lebkuchen-289df9.netlify.app ✅
- **Backend:** ⏳ منتظر Railway deploy

## 🌐 **مراحل Railway Web Interface:**

### **1️⃣ ورود به Railway:**
- به https://railway.app برو
- **"Sign in with GitHub"** کلیک کن
- با GitHub account: `sarab2004` وارد شو

### **2️⃣ ایجاد پروژه:**
- **"New Project"** کلیک کن
- **"Deploy from GitHub repo"** انتخاب کن
- **Repository:** `Sarab2004/GityMiniProject` انتخاب کن
- **"Deploy Now"** کلیک کن

### **3️⃣ تنظیمات Service:**
- روی service کلیک کن
- **"Settings"** برو
- **"Root Directory"** پیدا کن
- **Value:** `backend` وارد کن
- **"Save"** کلیک کن

### **4️⃣ Environment Variables:**
**"Variables"** > **"New Variable"** > اضافه کن:

```
DEBUG=False
SECRET_KEY=django-insecure-change-me-for-production
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app
CSRF_TRUSTED_ORIGINS=https://your-railway-domain.railway.app
```

### **5️⃣ Database:**
- **"New"** > **"Database"** > **"PostgreSQL"**
- Database خودکار اضافه می‌شه
- **DATABASE_URL** خودکار تنظیم می‌شه

### **6️⃣ Deploy:**
- **"Deploy"** کلیک کن
- منتظر بمان تا build کامل بشه (5-10 دقیقه)

## 🔗 **اتصال Frontend:**

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

## 📞 **اطلاعات ورود:**
- **نام کاربری:** `admin`
- **رمز عبور:** `admin123`

---

**⏱️ زمان:** 15-20 دقیقه  
**🎯 نتیجه:** سیستم کاملاً عمومی و زنده

**الان به Railway برو و deploy کن!** 🚀
