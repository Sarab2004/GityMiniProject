# 📋 راهنمای بازیابی سیستم HSE

## 🎯 نقطه بازگشت امن (Safe Point)

- **تاریخ**: 2025-10-07
- **برنچ**: `main`
- **کامیت**: `acd94c5`
- **تگ‌های مهم**:
  - `production-v1.0-20251007` - نسخه production آماده
  - `stable-20251007-010300` - نسخه پایدار و تست شده
  - `deploy-20251007-005547` - نسخه deploy شده روی VPS

## 🔄 بازگشت به وضعیت پایدار

### روش 1: بازگشت با تگ production (توصیه می‌شود)
```bash
cd ~/app/GityMiniProject
git fetch --all
git checkout production-v1.0-20251007
sudo systemctl restart hse-gunicorn
npm ci && npm run build
sudo rsync -av --delete out/ /var/www/hse/site/
sudo systemctl reload nginx
```

### روش 2: بازگشت به آخرین کامیت main
```bash
cd ~/app/GityMiniProject
git fetch --all
git checkout main
git pull origin main
sudo systemctl restart hse-gunicorn
npm ci && npm run build
sudo rsync -av --delete out/ /var/www/hse/site/
sudo systemctl reload nginx
```

### روش 3: بازگشت به کامیت خاص
```bash
cd ~/app/GityMiniProject
git fetch --all
git checkout acd94c5
sudo systemctl restart hse-gunicorn
```

## 💾 بازیابی دیتابیس

### مشاهده بک‌آپ‌های موجود
```bash
ls -lh ~/backups/db-backup-*.sqlite3
```

### بازگردانی آخرین بک‌آپ
```bash
# ابتدا بک‌آپ از دیتابیس فعلی بگیرید
cp ~/app/GityMiniProject/backend/db.sqlite3 ~/app/GityMiniProject/backend/db.sqlite3.before-restore

# بازگردانی بک‌آپ
cp ~/backups/db-backup-20251007-010302.sqlite3 ~/app/GityMiniProject/backend/db.sqlite3

# ری‌استارت سرویس
sudo systemctl restart hse-gunicorn
```

## ⚙️ بازیابی تنظیمات

### بازیابی فایل .env (Backend)
```bash
# مشاهده بک‌آپ‌ها
ls -lh ~/backups/.env-backup-*

# بازگردانی تنظیمات VPS production
cat > ~/app/GityMiniProject/backend/.env << 'ENVEOF'
SECRET_KEY=django-insecure-change-me
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost,85.198.15.148
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://85.198.15.148
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://85.198.15.148
DATABASE_URL=sqlite:///db.sqlite3
ENVEOF

sudo systemctl restart hse-gunicorn
```

### بازیابی کانفیگ Nginx
```bash
sudo cp ~/backups/nginx-hse-20251007-010302.conf /etc/nginx/sites-available/hse.conf
sudo nginx -t
sudo systemctl reload nginx
```

**محتوای کانفیگ Nginx:**
```nginx
server {
    listen 80;
    server_name 85.198.15.148;

    # Frontend (خروجی استاتیک Next)
    root /var/www/hse/site;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API (Django on Gunicorn)
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    client_max_body_size 20m;
}
```

### بازیابی سرویس systemd
```bash
sudo cp ~/backups/hse-gunicorn-20251007-010302.service /etc/systemd/system/hse-gunicorn.service
sudo systemctl daemon-reload
sudo systemctl restart hse-gunicorn
```

**محتوای سرویس systemd:**
```ini
[Unit]
Description=HSE Django Gunicorn
After=network.target

[Service]
Type=notify
User=hseuser
Group=hseuser
WorkingDirectory=/home/hseuser/app/GityMiniProject/backend
EnvironmentFile=/home/hseuser/app/GityMiniProject/backend/.env
ExecStart=/home/hseuser/app/GityMiniProject/backend/.venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 2 --access-logfile - --error-logfile -
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## 🧪 تست سلامت سیستم

### تست Backend (Gunicorn)
```bash
# تست مستقیم روی پورت 8000
curl -I http://127.0.0.1:8000/api/v1/csrf/
# باید 200 OK برگرداند

# تست از پشت Nginx
curl -I http://85.198.15.148/api/v1/csrf/
# باید 200 OK برگرداند
```

### تست Authentication Flow
```bash
# دریافت CSRF
rm -f /tmp/test_cookies.txt
curl -c /tmp/test_cookies.txt http://85.198.15.148/api/v1/csrf/ -o /dev/null
csrf=$(awk '/csrftoken/ {print $7}' /tmp/test_cookies.txt | tail -1)

# لاگین
curl -i -b /tmp/test_cookies.txt -c /tmp/test_cookies.txt \
  -H "X-CSRFToken: $csrf" -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  http://85.198.15.148/api/v1/auth/login/
# باید 200 OK برگرداند

# تست auth/me
curl -b /tmp/test_cookies.txt http://85.198.15.148/api/v1/auth/me/
# باید اطلاعات کاربر را برگرداند
```

### تست کامل End-to-End
```bash
# کوکی‌جار جدید
rm -f /tmp/cj.txt
curl -sS -c /tmp/cj.txt http://85.198.15.148/api/v1/csrf/ -o /dev/null
csrf=$(awk '/csrftoken/ {print $7}' /tmp/cj.txt | tail -1)

# لاگین
curl -sS -i -b /tmp/cj.txt -c /tmp/cj.txt \
  -H "X-CSRFToken: $csrf" -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  http://85.198.15.148/api/v1/auth/login/ | head -n 1

# ساخت فرم اقدام اصلاحی
curl -sS -i -b /tmp/cj.txt -c /tmp/cj.txt \
  -H "X-CSRFToken: $csrf" -H "Content-Type: application/json" \
  -d '{
    "project": 1,
    "requester_name": "TestUser",
    "requester_unit_text": "HSE",
    "request_date": "2025-10-07",
    "request_type": "CORRECTIVE",
    "sources": ["OTHER"],
    "nonconformity_or_change_desc": "test",
    "root_cause_or_goal_desc": "test root"
  }' \
  http://85.198.15.148/api/v1/actions/ | tee /tmp/action.out | head -n 1

# استخراج ID و افزودن آیتم
ACTION_ID=$(tail -1 /tmp/action.out | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
curl -sS -i -b /tmp/cj.txt -c /tmp/cj.txt \
  -H "X-CSRFToken: $csrf" -H "Content-Type: application/json" \
  -d '{
    "description_text": "نصب حفاظ",
    "resources_text": "نرده فلزی",
    "due_date": "2025-10-20",
    "owner_text": "واحد تدارکات"
  }' \
  "http://85.198.15.148/api/v1/actions/${ACTION_ID}/items/" | head -n 1
```

### بررسی وضعیت سرویس‌ها
```bash
# Gunicorn
sudo systemctl status hse-gunicorn

# Nginx
sudo systemctl status nginx

# بررسی پورت‌ها
sudo ss -tlnp | grep -E ":(80|8000)"

# بررسی لاگ‌ها
sudo journalctl -u hse-gunicorn -n 50 --no-pager
sudo tail -n 50 /var/log/nginx/error.log
sudo tail -n 50 /var/log/nginx/access.log
```

## 🆘 بازیابی کامل (در صورت خرابی شدید)

### مرحله 1: Clone مجدد
```bash
cd ~/app
mv GityMiniProject GityMiniProject.broken-$(date +%Y%m%d-%H%M%S)
git clone https://github.com/Sarab2004/GityMiniProject.git
cd GityMiniProject
git checkout production-v1.0-20251007
```

### مرحله 2: بازگردانی Backend
```bash
# ایجاد virtual environment
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# بازگردانی .env
cat > .env << 'ENVEOF'
SECRET_KEY=django-insecure-change-me
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost,85.198.15.148
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://85.198.15.148
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://85.198.15.148
DATABASE_URL=sqlite:///db.sqlite3
ENVEOF

# بازگردانی دیتابیس
cp ~/backups/db-backup-20251007-010302.sqlite3 db.sqlite3

# تست Django
python manage.py check
python manage.py showmigrations

deactivate
```

### مرحله 3: بازگردانی Frontend
```bash
cd ~/app/GityMiniProject
npm ci
npm run build
sudo rsync -av --delete out/ /var/www/hse/site/
```

### مرحله 4: Restart سرویس‌ها
```bash
sudo systemctl restart hse-gunicorn
sudo systemctl reload nginx
```

## 📦 ساختار بک‌آپ‌ها

```
~/backups/
├── db-backup-20251007-010302.sqlite3          # دیتابیس SQLite
├── nginx-hse-20251007-010302.conf             # کانفیگ Nginx
├── hse-gunicorn-20251007-010302.service       # سرویس systemd
└── .env-backup-*                              # تنظیمات محیطی (اگر موجود باشد)
```

## 🔧 رفع مشکلات رایج

### مشکل 1: Gunicorn بالا نمی‌آید
```bash
# بررسی لاگ
sudo journalctl -u hse-gunicorn -n 100 --no-pager

# اجرا در فورگراند برای دیدن خطا
cd ~/app/GityMiniProject/backend
source .venv/bin/activate
python -m gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 2 --log-level debug
```

**خطاهای رایج:**
- **MRO Error در csrf_middleware**: `MiddlewareMixin` را از inheritance حذف کنید
- **DisallowedHost**: IP سرور را به `ALLOWED_HOSTS` اضافه کنید
- **Import Error**: `pip install -r requirements.txt` را اجرا کنید

### مشکل 2: Nginx 502 Bad Gateway
```bash
# بررسی که گانیکورن روی پورت 8000 گوش می‌دهد
sudo ss -tlnp | grep 8000

# اگر پورت خالی است، گانیکورن را ری‌استارت کنید
sudo systemctl restart hse-gunicorn
```

### مشکل 3: CSRF Token Invalid
```bash
# بررسی CSRF_TRUSTED_ORIGINS در .env
cat ~/app/GityMiniProject/backend/.env | grep CSRF

# باید شامل IP سرور باشد:
# CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://85.198.15.148
```

### مشکل 4: Frontend صفحه سفید نشان می‌دهد
```bash
# بررسی فایل‌های استاتیک
ls -lh /var/www/hse/site/

# rebuild و deploy مجدد
cd ~/app/GityMiniProject
npm ci
npm run build
sudo rsync -av --delete out/ /var/www/hse/site/
sudo systemctl reload nginx
```

## ✅ چک‌لیست بعد از بازیابی

- [ ] `sudo systemctl status hse-gunicorn` → active (running)
- [ ] `sudo systemctl status nginx` → active (running)
- [ ] `curl -I http://127.0.0.1:8000/api/v1/csrf/` → 200 OK
- [ ] `curl -I http://85.198.15.148/api/v1/csrf/` → 200 OK
- [ ] لاگین از مرورگر کار می‌کند (`http://85.198.15.148/login`)
- [ ] ساخت فرم اقدام اصلاحی کار می‌کند
- [ ] اضافه کردن آیتم به فرم کار می‌کند
- [ ] دریافت لیست پروژه‌ها کار می‌کند
- [ ] آرشیو فرم‌ها قابل مشاهده است

## 📞 اطلاعات سیستم

- **IP سرور**: 85.198.15.148
- **User**: hseuser
- **Password**: 12345678
- **مسیر پروژه**: `/home/hseuser/app/GityMiniProject`
- **مسیر Frontend**: `/var/www/hse/site/`
- **Backend Port**: 8000 (Gunicorn)
- **Frontend Port**: 80 (Nginx)
- **Python Version**: 3.10
- **Node Version**: (نصب شده روی VPS)

## 🔗 لینک‌های مفید

- **Repository**: https://github.com/Sarab2004/GityMiniProject
- **Commits**: https://github.com/Sarab2004/GityMiniProject/commits/main
- **Tags**: https://github.com/Sarab2004/GityMiniProject/tags
- **دسترسی وب**: http://85.198.15.148

## 📝 تاریخچه تغییرات مهم

### 2025-10-07 - Production v1.0
- ✅ رفع خطای MRO در `csrf_middleware.py`
- ✅ اضافه کردن IP سرور به `ALLOWED_HOSTS`
- ✅ تست کامل end-to-end موفق
- ✅ بک‌آپ کامل از دیتابیس و تنظیمات
- ✅ Merge به برنچ `main`
- ✅ ایجاد تگ‌های `stable` و `production`

### فایل‌های کلیدی تغییر یافته:
- `backend/config/csrf_middleware.py` - رفع MRO error
- `backend/.env` - اضافه کردن IP سرور
- `backend/config/settings.py` - تنظیمات CORS و CSRF
- `lib/auth.ts` - Normalize API paths و auto-inject CSRF
- `.env.production` - تنظیم `NEXT_PUBLIC_API_BASE_URL=/api`

---

**ساخته شده**: 2025-10-07 01:15 UTC  
**نسخه**: Production v1.0  
**وضعیت**: ✅ Stable & Production Ready  
**تست شده**: ✅ Login, Forms, Items, Archive - همه کار می‌کنند

