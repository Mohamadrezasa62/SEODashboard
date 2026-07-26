from rest_framework import status
from rest_framework.views import APIView
from apps.core.mixins import ResponseMixin
from .serializers import (
    NotificationSerializer, NotificationSettingSerializer,
    UpdateNotificationSettingSerializer,
)
from .services import NotificationService


class NotificationListView(ResponseMixin, APIView):
    def get(self, request):
        unread_only = request.query_params.get('unread_only', '').lower() == 'true'
        service = NotificationService()
        notifications = service.get_notifications(request.user, unread_only=unread_only)
        serializer = NotificationSerializer(notifications, many=True)
        return self.success_response(data={
            'notifications': serializer.data,
            'unread_count': service.get_unread_count(request.user),
        })


class NotificationMarkReadView(ResponseMixin, APIView):
    def post(self, request, notification_id):
        service = NotificationService()
        service.mark_read(notification_id, request.user)
        return self.success_response(message='Notification marked as read.')


class NotificationMarkAllReadView(ResponseMixin, APIView):
    def post(self, request):
        service = NotificationService()
        service.mark_all_read(request.user)
        return self.success_response(message='All notifications marked as read.')


class NotificationDeleteView(ResponseMixin, APIView):
    def delete(self, request, notification_id):
        service = NotificationService()
        service.delete_notification(notification_id, request.user)
        return self.success_response(message='Notification deleted.')


class NotificationUnreadCountView(ResponseMixin, APIView):
    def get(self, request):
        service = NotificationService()
        count = service.get_unread_count(request.user)
        return self.success_response(data={'unread_count': count})


class NotificationSettingView(ResponseMixin, APIView):
    def get(self, request):
        service = NotificationService()
        setting = service.get_settings(request.user)
        serializer = NotificationSettingSerializer(setting)
        return self.success_response(data=serializer.data)

    def patch(self, request):
        serializer = UpdateNotificationSettingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = NotificationService()
        setting = service.update_settings(request.user, serializer.validated_data)
        return self.success_response(
            data=NotificationSettingSerializer(setting).data,
            message='Notification settings updated.',
        )