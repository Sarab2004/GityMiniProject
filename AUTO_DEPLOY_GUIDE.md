# 🤖 راهنمای خودکار Deployment

## مرحله 1: Railway Web Interface

### 1️⃣ ورود به Railway:
- URL: https://railway.app
- Sign in with GitHub
- Authorize Railway

### 2️⃣ ایجاد پروژه:
- "New Project" کلیک کن
- "Deploy from GitHub repo" انتخاب کن
- Repository: `Sarab2004/GityMiniProject`
- "Deploy Now" کلیک کن

### 3️⃣ تنظیمات Service:
- روی service کلیک کن
- Settings > Root Directory: `backend`
- Settings > Variables > Add:
  ```
  DEBUG=False
  SECRET_KEY=django-insecure-change-me-for-production
  ALLOWED_HOSTS=*
  CORS_ALLOWED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app
  ```

### 4️⃣ Database:
- "New" > "Database" > "PostgreSQL"
- Database خودکار اضافه می‌شه

### 5️⃣ Deploy:
- "Deploy" کلیک کن
- منتظر بمان (5-10 دقیقه)
- Domain رو کپی کن

## مرحله 2: اتصال Frontend

### 6️⃣ به‌روزرسانی Netlify:
```bash
netlify env:set NEXT_PUBLIC_API_BASE_URL https://your-railway-domain.railway.app
netlify deploy --prod
```

## مرحله 3: تست

### 7️⃣ چک کردن:
- Backend: `https://your-railway-domain.railway.app/admin`
- Frontend: `https://phenomenal-lebkuchen-289df9.netlify.app`
- Login: `admin` / `admin123`

---

**⏱️ زمان:** 15-20 دقیقه  
**🎯 نتیجه:** Full Stack Deployment
