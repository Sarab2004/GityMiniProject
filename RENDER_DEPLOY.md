# 🚀 Render Deployment - رایگان و آسان!

## ✅ **چرا Render:**
- **رایگان:** 750 ساعت/ماه
- **PostgreSQL:** رایگان
- **Auto-deploy:** از GitHub
- **آسان:** بدون CLI

## 🔧 **مراحل Render:**

### **1️⃣ ورود به Render:**
- به https://render.com برو
- **"Sign up"** کلیک کن
- با GitHub account: `sarab2004` وارد شو

### **2️⃣ ایجاد Web Service:**
- **"New +"** کلیک کن
- **"Web Service"** انتخاب کن
- **"Build and deploy from a Git repository"** انتخاب کن
- **"Connect GitHub"** کلیک کن

### **3️⃣ تنظیمات Repository:**
- **Repository:** `Sarab2004/GityMiniProject` انتخاب کن
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Python 3`
- **Build Command:** `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput && python create_superuser.py && python manage.py seed_demo`
- **Start Command:** `gunicorn config.wsgi:application`

### **4️⃣ Environment Variables:**
```
DEBUG=False
SECRET_KEY=django-insecure-change-me-for-production
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app
CSRF_TRUSTED_ORIGINS=https://your-render-domain.onrender.com
```

### **5️⃣ Database:**
- **"New +"** > **"PostgreSQL"**
- **"Create Database"** کلیک کن
- **Database URL** خودکار تنظیم می‌شه

### **6️⃣ Deploy:**
- **"Create Web Service"** کلیک کن
- منتظر بمان تا build کامل بشه (5-10 دقیقه)

## 🔗 **اتصال Frontend:**

### **بعد از گرفتن Render URL:**
```bash
netlify env:set NEXT_PUBLIC_API_BASE_URL https://your-render-domain.onrender.com
netlify deploy --prod
```

## ✅ **نتیجه:**
- **Frontend:** https://phenomenal-lebkuchen-289df9.netlify.app
- **Backend:** `https://your-render-domain.onrender.com`
- **Database:** PostgreSQL رایگان
- **اتصال:** ✅ کامل

---

**الان به Render برو و deploy کن!** 🚀
