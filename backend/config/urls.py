from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

def health_check(request):
    return JsonResponse({
        "status": "ok",
        "message": "HSE System Backend is running",
        "version": "1.0.0",
        "endpoints": {
            "admin": "/admin/",
            "api_docs": "/api/v1/docs/",
            "api_schema": "/api/v1/schema/",
            "auth": "/api/v1/auth/",
            "hse": "/api/v1/",
            "csrf": "/api/v1/csrf/"
        }
    })

@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({
        "csrfToken": get_token(request)
    })

urlpatterns = [
    path("", health_check, name="health_check"),
    path("admin/", admin.site.urls),
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/v1/csrf/", csrf_token_view, name="csrf_token"),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/", include("hse.urls")),
]
