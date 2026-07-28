from django.utils import timezone
from datetime import timedelta
from apps.core.exceptions import NotFoundException, ConflictException, ServiceException
from apps.core.utils import generate_unique_token
from .repositories import (
    UserRepository, UserProfileRepository,
    EmailVerificationRepository, ActivityLogRepository,
)
from .tasks import send_verification_email_task
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta

from apps.core.exceptions import (
    NotFoundException,
    ConflictException,
    ServiceException,
)
from apps.core.utils import generate_unique_token

from .repositories import (
    UserRepository,
    UserProfileRepository,
    EmailVerificationRepository,
    PasswordResetRepository,
    ActivityLogRepository,
)

from .tasks import (
    send_verification_email_task,
    send_password_reset_email_task,
)

class UserService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.profile_repo = UserProfileRepository()
        self.activity_repo = ActivityLogRepository()

    def get_user_by_id(self, user_id):
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise NotFoundException('User not found.')
        return user

    def update_profile(self, user, data, avatar=None):
        allowed_fields = ('first_name', 'last_name', 'phone', 'bio')
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        if avatar:
            user.avatar = avatar
        user.save()

        profile = UserProfileRepository.get_or_create(user)
        profile_fields = ('timezone', 'language', 'theme', 'notification_email', 'notification_in_app')
        profile_data = {k: data[k] for k in profile_fields if k in data}
        if profile_data:
            UserProfileRepository.update(profile, **profile_data)

        ActivityLogRepository.log(user=user, action='profile_update')
        return user

    def change_password(self, user, old_password, new_password):
        if not user.check_password(old_password):
            raise ServiceException('Current password is incorrect.')
        user.set_password(new_password)
        user.save(update_fields=['password'])
        ActivityLogRepository.log(user=user, action='password_change')

    def deactivate_user(self, user, requesting_user):
        if user == requesting_user:
            raise ServiceException('Cannot deactivate your own account.')
        UserRepository.soft_delete(user)
        ActivityLogRepository.log(
            user=requesting_user,
            action='user_deactivate',
            description=f'Deactivated user {user.email}',
        )

    def list_users(self, role=None, search=None):
        qs = UserRepository.get_all_active()
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(
                email__icontains=search
            ) | qs.filter(
                first_name__icontains=search
            ) | qs.filter(
                last_name__icontains=search
            )
        return qs

    def authenticate(self, email, password, request=None):
        user = authenticate(
            request=request,
            username=email.lower(),
            password=password,
        )

        if not user:
            raise ServiceException("Invalid email or password.")

        if not user.is_active:
            raise ServiceException("This account is inactive.")

        user.last_login_ip = self._get_client_ip(request)
        user.save(update_fields=["last_login_ip"])

        ActivityLogRepository.log(
            user=user,
            action="login",
            ip_address=user.last_login_ip,
        )

        return user

    def verify_email(self, token):
        verification = EmailVerificationRepository.get_valid_token(token)

        if not verification:
            raise ServiceException("Invalid or expired verification token.")

        user = verification.user
        user.is_verified = True
        user.save(update_fields=["is_verified"])

        verification.is_used = True
        verification.save(update_fields=["is_used"])

        ActivityLogRepository.log(
            user=user,
            action="email_verified",
        )

    def send_verification_email(self, user):
        if user.is_verified:
            raise ConflictException("Email is already verified.")

        token = generate_unique_token()

        EmailVerificationRepository.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=24),
        )

        send_verification_email_task.delay(
            user.email,
            token,
        )

    def forgot_password(self, email):
        user = UserRepository.get_by_email(email)

        if not user:
            return

        token = generate_unique_token()

        PasswordResetRepository.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=1),
        )

        send_password_reset_email_task.delay(
            user.email,
            token,
        )

        ActivityLogRepository.log(
            user=user,
            action="password_reset_requested",
        )

    def reset_password(self, token, password):
        reset = PasswordResetRepository.get_valid_token(token)

        if not reset:
            raise ServiceException("Invalid or expired reset token.")

        user = reset.user

        user.set_password(password)
        user.save(update_fields=["password"])

        reset.is_used = True
        reset.save(update_fields=["is_used"])

        ActivityLogRepository.log(
            user=user,
            action="password_reset",
        )

    @staticmethod
    def _get_client_ip(request):
        if request is None:
            return None

        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded:
            return forwarded.split(",")[0].strip()

        return request.META.get("REMOTE_ADDR")