from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from apps.users.models import User
from apps.projects.models import Project, ProjectMember
from apps.gsc.models import GSCCredential, GSCSyncLog
from django.utils import timezone


class GSCTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manager = User.objects.create_user(
            email='manager@test.com',
            password='Test1234!',
            first_name='Manager',
            last_name='User',
            role='company_manager',
            is_verified=True,
        )
        self.project = Project.objects.create(
            name='GSC Test Project',
            slug='gsc-test-project',
            domain='https://gsctest.com',
            owner=self.manager,
        )
        ProjectMember.objects.create(
            project=self.project, user=self.manager, role='manager'
        )
        self.client.force_authenticate(user=self.manager)

    def test_connect_gsc(self):
        response = self.client.post(
            f'/api/v1/gsc/{self.project.id}/connect/',
            {
                'access_token': 'test-access-token',
                'refresh_token': 'test-refresh-token',
                'token_expiry': (timezone.now() + timezone.timedelta(hours=1)).isoformat(),
                'site_url': 'https://gsctest.com',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            GSCCredential.objects.filter(project=self.project, is_active=True).exists()
        )

    def test_disconnect_gsc(self):
        GSCCredential.objects.create(
            project=self.project,
            user=self.manager,
            access_token='token',
            refresh_token='refresh',
            token_expiry=timezone.now() + timezone.timedelta(hours=1),
            site_url='https://gsctest.com',
            is_active=True,
        )
        response = self.client.delete(f'/api/v1/gsc/{self.project.id}/disconnect/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            GSCCredential.objects.filter(project=self.project, is_active=True).exists()
        )

    @patch('apps.gsc.tasks.sync_gsc_data_task.delay')
    def test_manual_sync_queues_task(self, mock_delay):
        GSCCredential.objects.create(
            project=self.project,
            user=self.manager,
            access_token='token',
            refresh_token='refresh',
            token_expiry=timezone.now() + timezone.timedelta(hours=1),
            site_url='https://gsctest.com',
            is_active=True,
        )
        response = self.client.post(f'/api/v1/gsc/{self.project.id}/sync/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(mock_delay.called)

    def test_sync_logs_empty_initially(self):
        response = self.client.get(f'/api/v1/gsc/{self.project.id}/sync/logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['data'], [])

    def test_sync_log_status_flow(self):
        from apps.gsc.repositories import GSCSyncLogRepository
        log = GSCSyncLogRepository.create(self.project)
        self.assertEqual(log.status, 'pending')
        GSCSyncLogRepository.mark_running(log)
        log.refresh_from_db()
        self.assertEqual(log.status, 'running')
        GSCSyncLogRepository.mark_success(log, rows_synced=100)
        log.refresh_from_db()
        self.assertEqual(log.status, 'success')
        self.assertEqual(log.rows_synced, 100)

    def test_nonmember_cannot_access_gsc(self):
        outsider = User.objects.create_user(
            email='outsider@test.com',
            password='Test1234!',
            first_name='Out',
            last_name='Sider',
            role='employee',
            is_verified=True,
        )
        self.client.force_authenticate(user=outsider)
        response = self.client.get(f'/api/v1/gsc/{self.project.id}/sync/logs/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])