from unittest.mock import patch, MagicMock
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.backup.models import BackupRecord


class BackupTestCase(TestCase):
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

    def test_list_backups_requires_developer(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get('/api/v1/backup/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_developer_can_list_backups(self):
        self.client.force_authenticate(user=self.developer)
        response = self.client.get('/api/v1/backup/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('apps.backup.services.BackupService._run_mysqldump')
    @patch('apps.backup.services.BackupService._compute_checksum')
    def test_create_backup(self, mock_checksum, mock_dump):
        mock_dump.return_value = '/app/backups/backup_test.sql.gz'
        mock_checksum.return_value = 'abc123checksum'

        import os
        with patch('os.path.getsize', return_value=1024 * 1024):
            self.client.force_authenticate(user=self.developer)
            response = self.client.post('/api/v1/backup/')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()['data']
        self.assertEqual(data['status'], 'success')

    def test_backup_record_status_flow(self):
        record = BackupRecord.objects.create(
            name='test_backup',
            backup_type='manual',
            initiated_by=self.developer,
            status='pending',
        )
        self.assertEqual(record.status, 'pending')
        from apps.backup.repositories import BackupRepository
        BackupRepository.mark_running(record)
        record.refresh_from_db()
        self.assertEqual(record.status, 'running')
        BackupRepository.mark_success(record, '/path/to/backup.sql.gz', 1024, 'checksum123')
        record.refresh_from_db()
        self.assertEqual(record.status, 'success')

    def test_delete_backup(self):
        record = BackupRecord.objects.create(
            name='test_delete_backup',
            backup_type='manual',
            status='success',
            file_path='/tmp/nonexistent.sql.gz',
        )
        self.client.force_authenticate(user=self.developer)
        with patch('os.path.exists', return_value=False):
            response = self.client.delete(f'/api/v1/backup/{record.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(BackupRecord.objects.filter(id=record.id).exists())