# راهنمای دیپلوی HSE Application روی VPS

## اطلاعات سرور
- **IP Address**: 85.198.15.148
- **User**: hseuser
- **Domain**: 85.198.15.148 (می‌توانید بعداً دامنه خود را اضافه کنید)

## مراحل دیپلوی

### مرحله 1: اتصال به سرور
```bash
ssh hseuser@85.198.15.148
```

### مرحله 2: نصب وابستگی‌های سیستم
```bash
# به‌روزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب وابستگی‌های مورد نیاز
sudo apt install -y nginx python3 python3-pip python3-venv nodejs npm git postgresql postgresql-contrib ufw certbot python3-certbot-nginx

# فعال‌سازی سرویس‌ها
sudo systemctl enable nginx
sudo systemctl enable postgresql
```

### مرحله 3: تنظیم پایگاه داده PostgreSQL
```bash
# ورود به PostgreSQL
sudo -u postgres psql

# ایجاد پایگاه داده و کاربر
CREATE DATABASE hse_db;
CREATE USER hse_user WITH PASSWORD 'hse_secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE hse_db TO hse_user;
ALTER USER hse_user CREATEDB;
\q
```

### مرحله 4: ایجاد دایرکتوری پروژه
```bash
mkdir -p /home/hseuser/hse-app
cd /home/hseuser/hse-app
```

### مرحله 5: کپی کردن فایل‌های پروژه
از کامپیوتر محلی خود، فایل‌های زیر را به سرور کپی کنید:

```bash
# کپی کردن فایل‌های backend
scp -r backend/ hseuser@85.198.15.148:/home/hseuser/hse-app/

# کپی کردن فایل‌های frontend
scp -r app/ hseuser@85.198.15.148:/home/hseuser/hse-app/
scp -r components/ hseuser@85.198.15.148:/home/hseuser/hse-app/
scp -r contexts/ hseuser@85.198.15.148:/home/hseuser/hse-app/
scp -r hooks/ hseuser@85.198.15.148:/home/hseuser/hse-app/
scp -r lib/ hseuser@85.198.15.148:/home/hseuser/hse-app/
scp -r types/ hseuser@85.198.15.148:/home/hseuser/hse-app/
scp -r public/ hseuser@85.198.15.148:/home/hseuser/hse-app/
scp package.json hseuser@85.198.15.148:/home/hseuser/hse-app/
scp package-lock.json hseuser@85.198.15.148:/home/hseuser/hse-app/
scp next.config.js hseuser@85.198.15.148:/home/hseuser/hse-app/
scp tailwind.config.js hseuser@85.198.15.148:/home/hseuser/hse-app/
scp postcss.config.js hseuser@85.198.15.148:/home/hseuser/hse-app/
scp tsconfig.json hseuser@85.198.15.148:/home/hseuser/hse-app/
```

### مرحله 6: تنظیم محیط Python
```bash
cd /home/hseuser/hse-app
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### مرحله 7: تنظیم محیط Node.js
```bash
cd /home/hseuser/hse-app
npm install
npm run build
```

### مرحله 8: ایجاد فایل تنظیمات محیط
```bash
cd /home/hseuser/hse-app
cat > .env << 'EOF'
DEBUG=False
SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
ALLOWED_HOSTS=85.198.15.148,localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=https://85.198.15.148,http://85.198.15.148
CORS_ALLOWED_ORIGINS=https://85.198.15.148,http://85.198.15.148
DATABASE_URL=postgresql://hse_user:hse_secure_password_2024@localhost:5432/hse_db
EOF
```

### مرحله 9: اجرای migration های Django
```bash
cd /home/hseuser/hse-app
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput

# ایجاد کاربر ادمین
echo 'from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser("admin", "admin@hse.local", "admin123")' | python manage.py shell
```

### مرحله 10: ایجاد سرویس systemd برای Django
```bash
sudo tee /etc/systemd/system/hse-backend.service > /dev/null << 'EOF'
[Unit]
Description=HSE Django Backend
After=network.target

[Service]
Type=exec
User=hseuser
Group=hseuser
WorkingDirectory=/home/hseuser/hse-app
Environment=PATH=/home/hseuser/hse-app/venv/bin
ExecStart=/home/hseuser/hse-app/venv/bin/gunicorn --bind 127.0.0.1:8000 config.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable hse-backend
sudo systemctl start hse-backend
```

### مرحله 11: ایجاد سرویس systemd برای Next.js
```bash
sudo tee /etc/systemd/system/hse-frontend.service > /dev/null << 'EOF'
[Unit]
Description=HSE Next.js Frontend
After=network.target

[Service]
Type=exec
User=hseuser
Group=hseuser
WorkingDirectory=/home/hseuser/hse-app
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable hse-frontend
sudo systemctl start hse-frontend
```

### مرحله 12: تنظیم Nginx
```bash
sudo tee /etc/nginx/sites-available/hse-app > /dev/null << 'EOF'
server {
    listen 80;
    server_name 85.198.15.148;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (Django)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /home/hseuser/hse-app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /home/hseuser/hse-app/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/hse-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### مرحله 13: تنظیم فایروال
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## تست کردن دیپلوی

### بررسی وضعیت سرویس‌ها
```bash
# بررسی وضعیت backend
sudo systemctl status hse-backend

# بررسی وضعیت frontend
sudo systemctl status hse-frontend

# بررسی وضعیت nginx
sudo systemctl status nginx
```

### مشاهده لاگ‌ها
```bash
# لاگ‌های backend
sudo journalctl -u hse-backend -f

# لاگ‌های frontend
sudo journalctl -u hse-frontend -f

# لاگ‌های nginx
sudo tail -f /var/log/nginx/error.log
```

## دسترسی به اپلیکیشن

- **Frontend**: http://85.198.15.148
- **Backend API**: http://85.198.15.148/api/
- **Django Admin**: http://85.198.15.148/admin/

### اطلاعات ورود ادمین
- **Username**: admin
- **Password**: admin123

## مراحل بعدی

### 1. تنظیم SSL Certificate
```bash
sudo certbot --nginx -d 85.198.15.148
```

### 2. تغییر رمز عبور ادمین
1. وارد پنل ادمین شوید: http://85.198.15.148/admin/
2. روی "Users" کلیک کنید
3. کاربر "admin" را ویرایش کنید
4. رمز عبور جدید را تنظیم کنید

### 3. تنظیم دامنه (اختیاری)
اگر دامنه دارید، مراحل زیر را انجام دهید:
1. DNS دامنه خود را به IP سرور (85.198.15.148) اشاره دهید
2. فایل Nginx را ویرایش کنید و دامنه را اضافه کنید
3. SSL certificate را برای دامنه جدید دریافت کنید

## دستورات مفید

### راه‌اندازی مجدد سرویس‌ها
```bash
sudo systemctl restart hse-backend hse-frontend nginx
```

### به‌روزرسانی کد
```bash
cd /home/hseuser/hse-app
git pull  # اگر از git استفاده می‌کنید
# یا کپی کردن فایل‌های جدید
npm run build  # برای frontend
sudo systemctl restart hse-frontend
```

### پشتیبان‌گیری از پایگاه داده
```bash
pg_dump -h localhost -U hse_user hse_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

## عیب‌یابی

### مشکلات رایج
1. **سرویس شروع نمی‌شود**: لاگ‌ها را بررسی کنید
2. **خطای 502**: بررسی کنید که Django و Next.js در حال اجرا هستند
3. **خطای 404**: مسیرهای Nginx را بررسی کنید
4. **مشکل پایگاه داده**: اتصال PostgreSQL را بررسی کنید

### بررسی پورت‌ها
```bash
sudo netstat -tlnp | grep :3000  # Next.js
sudo netstat -tlnp | grep :8000  # Django
sudo netstat -tlnp | grep :80    # Nginx
```


