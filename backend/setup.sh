#!/bin/bash

# Django Backend Setup Script for Railway
echo "🚀 Setting up Django Backend for Railway..."

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Create superuser (non-interactive)
echo "👤 Creating superuser..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell

# Seed demo data
echo "🌱 Seeding demo data..."
python manage.py seed_demo

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Setup completed successfully!"
echo "🎯 Backend is ready for production!"
