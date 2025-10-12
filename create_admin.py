import os
import sys
import django

# اضافه کردن مسیر backend به sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from django.contrib.auth.models import User as DjangoUser

# ایجاد کاربر ادمین جدید
username = 'admin_user'
password = 'Admin123!'
display_name = 'مدیر سیستم'

try:
    # بررسی وجود کاربر
    if User.objects.filter(username=username).exists():
        print(f'کاربر {username} قبلاً وجود دارد')
        user = User.objects.get(username=username)
        django_user = DjangoUser.objects.get(username=username)
    else:
        # ایجاد کاربر جدید
        django_user = DjangoUser.objects.create_user(
            username=username,
            password=password,
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        
        user = User.objects.create(
            username=username,
            display_name=display_name,
            django_user=django_user
        )
        print(f'کاربر ادمین {username} ایجاد شد')
    
    print('=== اطلاعات کاربر ادمین ===')
    print(f'نام کاربری: {user.username}')
    print(f'نام نمایشی: {user.display_name}')
    print(f'is_superuser: {django_user.is_superuser}')
    print(f'is_staff: {django_user.is_staff}')
    print(f'is_active: {django_user.is_active}')
    print(f'رمز عبور: {password}')
    
except Exception as e:
    print(f'خطا: {e}')
