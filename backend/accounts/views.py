from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import parsers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AuthUserSerializer, LoginSerializer


class CsrfEnsureMixin:
    @method_decorator(ensure_csrf_cookie)
    def dispatch(self, request, *args, **kwargs):  # type: ignore[override]
        return super().dispatch(request, *args, **kwargs)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.JSONParser, parsers.FormParser, parsers.MultiPartParser]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "نام کاربری یا رمز عبور نادرست است."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        login(request, user)
        return Response({"user": AuthUserSerializer(user).data}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if request.user.is_authenticated:
            logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(CsrfEnsureMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response({"user": AuthUserSerializer(request.user).data})
        return Response(
            {"detail": "ابتدا وارد حساب کاربری شوید."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
