# راهنمای Deployment روی Netlify - نسخه 2.0

## 🚀 مراحل Deployment

### مرحله 1: آماده‌سازی Repository

1. **Push کردن کد به GitHub:**
```bash
git push origin main
```

2. **اطمینان از وجود فایل‌های ضروری:**
- ✅ `netlify.toml` - تنظیمات Netlify
- ✅ `package.json` - dependencies و scripts
- ✅ `next.config.js` - تنظیمات Next.js برای static export
- ✅ `out/` - فایل‌های static ساخته شده

### مرحله 2: ایجاد سایت در Netlify

1. **ورود به Netlify:**
   - به آدرس https://netlify.com بروید
   - با GitHub account وارد شوید

2. **ایجاد سایت جدید:**
   - روی "New site from Git" کلیک کنید
   - "GitHub" را انتخاب کنید
   - Repository پروژه را انتخاب کنید

3. **تنظیمات Build:**
   - **Branch to deploy:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `out`
   - **Node version:** `18`

### مرحله 3: تنظیم Environment Variables

در بخش "Site settings" > "Environment variables" اضافه کنید:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
NODE_ENV=production
```

### مرحله 4: تنظیمات Domain

1. **Domain سفارشی (اختیاری):**
   - در بخش "Domain management"
   - "Add custom domain" کلیک کنید
   - دامنه مورد نظر را وارد کنید

2. **SSL Certificate:**
   - به صورت خودکار فعال می‌شود
   - HTTPS رایگان از Let's Encrypt

## 🔧 تنظیمات Backend

### برای Django Backend:

1. **Deploy روی Heroku/Railway/DigitalOcean:**
```bash
# مثال برای Heroku
git subtree push --prefix backend heroku main
```

2. **تنظیم Environment Variables:**
```env
DEBUG=False
ALLOWED_HOSTS=your-backend-url.com
CORS_ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
```

3. **Database:**
   - از PostgreSQL استفاده کنید (نه SQLite)
   - تنظیمات DATABASE_URL

## 📱 تست نهایی

### چک‌لیست قبل از ارسال به کارفرما:

- [ ] سایت روی Netlify در دسترس است
- [ ] تمام فرم‌ها کار می‌کنند
- [ ] سیستم آرشیو فعال است
- [ ] فیلترها کار می‌کنند
- [ ] حذف فرم‌ها کار می‌کند
- [ ] Modal مشاهده جزئیات کار می‌کند
- [ ] Backend API در دسترس است
- [ ] CORS تنظیم شده است
- [ ] SSL Certificate فعال است

## 🔗 لینک‌های مفید

- **Frontend:** https://your-app-name.netlify.app
- **Backend:** https://your-backend-url.com
- **Admin Panel:** https://your-backend-url.com/admin

## 📞 پشتیبانی Deployment

### مشکلات رایج:

**Build Failed:**
- چک کنید که `npm run build` محلی کار می‌کند
- Environment variables را بررسی کنید

**API Connection Error:**
- CORS settings را چک کنید
- Backend URL را بررسی کنید

**404 Errors:**
- `netlify.toml` redirects را بررسی کنید
- Static files در `out/` directory موجود باشند

## 🎯 آماده برای ارسال

پس از تکمیل مراحل بالا:

1. **لینک Netlify** را به کارفرما ارسال کنید
2. **راهنمای کاربری** (`راهنمای_استفاده_سیستم_HSE.md`) را ضمیمه کنید
3. **اطلاعات ورود** را ارائه دهید:
   - نام کاربری: `admin`
   - رمز عبور: `admin123`

---

**وضعیت:** ✅ آماده برای Production  
**تاریخ:** 1403/10/05  
**نسخه:** 2.0
