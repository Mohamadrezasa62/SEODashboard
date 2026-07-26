from django.utils import timezone
from .models import Notification, NotificationSetting
from apps.users.models import User


class NotificationRepository:
    @staticmethod
    def create(recipient, sender, notification_type, title, body, action_url=None, metadata=None):
        return Notification.objects.create(
            recipient=recipient,
            sender=sender,
            notification_type=notification_type,
            title=title,
            body=body,
            action_url=action_url,
            metadata=metadata or {},
        )

    @staticmethod
    def get_user_notifications(user, unread_only=False, limit=50):
        qs = Notification.objects.filter(recipient=user).order_by('-created_at')
        if unread_only:
            qs = qs.filter(is_read=False)
        return qs[:limit]

    @staticmethod
    def get_unread_count(user):
        return Notification.objects.filter(recipient=user, is_read=False).count()

    @staticmethod
    def mark_read(notification_id, user):
        Notification.objects.filter(
            id=notification_id, recipient=user
        ).update(is_read=True, read_at=timezone.now())

    @staticmethod
    def mark_all_read(user):
        Notification.objects.filter(
            recipient=user, is_read=False
        ).update(is_read=True, read_at=timezone.now())

    @staticmethod
    def delete_notification(notification_id, user):
        Notification.objects.filter(id=notification_id, recipient=user).delete()

    @staticmethod
    def get_by_id(notification_id, user):
        try:
            return Notification.objects.get(id=notification_id, recipient=user)
        except Notification.DoesNotExist:
            return None


class NotificationSettingRepository:
    @staticmethod
    def get_or_create(user):
        obj, _ = NotificationSetting.objects.get_or_create(user=user)
        return obj

    @staticmethod
    def update(setting, **kwargs):
        for key, value in kwargs.items():
            setattr(setting, key, value)
        setting.save()
        return setting

    @staticmethod
    def should_notify_email(user, notification_type):
        try:
            setting = NotificationSetting.objects.get(user=user)
            if not setting.email_enabled:
                return False
            type_map = {
                'mention': setting.mention_email,
                'comment': setting.comment_email,
                'kpi_alert': setting.kpi_alert_email,
                'seo_alert': setting.seo_alert_email,
                'report_ready': setting.report_email,
            }
            return type_map.get(notification_type, True)
        except NotificationSetting.DoesNotExist:
            return True

    @staticmethod
    def should_notify_in_app(user, notification_type):
        try:
            setting = NotificationSetting.objects.get(user=user)
            if not setting.in_app_enabled:
                return False
            type_map = {
                'mention': setting.mention_in_app,
                'comment': setting.comment_in_app,
                'kpi_alert': setting.kpi_alert_in_app,
                'seo_alert': setting.seo_alert_in_app,
                'report_ready': setting.report_in_app,
            }
            return type_map.get(notification_type, True)
        except NotificationSetting.DoesNotExist:
            return True