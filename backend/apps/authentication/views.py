from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from django.conf import settings

from apps.core.mixins import ResponseMixin
from apps.users.serializers import UserSerializer
from .serializers import (
    RegisterSerializer, LoginSerializer, LogoutSerializer,
    VerifyEmailSerializer, RequestPasswordResetSerializer,
    ConfirmPasswordResetSerializer, ResendVerificationSerializer,
    TokenRefreshSerializer, GoogleCallbackSerializer,
)
from .services import AuthService, GoogleAuthService


class RegisterView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = AuthService()
        user = service.register(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            request=request,
        )
        return self.success_response(
            data=UserSerializer(user).data,
            message='Registration successful. Please check your email to verify your account.',
            status_code=status.HTTP_201_CREATED,
        )


class LoginView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        user, tokens = service.login(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
            request=request,
        )
        return self.success_response(data={
            'user': UserSerializer(user).data,
            'tokens': tokens,
        })


class LogoutView(ResponseMixin, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        service.logout(
            refresh_token=serializer.validated_data['refresh'],
            user=request.user,
            request=request,
        )
        return self.success_response(message='Logged out successfully.')


class TokenRefreshView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        tokens = service.refresh_token(serializer.validated_data['refresh'])
        return self.success_response(data=tokens)


class VerifyEmailView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        service.verify_email(serializer.validated_data['token'])
        return self.success_response(message='Email verified successfully.')


class RequestPasswordResetView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        service.request_password_reset(
            email=serializer.validated_data['email'],
            request=request,
        )
        return self.success_response(
            message='If this email exists, a password reset link has been sent.'
        )


class ConfirmPasswordResetView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConfirmPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        service.confirm_password_reset(
            token=serializer.validated_data['token'],
            new_password=serializer.validated_data['new_password'],
        )
        return self.success_response(message='Password reset successfully.')


class ResendVerificationView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AuthService()
        service.resend_verification(
            email=serializer.validated_data['email'],
            request=request,
        )
        return self.success_response(
            message='If this email exists and is unverified, a new verification email has been sent.'
        )


class GoogleLoginView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            id_info = google_id_token.verify_oauth2_token(
                serializer.validated_data['code'],
                google_requests.Request(),
                settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,
            )
        except ValueError as e:
            return self.error_response(
                message='Invalid Google token.',
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        service = GoogleAuthService()
        user, tokens = service.authenticate_or_create(id_info, request)
        return self.success_response(data={
            'user': UserSerializer(user).data,
            'tokens': tokens,
        })