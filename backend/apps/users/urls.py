from django.urls import path
from .views import MeView, ChangePasswordView, UserListView, UserCreateView, UserDetailView
from django.urls import path, include






# apps/users/auth_urls.py

from django.urls import path
from .auth_views import (
    LoginView,
    LogoutView,
    RefreshTokenView,
    VerifyEmailView,
    ResendVerificationView,
    ForgotPasswordView,
    ResetPasswordView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', RefreshTokenView.as_view(), name='token-refresh'),

    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),

    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    
    path('me/', MeView.as_view(), name='user-me'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change-password'),

    path('', UserListView.as_view(), name='user-list'),
    path('create/', UserCreateView.as_view(), name='user-create'),
    path('<uuid:user_id>/', UserDetailView.as_view(), name='user-detail'),
]