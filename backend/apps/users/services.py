from django.utils import timezone
from datetime import timedelta
from apps.core.exceptions import NotFoundException, ConflictException, ServiceException
from apps.core.utils import generate_unique_token
from .repositories import (
    UserRepository, UserProfileRepository,
    EmailVerificationRepository, ActivityLogRepository,
)
from .tasks import send_verification_email_task


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