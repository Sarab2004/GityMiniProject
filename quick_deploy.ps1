# PowerShell script for quick deployment to VPS
# Run this from your local Windows machine

param(
    [string]$ServerIP = "85.198.15.148",
    [string]$Username = "hseuser"
)

Write-Host "🚀 Starting HSE Application Deployment to VPS..." -ForegroundColor Green
Write-Host "Server: $ServerIP" -ForegroundColor Yellow
Write-Host "User: $Username" -ForegroundColor Yellow

# Function to run SSH commands
function Invoke-SSHCommand {
    param([string]$Command)
    ssh $Username@$ServerIP $Command
}

# Function to copy files via SCP
function Copy-ToServer {
    param([string]$LocalPath, [string]$RemotePath)
    scp -r $LocalPath $Username@$ServerIP`:$RemotePath
}

Write-Host "📋 Step 1: Copying application files..." -ForegroundColor Cyan

# Copy backend files
Write-Host "Copying backend files..."
Copy-ToServer "backend/" "/home/$Username/hse-app/"

# Copy frontend files
Write-Host "Copying frontend files..."
Copy-ToServer "app/" "/home/$Username/hse-app/"
Copy-ToServer "components/" "/home/$Username/hse-app/"
Copy-ToServer "contexts/" "/home/$Username/hse-app/"
Copy-ToServer "hooks/" "/home/$Username/hse-app/"
Copy-ToServer "lib/" "/home/$Username/hse-app/"
Copy-ToServer "types/" "/home/$Username/hse-app/"
Copy-ToServer "public/" "/home/$Username/hse-app/"

# Copy configuration files
Write-Host "Copying configuration files..."
Copy-ToServer "package.json" "/home/$Username/hse-app/"
Copy-ToServer "package-lock.json" "/home/$Username/hse-app/"
Copy-ToServer "next.config.js" "/home/$Username/hse-app/"
Copy-ToServer "tailwind.config.js" "/home/$Username/hse-app/"
Copy-ToServer "postcss.config.js" "/home/$Username/hse-app/"
Copy-ToServer "tsconfig.json" "/home/$Username/hse-app/"

Write-Host "📋 Step 2: Setting up environment on server..." -ForegroundColor Cyan

# Setup Python environment and install dependencies
Invoke-SSHCommand "cd /home/$Username/hse-app && python3 -m venv venv && source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt"

# Setup Node.js environment
Invoke-SSHCommand "cd /home/$Username/hse-app && npm install && npm run build"

# Create environment file
Invoke-SSHCommand @"
cd /home/$Username/hse-app
cat > .env << 'EOF'
DEBUG=False
SECRET_KEY=`$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
ALLOWED_HOSTS=$ServerIP,localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=https://$ServerIP,http://$ServerIP
CORS_ALLOWED_ORIGINS=https://$ServerIP,http://$ServerIP
DATABASE_URL=postgresql://hse_user:hse_secure_password_2024@localhost:5432/hse_db
EOF
"@

Write-Host "📋 Step 3: Running Django setup..." -ForegroundColor Cyan

# Run Django migrations and create superuser
Invoke-SSHCommand @"
cd /home/$Username/hse-app
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
echo 'from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username=\"admin\").delete(); User.objects.create_superuser(\"admin\", \"admin@hse.local\", \"admin123\")' | python manage.py shell
"@

Write-Host "📋 Step 4: Restarting services..." -ForegroundColor Cyan

# Restart services
Invoke-SSHCommand "sudo systemctl restart hse-backend hse-frontend nginx"

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your application is now available at:" -ForegroundColor Green
Write-Host "Frontend: http://$ServerIP" -ForegroundColor White
Write-Host "Backend API: http://$ServerIP/api/" -ForegroundColor White
Write-Host "Django Admin: http://$ServerIP/admin/" -ForegroundColor White
Write-Host ""
Write-Host "👤 Admin credentials:" -ForegroundColor Green
Write-Host "Username: admin" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Yellow
Write-Host "Check status: ssh $Username@$ServerIP 'sudo systemctl status hse-backend hse-frontend'" -ForegroundColor Gray
Write-Host "View logs: ssh $Username@$ServerIP 'sudo journalctl -u hse-backend -f'" -ForegroundColor Gray


