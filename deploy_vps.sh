#!/bin/bash

# HSE Application VPS Deployment Script
# Server: 85.198.15.148
# User: hseuser

set -e

echo "🚀 Starting HSE Application Deployment on VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server configuration
SERVER_IP="85.198.15.148"
SERVER_USER="hseuser"
APP_NAME="hse-app"
APP_DIR="/home/$SERVER_USER/$APP_NAME"
DOMAIN="85.198.15.148"  # You can change this to your domain later

echo -e "${GREEN}📋 Deployment Configuration:${NC}"
echo "Server: $SERVER_IP"
echo "User: $SERVER_USER"
echo "App Directory: $APP_DIR"
echo "Domain: $DOMAIN"
echo ""

# Function to run commands on server
run_on_server() {
    ssh $SERVER_USER@$SERVER_IP "$1"
}

# Function to copy files to server
copy_to_server() {
    scp -r "$1" $SERVER_USER@$SERVER_IP:"$2"
}

echo -e "${YELLOW}🔧 Step 1: Setting up server dependencies...${NC}"

# Update system and install dependencies
run_on_server "
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y nginx python3 python3-pip python3-venv nodejs npm git postgresql postgresql-contrib ufw certbot python3-certbot-nginx
    sudo systemctl enable nginx
    sudo systemctl enable postgresql
"

echo -e "${YELLOW}🔧 Step 2: Setting up PostgreSQL database...${NC}"

# Setup PostgreSQL
run_on_server "
    sudo -u postgres psql -c \"CREATE DATABASE hse_db;\"
    sudo -u postgres psql -c \"CREATE USER hse_user WITH PASSWORD 'hse_secure_password_2024';\"
    sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE hse_db TO hse_user;\"
    sudo -u postgres psql -c \"ALTER USER hse_user CREATEDB;\"
"

echo -e "${YELLOW}🔧 Step 3: Creating application directory...${NC}"

# Create app directory
run_on_server "
    mkdir -p $APP_DIR
    cd $APP_DIR
"

echo -e "${YELLOW}🔧 Step 4: Copying application files...${NC}"

# Copy backend files
echo "Copying backend files..."
copy_to_server "backend/" "$APP_DIR/"

# Copy frontend files
echo "Copying frontend files..."
copy_to_server "app/" "$APP_DIR/"
copy_to_server "components/" "$APP_DIR/"
copy_to_server "contexts/" "$APP_DIR/"
copy_to_server "hooks/" "$APP_DIR/"
copy_to_server "lib/" "$APP_DIR/"
copy_to_server "types/" "$APP_DIR/"
copy_to_server "public/" "$APP_DIR/"
copy_to_server "package.json" "$APP_DIR/"
copy_to_server "package-lock.json" "$APP_DIR/"
copy_to_server "next.config.js" "$APP_DIR/"
copy_to_server "tailwind.config.js" "$APP_DIR/"
copy_to_server "postcss.config.js" "$APP_DIR/"
copy_to_server "tsconfig.json" "$APP_DIR/"

echo -e "${YELLOW}🔧 Step 5: Setting up Python virtual environment...${NC}"

# Setup Python environment
run_on_server "
    cd $APP_DIR
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
"

echo -e "${YELLOW}🔧 Step 6: Setting up Node.js environment...${NC}"

# Setup Node.js environment
run_on_server "
    cd $APP_DIR
    npm install
    npm run build
"

echo -e "${YELLOW}🔧 Step 7: Creating environment configuration...${NC}"

# Create production environment file
run_on_server "
    cd $APP_DIR
    cat > .env << 'EOF'
DEBUG=False
SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
ALLOWED_HOSTS=$DOMAIN,localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=https://$DOMAIN,http://$DOMAIN
CORS_ALLOWED_ORIGINS=https://$DOMAIN,http://$DOMAIN
DATABASE_URL=postgresql://hse_user:hse_secure_password_2024@localhost:5432/hse_db
EOF
"

echo -e "${YELLOW}🔧 Step 8: Running Django migrations...${NC}"

# Run Django setup
run_on_server "
    cd $APP_DIR
    source venv/bin/activate
    python manage.py migrate
    python manage.py collectstatic --noinput
    echo 'from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser(\"admin\", \"admin@hse.local\", \"admin123\")' | python manage.py shell
"

echo -e "${YELLOW}🔧 Step 9: Creating systemd service for Django...${NC}"

# Create systemd service for Django
run_on_server "
    sudo tee /etc/systemd/system/hse-backend.service > /dev/null << 'EOF'
[Unit]
Description=HSE Django Backend
After=network.target

[Service]
Type=exec
User=$SERVER_USER
Group=$SERVER_USER
WorkingDirectory=$APP_DIR
Environment=PATH=$APP_DIR/venv/bin
ExecStart=$APP_DIR/venv/bin/gunicorn --bind 127.0.0.1:8000 config.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable hse-backend
    sudo systemctl start hse-backend
"

echo -e "${YELLOW}🔧 Step 10: Creating systemd service for Next.js...${NC}"

# Create systemd service for Next.js
run_on_server "
    sudo tee /etc/systemd/system/hse-frontend.service > /dev/null << 'EOF'
[Unit]
Description=HSE Next.js Frontend
After=network.target

[Service]
Type=exec
User=$SERVER_USER
Group=$SERVER_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable hse-frontend
    sudo systemctl start hse-frontend
"

echo -e "${YELLOW}🔧 Step 11: Configuring Nginx...${NC}"

# Configure Nginx
run_on_server "
    sudo tee /etc/nginx/sites-available/hse-app > /dev/null << 'EOF'
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API (Django)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files
    location /static/ {
        alias $APP_DIR/staticfiles/;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    # Media files
    location /media/ {
        alias $APP_DIR/media/;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/hse-app /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx
"

echo -e "${YELLOW}🔧 Step 12: Configuring firewall...${NC}"

# Configure firewall
run_on_server "
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}🌐 Your application is now available at:${NC}"
echo "Frontend: http://$DOMAIN"
echo "Backend API: http://$DOMAIN/api/"
echo "Django Admin: http://$DOMAIN/admin/"
echo ""
echo -e "${GREEN}👤 Admin credentials:${NC}"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Test your application at http://$DOMAIN"
echo "2. Set up SSL certificate with: sudo certbot --nginx -d $DOMAIN"
echo "3. Change the admin password in Django admin"
echo "4. Configure your domain name if you have one"
echo ""
echo -e "${GREEN}🔧 Useful commands:${NC}"
echo "Check backend status: sudo systemctl status hse-backend"
echo "Check frontend status: sudo systemctl status hse-frontend"
echo "View backend logs: sudo journalctl -u hse-backend -f"
echo "View frontend logs: sudo journalctl -u hse-frontend -f"
echo "Restart services: sudo systemctl restart hse-backend hse-frontend"


