from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.monitoring.models import AuditLog


class MonitoringTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.developer = User.objects.create_user(
            email='dev@test.com',
            password='Test1234!',
            first_name='Dev',
            last_name='User',
            role='developer',
            is_verified=True,
        )
        self.employee = User.objects.create_user(
            email='emp@test.com',
            password='Test1234!',
            first_name='Emp',
            last_name='User',
            role='employee',
            is_verified=True,
        )

    def test_health_check_public(self):
        response = self.client.get('/api/v1/monitoring/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertIn('status', data)
        self.assertIn('services', data)

    def test_audit_logs_requires_developer(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get('/api/v1/monitoring/audit-logs/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_developer_can_view_audit_logs(self):
        AuditLog.objects.create(
            user=self.developer,
            action='login',
            model_name='User',
        )
        self.client.force_authenticate(user=self.developer)
        response = self.client.get('/api/v1/monitoring/audit-logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.json()['data']), 0)

    def test_system_stats_requires_developer(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get('/api/v1/monitoring/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_developer_can_view_system_stats(self):
        self.client.force_authenticate(user=self.developer)
        response = self.client.get('/api/v1/monitoring/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertIn('total_users', data)
        self.assertIn('total_projects', data)

    def test_audit_log_filter_by_action(self):
        AuditLog.objects.create(user=self.developer, action='login', model_name='User')
        AuditLog.objects.create(user=self.developer, action='create', model_name='Project')
        self.client.force_authenticate(user=self.developer)
        response = self.client.get('/api/v1/monitoring/audit-logs/?action=login')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        logs = response.json()['data']
        for log in logs:
            self.assertEqual(log['action'], 'login')