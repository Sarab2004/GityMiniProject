# 🚀 راهنمای کامل Railway Deployment

## مرحله 1: ورود به Railway

1. **به Railway برو:** https://railway.app
2. **Sign in with GitHub** کلیک کن
3. **Authorize Railway** برای دسترسی به repository

## مرحله 2: ایجاد پروژه جدید

1. **"New Project"** کلیک کن
2. **"Deploy from GitHub repo"** انتخاب کن
3. **Repository:** `Sarab2004/GityMiniProject` انتخاب کن
4. **"Deploy Now"** کلیک کن

## مرحله 3: تنظیمات Service

### 3.1 Root Directory:
- روی service کلیک کن
- **Settings** > **Root Directory**
- **Value:** `backend`
- **Save** کلیک کن

### 3.2 Environment Variables:
**Settings** > **Variables** > **Add Variable:**

```
DEBUG=False
SECRET_KEY=django-insecure-change-me-for-production
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app
CSRF_TRUSTED_ORIGINS=https://your-railway-domain.railway.app
```

### 3.3 Database:
1. **"New"** > **"Database"** > **"PostgreSQL"**
2. Database خودکار اضافه می‌شه
3. **DATABASE_URL** خودکار تنظیم می‌شه

## مرحله 4: Deploy

1. **"Deploy"** کلیک کن
2. منتظر بمان تا build کامل بشه (5-10 دقیقه)
3. **Domain** رو کپی کن (مثل: `https://xxx.railway.app`)

## مرحله 5: اتصال Frontend

### 5.1 به‌روزرسانی Netlify:
```bash
netlify env:set NEXT_PUBLIC_API_BASE_URL https://your-railway-domain.railway.app
```

### 5.2 Redeploy:
```bash
netlify deploy --prod
```

## مرحله 6: تست

### 6.1 Backend:
- **Admin:** `https://your-railway-domain.railway.app/admin`
- **API:** `https://your-railway-domain.railway.app/api/`

### 6.2 Frontend:
- **Main:** `https://phenomenal-lebkuchen-289df9.netlify.app`
- **Login:** `admin` / `admin123`

## ✅ چک‌لیست نهایی

- [ ] Railway project ایجاد شده
- [ ] Backend deploy شده
- [ ] Database متصل شده
- [ ] Environment variables تنظیم شده
- [ ] Frontend به Backend متصل شده
- [ ] Login کار می‌کند
- [ ] فرم‌ها submit می‌شوند

## 🎯 لینک‌های نهایی

- **Frontend:** https://phenomenal-lebkuchen-289df9.netlify.app
- **Backend:** `https://your-railway-domain.railway.app`
- **Admin:** `https://your-railway-domain.railway.app/admin`

## 📞 اطلاعات ورود

- **نام کاربری:** `admin`
- **رمز عبور:** `admin123`

---

**⏱️ زمان تخمینی:** 15-20 دقیقه  
**🎯 نتیجه:** تجربه کامل local روی web
