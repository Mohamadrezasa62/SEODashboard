from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, TokenRefreshView,
    VerifyEmailView, RequestPasswordResetView, ConfirmPasswordResetView,
    ResendVerificationView, GoogleLoginView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    # path('create/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='auth-resend-verification'),
    path('password-reset/', RequestPasswordResetView.as_view(), name='auth-password-reset-request'),
    path('password-reset/confirm/', ConfirmPasswordResetView.as_view(), name='auth-password-reset-confirm'),
    path('google/', GoogleLoginView.as_view(), name='auth-google'),
]