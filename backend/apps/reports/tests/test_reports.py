from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from apps.users.models import User
from apps.projects.models import Project, ProjectMember
from apps.reports.models import Report, ScheduledReport


class ReportTestCase(TestCase):
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
        self.employee = User.objects.create_user(
            email='employee@test.com',
            password='Test1234!',
            first_name='Employee',
            last_name='User',
            role='employee',
            is_verified=True,
        )
        self.project = Project.objects.create(
            name='Test Project',
            slug='test-project-reports',
            domain='https://test.com',
            owner=self.manager,
        )
        ProjectMember.objects.create(
            project=self.project, user=self.manager, role='manager'
        )
        ProjectMember.objects.create(
            project=self.project, user=self.employee, role='viewer'
        )
        self.client.force_authenticate(user=self.manager)

    @patch('apps.reports.tasks.generate_report_task.delay')
    def test_create_report_success(self, mock_task):
        mock_task.return_value = MagicMock()
        response = self.client.post(
            f'/api/v1/reports/projects/{self.project.id}/',
            {'name': 'Test Report', 'format': 'excel'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(mock_task.called)
        data = response.json()['data']
        self.assertEqual(data['name'], 'Test Report')
        self.assertEqual(data['status'], 'pending')

    def test_list_reports(self):
        Report.objects.create(
            project=self.project,
            created_by=self.manager,
            name='Report 1',
            format='excel',
        )
        Report.objects.create(
            project=self.project,
            created_by=self.manager,
            name='Report 2',
            format='pdf',
        )
        response = self.client.get(f'/api/v1/reports/projects/{self.project.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['data']), 2)

    def test_employee_sees_only_own_reports(self):
        Report.objects.create(
            project=self.project,
            created_by=self.manager,
            name='Manager Report',
            format='excel',
        )
        Report.objects.create(
            project=self.project,
            created_by=self.employee,
            name='Employee Report',
            format='csv',
        )
        self.client.force_authenticate(user=self.employee)
        response = self.client.get(f'/api/v1/reports/projects/{self.project.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], 'Employee Report')

    def test_delete_report(self):
        report = Report.objects.create(
            project=self.project,
            created_by=self.manager,
            name='Delete Me',
            format='csv',
        )
        response = self.client.delete(f'/api/v1/reports/{report.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Report.objects.filter(id=report.id).exists())

    def test_employee_cannot_create_scheduled_report(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.post(
            f'/api/v1/reports/projects/{self.project.id}/scheduled/',
            {
                'name': 'Scheduled',
                'frequency': 'weekly',
                'format': 'excel',
                'recipients': ['test@test.com'],
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_scheduled_report(self):
        response = self.client.post(
            f'/api/v1/reports/projects/{self.project.id}/scheduled/',
            {
                'name': 'Weekly Report',
                'frequency': 'weekly',
                'format': 'excel',
                'recipients': ['admin@test.com'],
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_toggle_scheduled_report(self):
        scheduled = ScheduledReport.objects.create(
            project=self.project,
            created_by=self.manager,
            name='Test Scheduled',
            frequency='daily',
            format='csv',
            recipients=['test@test.com'],
            is_active=True,
        )
        response = self.client.patch(
            f'/api/v1/reports/scheduled/{scheduled.id}/',
            {'active': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        scheduled.refresh_from_db()
        self.assertFalse(scheduled.is_active)