"""
Django settings for config project.
"""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
)

env_file = BASE_DIR / ".env"
if env_file.exists():
    environ.Env.read_env(env_file)

SECRET_KEY = env("SECRET_KEY", default="django-insecure-change-me")
DEBUG = env.bool("DEBUG", default=False)


# Helper functions for environment-driven configuration

def _csv(name: str, default: str = ""):
    return [x.strip() for x in env(name, default=default).split(",") if x.strip()]


def _unique(sequence):
    seen = set()
    ordered = []
    for item in sequence:
        if item and item not in seen:
            seen.add(item)
            ordered.append(item)
    return ordered


ALLOWED_HOSTS = _unique(_csv("ALLOWED_HOSTS", "")) or ["*"]
CSRF_TRUSTED_ORIGINS = _csv("CSRF_TRUSTED_ORIGINS", "")
CORS_ALLOWED_ORIGINS = _csv("CORS_ALLOWED_ORIGINS", "")

DEFAULT_CLIENT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if DEBUG:
    CORS_ALLOWED_ORIGINS = _unique(CORS_ALLOWED_ORIGINS + DEFAULT_CLIENT_ORIGINS)
    CSRF_TRUSTED_ORIGINS = _unique(CSRF_TRUSTED_ORIGINS + DEFAULT_CLIENT_ORIGINS)
else:
    CORS_ALLOWED_ORIGINS = _unique(CORS_ALLOWED_ORIGINS)
    CSRF_TRUSTED_ORIGINS = _unique(CSRF_TRUSTED_ORIGINS)

backend_trusted_origins = []
for host in ALLOWED_HOSTS:
    cleaned = host.strip()
    if cleaned in {"", "*"} or cleaned.startswith(".") or "*" in cleaned:
        continue
    if cleaned.startswith("http://") or cleaned.startswith("https://"):
        backend_trusted_origins.append(cleaned)
        continue
    backend_trusted_origins.append(f"https://{cleaned}")
    if DEBUG:
        backend_trusted_origins.append(f"http://{cleaned}")

CSRF_TRUSTED_ORIGINS = _unique(CSRF_TRUSTED_ORIGINS + backend_trusted_origins)

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_PREFLIGHT_MAX_AGE = 86400

SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_NAME = "csrftoken"
CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"
# Honor proxy headers when running behind Railway's load balancer
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "django_filters",
    "drf_spectacular",
    "accounts",
    "common",
    "hse",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": env.db(default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "fa"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "HSE API",
    "DESCRIPTION": "API برای فرم‌های ایمنی و بهداشت",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

LOCALE_PATHS = [BASE_DIR / "locale"]
