# 🚀 راهنمای نهایی Railway Deployment

## ✅ وضعیت فعلی:
- **Frontend:** https://phenomenal-lebkuchen-289df9.netlify.app ✅
- **Backend:** آماده برای deploy ⏳

## 🔧 مراحل Railway Deployment:

### 1️⃣ ورود به Railway:
- **URL:** https://railway.app
- **Sign in with GitHub** کلیک کن
- **Authorize Railway** برای دسترسی به repository

### 2️⃣ ایجاد پروژه:
- **"New Project"** کلیک کن
- **"Deploy from GitHub repo"** انتخاب کن
- **Repository:** `Sarab2004/GityMiniProject` انتخاب کن
- **"Deploy Now"** کلیک کن

### 3️⃣ تنظیمات Service:
- روی service کلیک کن
- **Settings** > **Root Directory**
- **Value:** `backend`
- **Save** کلیک کن

### 4️⃣ Environment Variables:
**Settings** > **Variables** > **Add Variable:**

```
DEBUG=False
SECRET_KEY=django-insecure-change-me-for-production
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app
CSRF_TRUSTED_ORIGINS=https://your-railway-domain.railway.app
```

### 5️⃣ Database:
- **"New"** > **"Database"** > **"PostgreSQL"**
- Database خودکار اضافه می‌شه
- **DATABASE_URL** خودکار تنظیم می‌شه

### 6️⃣ Deploy:
- **"Deploy"** کلیک کن
- منتظر بمان تا build کامل بشه (5-10 دقیقه)
- **Domain** رو کپی کن (مثل: `https://xxx.railway.app`)

## 🔗 اتصال Frontend:

### 7️⃣ به‌روزرسانی Netlify:
```bash
netlify env:set NEXT_PUBLIC_API_BASE_URL https://your-railway-domain.railway.app
netlify deploy --prod
```

## ✅ تست نهایی:

### 8️⃣ چک کردن:
- **Backend:** `https://your-railway-domain.railway.app/admin`
- **Frontend:** `https://phenomenal-lebkuchen-289df9.netlify.app`
- **Login:** `admin` / `admin123`

## 🎯 نتیجه نهایی:

- **Frontend:** https://phenomenal-lebkuchen-289df9.netlify.app
- **Backend:** `https://your-railway-domain.railway.app`
- **Admin:** `https://your-railway-domain.railway.app/admin`

## 📞 اطلاعات ورود:

- **نام کاربری:** `admin`
- **رمز عبور:** `admin123`

---

**⏱️ زمان تخمینی:** 15-20 دقیقه  
**🎯 نتیجه:** تجربه کامل local روی web
