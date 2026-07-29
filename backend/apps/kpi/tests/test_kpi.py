from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.projects.models import Project, ProjectMember
from decimal import Decimal


class KPITestCase(TestCase):
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
            slug='test-project-kpi',
            domain='https://test.com',
            owner=self.manager,
        )
        ProjectMember.objects.create(
            project=self.project,
            user=self.manager,
            role='manager',
        )
        ProjectMember.objects.create(
            project=self.project,
            user=self.employee,
            role='viewer',
        )
        self.client.force_authenticate(user=self.manager)

    def _create_kpi(self, name='Test KPI'):
        return self.client.post(
            f'/api/v1/kpi/projects/{self.project.id}/kpis/',
            {
                'name': name,
                'kpi_type': 'clicks',
                'period': 'monthly',
                'target_value': '10000',
                'alert_threshold_pct': '20',
            },
            format='json',
        )

    def test_create_kpi_success(self):
        response = self._create_kpi()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['name'], 'Test KPI')
        self.assertEqual(Decimal(data['data']['target_value']), Decimal('10000'))

    def test_list_kpis(self):
        self._create_kpi('KPI 1')
        self._create_kpi('KPI 2')
        response = self.client.get(
            f'/api/v1/kpi/projects/{self.project.id}/kpis/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['data']), 2)

    def test_employee_cannot_create_kpi(self):
        self.client.force_authenticate(user=self.employee)
        response = self._create_kpi()
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_record_kpi_value(self):
        kpi_resp = self._create_kpi()
        kpi_id = kpi_resp.json()['data']['id']
        response = self.client.post(
            f'/api/v1/kpi/kpis/{kpi_id}/records/',
            {
                'date': '2024-01-01',
                'value': '8500',
                'note': 'January result',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.json()['data']['value']), Decimal('8500'))

    def test_achievement_percentage(self):
        kpi_resp = self._create_kpi()
        kpi_id = kpi_resp.json()['data']['id']
        self.client.post(
            f'/api/v1/kpi/kpis/{kpi_id}/records/',
            {'date': '2024-01-01', 'value': '5000'},
            format='json',
        )
        kpi_detail = self.client.get(f'/api/v1/kpi/kpis/{kpi_id}/')
        achievement = kpi_detail.json()['data']['achievement_pct']
        self.assertEqual(float(achievement), 50.0)

    def test_alert_created_when_below_threshold(self):
        kpi_resp = self._create_kpi()
        kpi_id = kpi_resp.json()['data']['id']
        self.client.post(
            f'/api/v1/kpi/kpis/{kpi_id}/records/',
            {'date': '2024-01-01', 'value': '1000'},
            format='json',
        )
        alerts_resp = self.client.get(
            f'/api/v1/kpi/projects/{self.project.id}/kpi-alerts/'
        )
        self.assertEqual(alerts_resp.status_code, status.HTTP_200_OK)
        self.assertGreater(len(alerts_resp.json()['data']), 0)

    def test_update_kpi(self):
        kpi_resp = self._create_kpi()
        kpi_id = kpi_resp.json()['data']['id']
        response = self.client.patch(
            f'/api/v1/kpi/kpis/{kpi_id}/',
            {'name': 'Updated KPI', 'target_value': '15000'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['data']['name'], 'Updated KPI')

    def test_delete_kpi(self):
        kpi_resp = self._create_kpi()
        kpi_id = kpi_resp.json()['data']['id']
        response = self.client.delete(f'/api/v1/kpi/kpis/{kpi_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_resolve_alert(self):
        kpi_resp = self._create_kpi()
        kpi_id = kpi_resp.json()['data']['id']
        self.client.post(
            f'/api/v1/kpi/kpis/{kpi_id}/records/',
            {'date': '2024-01-01', 'value': '100'},
            format='json',
        )
        alerts_resp = self.client.get(
            f'/api/v1/kpi/projects/{self.project.id}/kpi-alerts/'
        )
        alert_id = alerts_resp.json()['data'][0]['id']
        resolve_resp = self.client.post(
            f'/api/v1/kpi/kpi-alerts/{alert_id}/resolve/'
        )
        self.assertEqual(resolve_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resolve_resp.json()['data']['is_resolved'])