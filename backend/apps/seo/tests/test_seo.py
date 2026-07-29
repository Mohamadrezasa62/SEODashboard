from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.projects.models import Project, ProjectMember
from apps.seo.models import SEOKeyword, SEOPage, SEODataPoint
from datetime import date
from decimal import Decimal


class SEOTestCase(TestCase):
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
            name='SEO Test Project',
            slug='seo-test-project',
            domain='https://seotest.com',
            owner=self.manager,
        )
        ProjectMember.objects.create(
            project=self.project,
            user=self.manager,
            role='manager',
        )
        self.client.force_authenticate(user=self.manager)
        self._seed_data()

    def _seed_data(self):
        keyword = SEOKeyword.objects.create(
            project=self.project,
            keyword='test keyword',
        )
        page = SEOPage.objects.create(
            project=self.project,
            url='https://seotest.com/test-page',
        )
        for i in range(5):
            SEODataPoint.objects.create(
                project=self.project,
                keyword=keyword,
                page=page,
                date=date(2024, 1, i + 1),
                clicks=100 + i * 10,
                impressions=1000 + i * 100,
                ctr=Decimal('0.1'),
                position=Decimal('5.0'),
                device='web',
                country='IR',
            )

    def test_get_seo_summary(self):
        response = self.client.get(
            f'/api/v1/seo/{self.project.id}/summary/',
            {'date_from': '2024-01-01', 'date_to': '2024-01-05'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertIn('total_clicks', data)
        self.assertIn('total_impressions', data)
        self.assertGreater(data['total_clicks'], 0)

    def test_get_top_keywords(self):
        response = self.client.get(
            f'/api/v1/seo/{self.project.id}/keywords/',
            {'date_from': '2024-01-01', 'date_to': '2024-01-05'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertGreater(len(data), 0)
        self.assertIn('keyword__keyword', data[0])
        self.assertIn('total_clicks', data[0])

    def test_get_top_pages(self):
        response = self.client.get(
            f'/api/v1/seo/{self.project.id}/pages/',
            {'date_from': '2024-01-01', 'date_to': '2024-01-05'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertGreater(len(data), 0)
        self.assertIn('page__url', data[0])

    def test_get_daily_trend(self):
        response = self.client.get(
            f'/api/v1/seo/{self.project.id}/trend/',
            {'date_from': '2024-01-01', 'date_to': '2024-01-05'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertEqual(len(data), 5)

    def test_get_device_breakdown(self):
        response = self.client.get(
            f'/api/v1/seo/{self.project.id}/devices/',
            {'date_from': '2024-01-01', 'date_to': '2024-01-05'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_country_breakdown(self):
        response = self.client.get(
            f'/api/v1/seo/{self.project.id}/countries/',
            {'date_from': '2024-01-01', 'date_to': '2024-01-05'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthorized_cannot_access_seo(self):
        outsider = User.objects.create_user(
            email='outsider@test.com',
            password='Test1234!',
            first_name='Out',
            last_name='Sider',
            role='employee',
            is_verified=True,
        )
        self.client.force_authenticate(user=outsider)
        response = self.client.get(
            f'/api/v1/seo/{self.project.id}/summary/',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)