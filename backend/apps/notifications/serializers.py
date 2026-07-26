from rest_framework import serializers
from .models import Notification, NotificationSetting
from apps.users.serializers import UserListSerializer


class NotificationSerializer(serializers.ModelSerializer):
    sender = UserListSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = (
            'id', 'notification_type', 'title', 'body',
            'is_read', 'read_at', 'action_url',
            'sender', 'metadata', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = (
            'email_enabled', 'in_app_enabled',
            'mention_email', 'mention_in_app',
            'comment_email', 'comment_in_app',
            'kpi_alert_email', 'kpi_alert_in_app',
            'seo_alert_email', 'seo_alert_in_app',
            'report_email', 'report_in_app',
        )


class UpdateNotificationSettingSerializer(serializers.Serializer):
    email_enabled = serializers.BooleanField(required=False)
    in_app_enabled = serializers.BooleanField(required=False)
    mention_email = serializers.BooleanField(required=False)
    mention_in_app = serializers.BooleanField(required=False)
    comment_email = serializers.BooleanField(required=False)
    comment_in_app = serializers.BooleanField(required=False)
    kpi_alert_email = serializers.BooleanField(required=False)
    kpi_alert_in_app = serializers.BooleanField(required=False)
    seo_alert_email = serializers.BooleanField(required=False)
    seo_alert_in_app = serializers.BooleanField(required=False)
    report_email = serializers.BooleanField(required=False)
    report_in_app = serializers.BooleanField(required=False)