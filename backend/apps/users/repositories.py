from django.db import DatabaseError
from django.utils import timezone

from .models import (
    User,
    UserProfile,
    UserActivityLog,
    EmailVerificationToken,
    PasswordResetToken,
)


class UserRepository:
    @staticmethod
    def get_by_id(user_id):
        try:
            return User.objects.get(
                id=user_id,
                is_active=True,
                deleted_at__isnull=True,
            )
        except User.DoesNotExist:
            return None
        except DatabaseError:
            return None

    @staticmethod
    def get_by_email(email):
        try:
            return User.objects.get(
                email=email.lower(),
                deleted_at__isnull=True,
            )
        except User.DoesNotExist:
            return None
        except DatabaseError:
            return None

    @staticmethod
    def get_active_by_email(email):
        try:
            return User.objects.get(
                email=email.lower(),
                is_active=True,
                deleted_at__isnull=True,
            )
        except User.DoesNotExist:
            return None
        except DatabaseError:
            return None

    @staticmethod
    def create_user(email, password, first_name, last_name, role="employee"):
        try:
            return User.objects.create_user(
                email=email.lower(),
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=role,
            )
        except DatabaseError:
            raise

    @staticmethod
    def get_all_active():
        try:
            return User.objects.filter(
                is_active=True,
                deleted_at__isnull=True,
            ).order_by("-created_at")
        except DatabaseError:
            return User.objects.none()

    @staticmethod
    def update_last_login(user, ip_address=None):
        try:
            user.last_login = timezone.now()

            if ip_address:
                user.last_login_ip = ip_address
                user.save(update_fields=["last_login", "last_login_ip"])
            else:
                user.save(update_fields=["last_login"])

            return user

        except DatabaseError:
            return None

    @staticmethod
    def soft_delete(user):
        try:
            user.is_active = False
            user.deleted_at = timezone.now()
            user.save(update_fields=["is_active", "deleted_at"])
            return user
        except DatabaseError:
            return None


class UserProfileRepository:
    @staticmethod
    def get_or_create(user):
        try:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            return profile
        except DatabaseError:
            return None

    @staticmethod
    def update(profile, **kwargs):
        try:
            update_fields = []

            for key, value in kwargs.items():
                setattr(profile, key, value)
                update_fields.append(key)

            if update_fields:
                profile.save(update_fields=update_fields)

            return profile

        except DatabaseError:
            return None


class EmailVerificationRepository:
    @staticmethod
    def create(user, token, expires_at):
        try:
            EmailVerificationToken.objects.filter(
                user=user,
                is_used=False,
            ).update(is_used=True)

            return EmailVerificationToken.objects.create(
                user=user,
                token=token,
                expires_at=expires_at,
            )

        except DatabaseError:
            raise

    @staticmethod
    def get_valid_token(token):
        try:
            return (
                EmailVerificationToken.objects
                .select_related("user")
                .get(
                    token=token,
                    is_used=False,
                    expires_at__gt=timezone.now(),
                )
            )
        except EmailVerificationToken.DoesNotExist:
            return None
        except DatabaseError:
            return None

    @staticmethod
    def mark_used(token_obj):
        try:
            token_obj.is_used = True
            token_obj.save(update_fields=["is_used"])
            return token_obj
        except DatabaseError:
            return None


class PasswordResetRepository:
    @staticmethod
    def create(user, token, expires_at):
        try:
            PasswordResetToken.objects.filter(
                user=user,
                is_used=False,
            ).update(is_used=True)

            return PasswordResetToken.objects.create(
                user=user,
                token=token,
                expires_at=expires_at,
            )

        except DatabaseError:
            raise

    @staticmethod
    def get_valid_token(token):
        try:
            return (
                PasswordResetToken.objects
                .select_related("user")
                .get(
                    token=token,
                    is_used=False,
                    expires_at__gt=timezone.now(),
                )
            )
        except PasswordResetToken.DoesNotExist:
            return None
        except DatabaseError:
            return None

    @staticmethod
    def mark_used(token_obj):
        try:
            token_obj.is_used = True
            token_obj.save(update_fields=["is_used"])
            return token_obj
        except DatabaseError:
            return None


class ActivityLogRepository:
    @staticmethod
    def log(
        user,
        action,
        description=None,
        ip_address=None,
        user_agent=None,
        metadata=None,
    ):
        try:
            return UserActivityLog.objects.create(
                user=user,
                action=action,
                description=description,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata=metadata or {},
            )
        except DatabaseError:
            return None

    @staticmethod
    def get_user_logs(user, limit=50):
        try:
            return (
                UserActivityLog.objects.filter(user=user)
                .order_by("-created_at")[:limit]
            )
        except DatabaseError:
            return UserActivityLog.objects.none()