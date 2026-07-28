from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.core.mixins import ResponseMixin
from .serializers import (
    LoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    VerifyEmailSerializer,
)
from .services import UserService

class LoginView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = UserService()
        user = service.authenticate(
            serializer.validated_data["email"],
            serializer.validated_data["password"],
            request,
        )

        refresh = RefreshToken.for_user(user)

        return self.success_response(
            data={
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            message="Login successful.",
        )

class LogoutView(ResponseMixin, APIView):

    def post(self, request):
        refresh_token = request.data.get("refresh")

        token = RefreshToken(refresh_token)
        token.blacklist()

        return self.success_response(
            message="Logout successful."
        )



class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]



class VerifyEmailView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        UserService().verify_email(
            serializer.validated_data["token"]
        )

        return self.success_response(
            message="Email verified successfully."
        )


class ResendVerificationView(ResponseMixin, APIView):

    def post(self, request):
        UserService().send_verification_email(request.user)

        return self.success_response(
            message="Verification email sent."
        )

class ForgotPasswordView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        UserService().forgot_password(
            serializer.validated_data["email"]
        )

        return self.success_response(
            message="Password reset email sent."
        )


class ResetPasswordView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        UserService().reset_password(
            serializer.validated_data["token"],
            serializer.validated_data["password"],
        )

        return self.success_response(
            message="Password reset successfully."
        )