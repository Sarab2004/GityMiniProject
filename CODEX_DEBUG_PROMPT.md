# Codex Debug Prompt - Complete HSE System Fix

## Problem Summary
I have a Django REST API backend deployed on Railway and a Next.js frontend on Netlify. The system works locally but has multiple issues in production:

1. **500 Internal Server Error** on form submissions
2. **CSRF token issues** 
3. **Authentication problems**
4. **CORS/CSRF configuration issues**
5. **Database connection issues**
6. **Static files serving problems**

## Current System Architecture

### Backend (Django on Railway)
- **URL**: https://gityminiproject-production.up.railway.app/
- **Database**: PostgreSQL on Railway
- **Authentication**: Session-based with CSRF
- **CORS**: Configured for Netlify frontend

### Frontend (Next.js on Netlify)
- **URL**: https://phenomenal-lebkuchen-289df9.netlify.app
- **API Base**: https://gityminiproject-production.up.railway.app/api/v1/

## Current Error Details

### Console Errors:
```
gityminiproject-production.up.railway.app/api/v1/actions/:1 Failed to load resource: the server responded with a status of 500 ()
submit action error Error: خطای ناشناخته
```

### Previous Issues Fixed:
- ✅ 400 Bad Request (ALLOWED_HOSTS)
- ✅ 403 Forbidden (permissions changed to AllowAny)
- ✅ CSRF token length issues
- ✅ CORS configuration

## Current Configuration

### Railway Environment Variables:
```
ALLOWED_HOSTS=.railway.app,gityminiproject-production.up.railway.app,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app
CSRF_TRUSTED_ORIGINS=https://gityminiproject-production.up.railway.app,https://phenomenal-lebkuchen-289df9.netlify.app
DEBUG=False
SECRET_KEY=g#apo#8mgplb&d55i3f&m)!77&g#vl7gh7gekkrs01gwbogvx2
```

### Django Settings (backend/config/settings.py):
```python
# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = _csv("CORS_ALLOWED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = _csv("CSRF_TRUSTED_ORIGINS", "")

# Session and CSRF cookies
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_NAME = "csrftoken"
CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework.authentication.SessionAuthentication"],
}

# Proxy settings
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
```

### All ViewSets Currently Set to AllowAny:
- ActionFormViewSet
- RiskRecordViewSet  
- SafetyTeamViewSet
- ActionTrackingViewSet
- ChangeLogViewSet
- ToolboxMeetingViewSet
- ProjectViewSet
- ContractorViewSet
- OrgUnitViewSet
- SectionViewSet
- PersonViewSet
- ArchiveViewSet

## Request for Codex

Please provide a comprehensive solution to fix ALL remaining issues:

### 1. **500 Internal Server Error Investigation**
- Check Django logs for specific error details
- Verify database connections and migrations
- Ensure all required packages are installed
- Check for missing environment variables

### 2. **Complete CORS/CSRF Fix**
- Ensure proper CORS headers for all requests
- Fix CSRF token handling for cross-site requests
- Verify cookie settings work with Railway + Netlify

### 3. **Database and Static Files**
- Ensure PostgreSQL connection works
- Fix static files serving on Railway
- Verify migrations are applied correctly

### 4. **Authentication Flow**
- Ensure login/logout works properly
- Fix session management across domains
- Verify user authentication state

### 5. **API Endpoints Verification**
- Test all CRUD operations work
- Ensure form submissions succeed
- Verify archive functionality works

### 6. **Production Environment Setup**
- Complete Railway configuration
- Ensure all environment variables are set
- Verify deployment process

## Expected Outcome
After applying your solution:
- ✅ All forms should submit successfully (no 500 errors)
- ✅ Login/logout should work properly
- ✅ All CRUD operations should work
- ✅ Archive should load and function
- ✅ System should work exactly like local development
- ✅ No CORS/CSRF errors
- ✅ No authentication issues

## Files to Focus On
- `backend/config/settings.py` - Main configuration
- `backend/config/urls.py` - URL routing
- `backend/hse/views/` - All API endpoints
- `backend/accounts/views.py` - Authentication
- `backend/railway.json` - Railway deployment config
- `backend/Procfile` - Railway startup commands

Please provide a complete, tested solution that addresses all these issues systematically.
