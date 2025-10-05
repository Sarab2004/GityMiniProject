#!/usr/bin/env python
"""
Script to create superuser for Railway deployment
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_superuser():
    username = 'admin'
    email = 'admin@example.com'
    password = 'admin123'
    
    if User.objects.filter(username=username).exists():
        print(f"Superuser '{username}' already exists.")
        # Update password
        user = User.objects.get(username=username)
        user.set_password(password)
        user.save()
        print(f"Password updated for user '{username}'")
    else:
        User.objects.create_superuser(username, email, password)
        print(f"Superuser '{username}' created successfully.")
    
    print("✅ Superuser setup completed!")

if __name__ == '__main__':
    create_superuser()
