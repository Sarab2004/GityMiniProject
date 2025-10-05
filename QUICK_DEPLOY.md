# 🚀 راهنمای سریع Deployment - Full Stack

## مرحله 1: Backend روی Railway

### 1️⃣ ورود به Railway:
- به https://railway.app برو
- با GitHub وارد شو

### 2️⃣ ایجاد پروژه:
- "New Project" کلیک کن
- "Deploy from GitHub repo" انتخاب کن
- Repository: `Sarab2004/GityMiniProject`

### 3️⃣ تنظیمات Service:
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
- **Start Command:** `python manage.py runserver 0.0.0.0:$PORT`

### 4️⃣ Environment Variables:
```
DEBUG=False
SECRET_KEY=django-insecure-change-me-for-production
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app
CSRF_TRUSTED_ORIGINS=https://your-railway-domain.railway.app
```

### 5️⃣ Database:
- "New" > "Database" > "PostgreSQL" اضافه کن
- Database URL خودکار تنظیم می‌شه

### 6️⃣ Setup Commands:
در Railway Console اجرا کن:
```bash
python manage.py createsuperuser --username admin --email admin@example.com --noinput
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); u = User.objects.get(username='admin'); u.set_password('admin123'); u.save()"
python manage.py seed_demo
```

## مرحله 2: اتصال Frontend

### 7️⃣ به‌روزرسانی Netlify:
- در Netlify، "Site settings" > "Environment variables"
- اضافه کن:
```
NEXT_PUBLIC_API_BASE_URL=https://your-railway-domain.railway.app
```

### 8️⃣ Redeploy:
```bash
netlify deploy --prod
```

## ✅ تست نهایی

### چک‌لیست:
- [ ] Backend Railway URL کار می‌کنه
- [ ] Frontend به Backend متصل شده
- [ ] Login کار می‌کنه
- [ ] فرم‌ها submit می‌شن
- [ ] آرشیو کار می‌کنه

## 🎯 لینک‌های نهایی

- **Frontend:** https://phenomenal-lebkuchen-289df9.netlify.app
- **Backend:** https://your-railway-domain.railway.app
- **Admin:** https://your-railway-domain.railway.app/admin

## 📞 اطلاعات ورود

- **نام کاربری:** `admin`
- **رمز عبور:** `admin123`

---

**⏱️ زمان تخمینی:** 10-15 دقیقه  
**🎯 نتیجه:** تجربه کامل local روی web
