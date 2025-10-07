# 🚀 راهنمای Deploy سریع به VPS

## 📝 فرآیند Deploy (بعد از Push به GitHub)

### گام 1: وصل شدن به VPS
```bash
ssh hseuser@85.198.15.148
# password: 12345678
```

### گام 2: آپدیت کد از GitHub
```bash
cd ~/app/GityMiniProject

# دریافت آخرین تغییرات
git fetch --all

# چک کردن برنچ فعلی
git branch --show-current

# اگر روی main هستی:
git pull origin main

# یا اگر روی برنچ دیگه‌ای مثل fix/frontend-csrf-base:
git pull origin fix/frontend-csrf-base
```

### گام 3: آپدیت Frontend
```bash
cd ~/app/GityMiniProject

# نصب یا آپدیت dependencies (فقط اگر package.json تغییر کرده)
npm ci

# بیلد فرانت
npm run build

# دیپلوی به مسیر nginx
sudo rsync -av --delete out/ /var/www/hse/site/

# reload nginx
sudo systemctl reload nginx
```

### گام 4: آپدیت Backend (اگر لازم باشه)
```bash
cd ~/app/GityMiniProject/backend

# فعال‌سازی virtual environment
source .venv/bin/activate

# آپدیت dependencies (فقط اگر requirements.txt تغییر کرده)
pip install -r requirements.txt

# اجرای migrations (اگر مدل‌ها تغییر کردن)
python manage.py makemigrations
python manage.py migrate

# خروج از venv
deactivate

# ری‌استارت گانیکورن
sudo systemctl restart hse-gunicorn
```

### گام 5: بررسی سلامت
```bash
# وضعیت سرویس‌ها
sudo systemctl status hse-gunicorn --no-pager | head -n 10
sudo systemctl status nginx --no-pager | head -n 10

# تست API
curl -I http://85.198.15.148/api/v1/csrf/

# تست از مرورگر
# باز کن: http://85.198.15.148
```

---

## ⚡ اسکریپت Deploy سریع

برای سریع‌تر کردن، این اسکریپت رو در VPS بساز:

```bash
# در VPS اجرا کن:
cat > ~/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

cd ~/app/GityMiniProject

# Pull latest code
echo "📥 Pulling latest code..."
git fetch --all
git pull origin $(git branch --show-current)

# Check if package.json changed
if git diff HEAD@{1} --name-only | grep -q "package.json"; then
    echo "📦 Installing frontend dependencies..."
    npm ci
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Deploy frontend
echo "📤 Deploying frontend..."
sudo rsync -av --delete out/ /var/www/hse/site/

# Check if requirements.txt changed
if git diff HEAD@{1} --name-only | grep -q "requirements.txt"; then
    echo "📦 Installing backend dependencies..."
    cd backend
    source .venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
fi

# Check if models changed
if git diff HEAD@{1} --name-only | grep -q "backend/hse/models.py"; then
    echo "🗄️  Running migrations..."
    cd backend
    source .venv/bin/activate
    python manage.py makemigrations
    python manage.py migrate
    deactivate
    cd ..
    RESTART_BACKEND=1
fi

# Restart services
echo "🔄 Reloading services..."
sudo systemctl reload nginx

if [ -n "$RESTART_BACKEND" ]; then
    echo "🔄 Restarting backend..."
    sudo systemctl restart hse-gunicorn
fi

# Health check
echo "✅ Deployment complete! Running health checks..."
sleep 2

if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/v1/csrf/ | grep -q "200"; then
    echo "✅ Backend: OK"
else
    echo "❌ Backend: FAILED"
fi

if curl -s -o /dev/null -w "%{http_code}" http://85.198.15.148/ | grep -q "200"; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: FAILED"
fi

echo "🎉 Deployment finished!"
EOF

# اجازه اجرا بده
chmod +x ~/deploy.sh
```

### استفاده از اسکریپت:
```bash
ssh hseuser@85.198.15.148
~/deploy.sh
```

---

## 🎯 سناریوهای مختلف

### فقط تغییرات UI/CSS (بدون تغییر در API)
```bash
ssh hseuser@85.198.15.148
cd ~/app/GityMiniProject
git pull origin main
npm run build
sudo rsync -av --delete out/ /var/www/hse/site/
sudo systemctl reload nginx
```

### فقط تغییرات Backend
```bash
ssh hseuser@85.198.15.148
cd ~/app/GityMiniProject
git pull origin main
sudo systemctl restart hse-gunicorn
```

### تغییرات کامل (Frontend + Backend)
```bash
ssh hseuser@85.198.15.148
~/deploy.sh
```

---

## 🔍 نکات مهم

### 1. همیشه قبل از Deploy:
- ✅ روی local تست کن
- ✅ commit و push کن به GitHub
- ✅ مطمئن شو build بدون error تمام شده

### 2. اگر خطا دیدی:
```bash
# لاگ‌های گانیکورن
sudo journalctl -u hse-gunicorn -n 50 --no-pager

# لاگ‌های nginx
sudo tail -n 50 /var/log/nginx/error.log

# بازگشت به کامیت قبلی
cd ~/app/GityMiniProject
git log --oneline -n 5
git checkout <COMMIT_HASH>
~/deploy.sh
```

### 3. بک‌آپ قبل از تغییرات بزرگ:
```bash
# بک‌آپ دیتابیس
cp ~/app/GityMiniProject/backend/db.sqlite3 ~/backups/db-backup-$(date +%Y%m%d-%H%M%S).sqlite3

# تگ گذاری قبل از deploy
cd ~/app/GityMiniProject
git tag -a "pre-deploy-$(date +%Y%m%d-%H%M%S)" -m "Backup before deploy"
git push origin "pre-deploy-$(date +%Y%m%d-%H%M%S)"
```

---

## 📱 Deploy برای تغییرات Responsive

اگر فقط CSS/استایل عوض کردی:

```bash
ssh hseuser@85.198.15.148 "cd ~/app/GityMiniProject && git pull origin main && npm run build && sudo rsync -av --delete out/ /var/www/hse/site/ && sudo systemctl reload nginx && echo '✅ Responsive changes deployed!'"
```

این دستور همه چیز رو در یک خط انجام میده! 🚀

---

## 🎨 Workflow پیشنهادی

### روی Local (Windows):
1. تغییرات رو انجام بده (مثلاً responsive کردن)
2. تست کن: `npm run dev`
3. Build کن: `npm run build`
4. Commit: `git add . && git commit -m "feat: make UI responsive"`
5. Push: `git push origin main`

### روی VPS:
```bash
ssh hseuser@85.198.15.148
~/deploy.sh
```

### تست نهایی:
- باز کن از مرورگر: http://85.198.15.148
- تست responsive با DevTools موبایل
- چک کن همه چیز کار میکنه ✅

---

**نکته طلایی**: اگر خیلی زیاد deploy میکنی، می‌تونی CI/CD راه‌اندازی کنی (مثل GitHub Actions) که هر بار push کردی، خودکار روی VPS deploy بشه! 🤖

