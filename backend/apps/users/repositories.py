from django.utils import timezone
from .models import User, UserProfile, UserActivityLog, EmailVerificationToken, PasswordResetToken


class UserRepository:
    @staticmethod
    def get_by_id(user_id):
        try:
            return User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return None

    @staticmethod
    def get_by_email(email):
        try:
            return User.objects.get(email=email.lower())
        except User.DoesNotExist:
            return None

    @staticmethod
    def get_active_by_email(email):
        try:
            return User.objects.get(email=email.lower(), is_active=True)
        except User.DoesNotExist:
            return None

    @staticmethod
    def create_user(email, password, first_name, last_name, role='employee'):
        return User.objects.create_user(
            email=email.lower(),
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
        )

    @staticmethod
    def get_all_active():
        return User.objects.filter(is_active=True).order_by('-created_at')

    @staticmethod
    def update_last_login(user, ip_address=None):
        user.last_login = timezone.now()
        if ip_address:
            user.last_login_ip = ip_address
        user.save(update_fields=['last_login', 'last_login_ip'])

    @staticmethod
    def soft_delete(user):
        user.is_active = False
        user.deleted_at = timezone.now()
        user.save(update_fields=['is_active', 'deleted_at'])


class UserProfileRepository:
    @staticmethod
    def get_or_create(user):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile

    @staticmethod
    def update(profile, **kwargs):
        for key, value in kwargs.items():
            setattr(profile, key, value)
        profile.save()
        return profile


class EmailVerificationRepository:
    @staticmethod
    def create(user, token, expires_at):
        return EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at,
        )

    @staticmethod
    def get_valid_token(token):
        try:
            return EmailVerificationToken.objects.get(
                token=token,
                is_used=False,
                expires_at__gt=timezone.now(),
            )
        except EmailVerificationToken.DoesNotExist:
            return None

    @staticmethod
    def mark_used(token_obj):
        token_obj.is_used = True
        token_obj.save(update_fields=['is_used'])


class PasswordResetRepository:
    @staticmethod
    def create(user, token, expires_at):
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
        return PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at,
        )

    @staticmethod
    def get_valid_token(token):
        try:
            return PasswordResetToken.objects.get(
                token=token,
                is_used=False,
                expires_at__gt=timezone.now(),
            )
        except PasswordResetToken.DoesNotExist:
            return None

    @staticmethod
    def mark_used(token_obj):
        token_obj.is_used = True
        token_obj.save(update_fields=['is_used'])


class ActivityLogRepository:
    @staticmethod
    def log(user, action, description=None, ip_address=None, user_agent=None, metadata=None):
        return UserActivityLog.objects.create(
            user=user,
            action=action,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata or {},
        )

    @staticmethod
    def get_user_logs(user, limit=50):
        return UserActivityLog.objects.filter(user=user).order_by('-created_at')[:limit]