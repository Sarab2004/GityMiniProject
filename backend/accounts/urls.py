from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminUserViewSet,
    LoginView,
    LogoutView,
    MeView,
    MePermissionsView,
    MeProfileView,
    OrganizationViewSet,
    RoleCatalogView,
)

router = DefaultRouter()
router.register("admin/users", AdminUserViewSet, basename="admin-users")
router.register("admin/org", OrganizationViewSet, basename="admin-org")

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("me/permissions/", MePermissionsView.as_view(), name="auth-me-permissions"),
    path("me/profile/", MeProfileView.as_view(), name="auth-me-profile"),
    path("admin/roles/", RoleCatalogView.as_view(), name="auth-admin-roles"),
]

urlpatterns += router.urls
