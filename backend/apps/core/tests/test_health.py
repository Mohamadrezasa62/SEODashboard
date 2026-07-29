from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status


class HealthCheckTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_returns_200(self):
        response = self.client.get('/api/v1/monitoring/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('services', data['data'])

    def test_health_check_includes_database(self):
        response = self.client.get('/api/v1/monitoring/health/')
        data = response.json()
        self.assertIn('database', data['data']['services'])

    def test_health_check_includes_redis(self):
        response = self.client.get('/api/v1/monitoring/health/')
        data = response.json()
        self.assertIn('redis', data['data']['services'])