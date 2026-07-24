import uuid
from django.db import models
from apps.core.models import TimeStampedModel
from apps.users.models import User


class Notification(TimeStampedModel):
    TYPE_CHOICES = [
        ('mention', 'Mention'),
        ('comment', 'Comment'),
        ('feedback_status', 'Feedback Status'),
        ('project_invite', 'Project Invite'),
        ('kpi_alert', 'KPI Alert'),
        ('seo_alert', 'SEO Alert'),
        ('system', 'System'),
        ('report_ready', 'Report Ready'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications'
    )
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, db_index=True)
    title = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    action_url = models.CharField(max_length=500, null=True, blank=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'notification_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.notification_type} → {self.recipient.email}'


class NotificationSetting(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    email_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    mention_email = models.BooleanField(default=True)
    mention_in_app = models.BooleanField(default=True)
    comment_email = models.BooleanField(default=True)
    comment_in_app = models.BooleanField(default=True)
    kpi_alert_email = models.BooleanField(default=True)
    kpi_alert_in_app = models.BooleanField(default=True)
    seo_alert_email = models.BooleanField(default=False)
    seo_alert_in_app = models.BooleanField(default=True)
    report_email = models.BooleanField(default=True)
    report_in_app = models.BooleanField(default=True)

    class Meta:
        db_table = 'notification_settings'