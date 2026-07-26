import logging
from apps.core.exceptions import NotFoundException
from .repositories import NotificationRepository, NotificationSettingRepository
from .tasks import send_email_notification_task

logger = logging.getLogger(__name__)


class NotificationService:
    def create_notification(
        self, recipient, sender, notification_type,
        title, body, action_url=None, metadata=None,
    ):
        if NotificationSettingRepository.should_notify_in_app(recipient, notification_type):
            notification = NotificationRepository.create(
                recipient=recipient,
                sender=sender,
                notification_type=notification_type,
                title=title,
                body=body,
                action_url=action_url,
                metadata=metadata or {},
            )
        else:
            notification = None

        if NotificationSettingRepository.should_notify_email(recipient, notification_type):
            send_email_notification_task.delay(
                recipient_email=recipient.email,
                recipient_name=recipient.full_name,
                title=title,
                body=body,
                action_url=action_url or '',
            )

        return notification

    def get_notifications(self, user, unread_only=False):
        return NotificationRepository.get_user_notifications(user, unread_only)

    def get_unread_count(self, user):
        return NotificationRepository.get_unread_count(user)

    def mark_read(self, notification_id, user):
        NotificationRepository.mark_read(notification_id, user)

    def mark_all_read(self, user):
        NotificationRepository.mark_all_read(user)

    def delete_notification(self, notification_id, user):
        notification = NotificationRepository.get_by_id(notification_id, user)
        if not notification:
            raise NotFoundException('Notification not found.')
        NotificationRepository.delete_notification(notification_id, user)

    def get_settings(self, user):
        return NotificationSettingRepository.get_or_create(user)

    def update_settings(self, user, data):
        setting = NotificationSettingRepository.get_or_create(user)
        return NotificationSettingRepository.update(setting, **data)