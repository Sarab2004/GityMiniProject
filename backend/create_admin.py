import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import UserProfile
from django.contrib.auth.models import User as DjangoUser

# ایجاد کاربر ادمین جدید
username = 'admin_user'
password = 'Admin123!'
display_name = 'System Admin'

try:
    # بررسی وجود کاربر
    if DjangoUser.objects.filter(username=username).exists():
        print(f'User {username} already exists')
        django_user = DjangoUser.objects.get(username=username)
        user_profile = django_user.profile
    else:
        # ایجاد کاربر جدید
        django_user = DjangoUser.objects.create_user(
            username=username,
            password=password,
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        
        user_profile = UserProfile.objects.create(
            user=django_user,
            display_name=display_name
        )
        print(f'Admin user {username} created successfully')
    
    print('=== Admin User Information ===')
    print(f'Username: {django_user.username}')
    print(f'Display Name: {user_profile.display_name}')
    print(f'is_superuser: {django_user.is_superuser}')
    print(f'is_staff: {django_user.is_staff}')
    print(f'is_active: {django_user.is_active}')
    print(f'Password: {password}')
    
except Exception as e:
    print(f'Error: {e}')
