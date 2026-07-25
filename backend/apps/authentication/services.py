from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.exceptions import ServiceException, NotFoundException, ConflictException
from apps.core.utils import generate_unique_token, get_client_ip, get_user_agent
from apps.users.repositories import (
    UserRepository, EmailVerificationRepository,
    PasswordResetRepository, ActivityLogRepository,
)
from apps.users.tasks import send_verification_email_task, send_password_reset_email_task


class AuthService:
    VERIFICATION_TOKEN_EXPIRY_HOURS = 24
    PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1

    def register(self, email, password, first_name, last_name, request=None):
        if UserRepository.get_by_email(email):
            raise ConflictException('An account with this email already exists.')

        user = UserRepository.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='employee',
        )

        self._send_verification_email(user, request)

        ActivityLogRepository.log(
            user=user,
            action='register',
            ip_address=get_client_ip(request) if request else None,
            user_agent=get_user_agent(request) if request else None,
        )

        return user

    def login(self, email, password, request=None):
        user = UserRepository.get_active_by_email(email)
        if not user or not user.check_password(password):
            raise ServiceException('Invalid email or password.')

        if not user.is_verified:
            raise ServiceException('Please verify your email before logging in.')

        tokens = self._generate_tokens(user)

        ip_address = get_client_ip(request) if request else None
        UserRepository.update_last_login(user, ip_address)

        ActivityLogRepository.log(
            user=user,
            action='login',
            ip_address=ip_address,
            user_agent=get_user_agent(request) if request else None,
        )

        return user, tokens

    def logout(self, refresh_token, user, request=None):
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            raise ServiceException('Invalid or expired refresh token.')

        ActivityLogRepository.log(
            user=user,
            action='logout',
            ip_address=get_client_ip(request) if request else None,
        )

    def refresh_token(self, refresh_token_str):
        try:
            refresh = RefreshToken(refresh_token_str)
            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        except Exception:
            raise ServiceException('Invalid or expired refresh token.')

    def verify_email(self, token):
        token_obj = EmailVerificationRepository.get_valid_token(token)
        if not token_obj:
            raise ServiceException('Invalid or expired verification token.')

        user = token_obj.user
        user.is_verified = True
        user.save(update_fields=['is_verified'])

        EmailVerificationRepository.mark_used(token_obj)

        ActivityLogRepository.log(user=user, action='email_verified')
        return user

    def request_password_reset(self, email, request=None):
        user = UserRepository.get_active_by_email(email)
        if not user:
            return

        token = generate_unique_token()
        expires_at = timezone.now() + timedelta(hours=self.PASSWORD_RESET_TOKEN_EXPIRY_HOURS)
        PasswordResetRepository.create(user=user, token=token, expires_at=expires_at)

        reset_url = self._build_reset_url(token, request)
        send_password_reset_email_task.delay(user.email, user.full_name, reset_url)

    def confirm_password_reset(self, token, new_password):
        token_obj = PasswordResetRepository.get_valid_token(token)
        if not token_obj:
            raise ServiceException('Invalid or expired password reset token.')

        user = token_obj.user
        user.set_password(new_password)
        user.save(update_fields=['password'])

        PasswordResetRepository.mark_used(token_obj)
        ActivityLogRepository.log(user=user, action='password_reset')
        return user

    def resend_verification(self, email, request=None):
        user = UserRepository.get_by_email(email)
        if not user:
            return
        if user.is_verified:
            raise ServiceException('This account is already verified.')
        self._send_verification_email(user, request)

    def _generate_tokens(self, user):
        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['email'] = user.email
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }

    def _send_verification_email(self, user, request=None):
        token = generate_unique_token()
        expires_at = timezone.now() + timedelta(hours=self.VERIFICATION_TOKEN_EXPIRY_HOURS)
        EmailVerificationRepository.create(user=user, token=token, expires_at=expires_at)
        verification_url = self._build_verification_url(token, request)
        send_verification_email_task.delay(user.email, user.full_name, verification_url)

    def _build_verification_url(self, token, request=None):
        from django.conf import settings
        base = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        return f'{base}/verify-email?token={token}'

    def _build_reset_url(self, token, request=None):
        from django.conf import settings
        base = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        return f'{base}/reset-password?token={token}'


class GoogleAuthService:
    def authenticate_or_create(self, google_user_data, request=None):
        email = google_user_data.get('email', '').lower()
        first_name = google_user_data.get('given_name', '')
        last_name = google_user_data.get('family_name', '')

        user = UserRepository.get_by_email(email)
        if not user:
            user = UserRepository.create_user(
                email=email,
                password=None,
                first_name=first_name,
                last_name=last_name,
                role='employee',
            )
            user.is_verified = True
            user.save(update_fields=['is_verified'])
            ActivityLogRepository.log(user=user, action='google_register')
        else:
            ActivityLogRepository.log(user=user, action='google_login')

        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['email'] = user.email

        return user, {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }