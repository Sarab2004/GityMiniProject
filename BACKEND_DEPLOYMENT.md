# راهنمای Deployment Backend Django روی Railway

## 🚀 مراحل Deployment Backend

### مرحله 1: ورود به Railway
1. به آدرس https://railway.app بروید
2. با GitHub account وارد شوید
3. روی "New Project" کلیک کنید

### مرحله 2: اتصال Repository
1. "Deploy from GitHub repo" را انتخاب کنید
2. Repository `Sarab2004/GityMiniProject` را انتخاب کنید
3. "Deploy Now" کلیک کنید

### مرحله 3: تنظیمات Service
1. **Root Directory:** `backend` را انتخاب کنید
2. **Build Command:** `pip install -r requirements.txt`
3. **Start Command:** `python manage.py runserver 0.0.0.0:$PORT`

### مرحله 4: Environment Variables
در بخش "Variables" اضافه کنید:

```env
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=your-railway-domain.railway.app
CORS_ALLOWED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app
CSRF_TRUSTED_ORIGINS=https://your-railway-domain.railway.app
```

### مرحله 5: Database Setup
1. **PostgreSQL Service** اضافه کنید:
   - در پروژه Railway، "New" > "Database" > "PostgreSQL"
   - Database URL خودکار تنظیم می‌شود

2. **Database Migration:**
   - در "Deployments" > "View Logs"
   - دستورات زیر را اجرا کنید:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py seed_demo
   ```

### مرحله 6: تنظیمات CORS
در `backend/config/settings.py` اطمینان حاصل کنید:
```python
CORS_ALLOWED_ORIGINS = [
    "https://phenomenal-lebkuchen-289df9.netlify.app",
]
CSRF_TRUSTED_ORIGINS = [
    "https://your-railway-domain.railway.app",
]
```

## 🔗 اتصال Frontend به Backend

### مرحله 7: به‌روزرسانی Frontend
1. در Netlify، Environment Variables را به‌روزرسانی کنید:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-railway-domain.railway.app
```

2. Redeploy کنید:
```bash
netlify deploy --prod
```

## ✅ تست نهایی

### چک‌لیست:
- [ ] Backend روی Railway در دسترس است
- [ ] Database migrations اجرا شده
- [ ] Superuser ایجاد شده
- [ ] Demo data seed شده
- [ ] CORS تنظیم شده
- [ ] Frontend به Backend متصل است
- [ ] تمام فرم‌ها کار می‌کنند
- [ ] سیستم آرشیو فعال است

## 🎯 لینک‌های نهایی

- **Frontend:** https://phenomenal-lebkuchen-289df9.netlify.app
- **Backend:** https://your-railway-domain.railway.app
- **Admin Panel:** https://your-railway-domain.railway.app/admin

## 📞 اطلاعات ورود

- **نام کاربری:** `admin`
- **رمز عبور:** `admin123`

---

**وضعیت:** آماده برای Full-Stack Deployment  
**تاریخ:** 1403/10/05
