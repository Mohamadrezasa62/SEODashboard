from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.notifications.models import Notification, NotificationSetting


class NotificationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@test.com',
            password='Test1234!',
            first_name='Test',
            last_name='User',
            role='employee',
            is_verified=True,
        )
        self.sender = User.objects.create_user(
            email='sender@test.com',
            password='Test1234!',
            first_name='Sender',
            last_name='User',
            role='employee',
            is_verified=True,
        )
        self.client.force_authenticate(user=self.user)
        self._create_notifications()

    def _create_notifications(self):
        for i in range(3):
            Notification.objects.create(
                recipient=self.user,
                sender=self.sender,
                notification_type='comment',
                title=f'Notification {i}',
                body=f'Body {i}',
            )

    def test_list_notifications(self):
        response = self.client.get('/api/v1/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertEqual(data['unread_count'], 3)
        self.assertEqual(len(data['notifications']), 3)

    def test_list_unread_only(self):
        response = self.client.get('/api/v1/notifications/?unread_only=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertEqual(len(data['notifications']), 3)

    def test_mark_notification_read(self):
        notif = Notification.objects.filter(recipient=self.user).first()
        response = self.client.post(f'/api/v1/notifications/{notif.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_mark_all_read(self):
        response = self.client.post('/api/v1/notifications/mark-all-read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        unread_count = Notification.objects.filter(
            recipient=self.user, is_read=False
        ).count()
        self.assertEqual(unread_count, 0)

    def test_unread_count(self):
        response = self.client.get('/api/v1/notifications/unread-count/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['data']['unread_count'], 3)

    def test_delete_notification(self):
        notif = Notification.objects.filter(recipient=self.user).first()
        response = self.client.delete(f'/api/v1/notifications/{notif.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            Notification.objects.filter(id=notif.id).exists()
        )

    def test_get_notification_settings(self):
        response = self.client.get('/api/v1/notifications/settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_notification_settings(self):
        response = self.client.patch(
            '/api/v1/notifications/settings/',
            {
                'email_enabled': False,
                'mention_in_app': False,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertFalse(data['email_enabled'])
        self.assertFalse(data['mention_in_app'])

    def test_other_user_cannot_read_my_notifications(self):
        other_user = User.objects.create_user(
            email='other@test.com',
            password='Test1234!',
            first_name='Other',
            last_name='User',
            role='employee',
            is_verified=True,
        )
        notif = Notification.objects.filter(recipient=self.user).first()
        self.client.force_authenticate(user=other_user)
        response = self.client.post(f'/api/v1/notifications/{notif.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notif.refresh_from_db()
        self.assertFalse(notif.is_read)