from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.dashboard.models import Dashboard, Widget


class DashboardTestCase(TestCase):
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
        self.client.force_authenticate(user=self.user)

    def _create_dashboard(self, name='Test Dashboard'):
        return self.client.post(
            '/api/v1/dashboard/',
            {'name': name, 'is_default': False, 'is_shared': False},
            format='json',
        )

    def test_create_dashboard(self):
        response = self._create_dashboard()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['name'], 'Test Dashboard')

    def test_list_dashboards(self):
        self._create_dashboard('Dashboard 1')
        self._create_dashboard('Dashboard 2')
        response = self.client.get('/api/v1/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['data']), 2)

    def test_set_default_dashboard(self):
        resp1 = self._create_dashboard('Dashboard 1')
        resp2 = self._create_dashboard('Dashboard 2')
        id1 = resp1.json()['data']['id']
        id2 = resp2.json()['data']['id']
        self.client.post(f'/api/v1/dashboard/{id1}/set-default/')
        self.client.post(f'/api/v1/dashboard/{id2}/set-default/')
        d1 = Dashboard.objects.get(id=id1)
        d2 = Dashboard.objects.get(id=id2)
        self.assertFalse(d1.is_default)
        self.assertTrue(d2.is_default)

    def test_add_widget(self):
        dash_resp = self._create_dashboard()
        dash_id = dash_resp.json()['data']['id']
        response = self.client.post(
            f'/api/v1/dashboard/{dash_id}/widgets/',
            {
                'name': 'Test Widget',
                'widget_type': 'line_chart',
                'data_source': 'seo_clicks',
                'width': 6,
                'height': 4,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['data']['name'], 'Test Widget')

    def test_delete_widget(self):
        dash_resp = self._create_dashboard()
        dash_id = dash_resp.json()['data']['id']
        widget_resp = self.client.post(
            f'/api/v1/dashboard/{dash_id}/widgets/',
            {
                'name': 'Widget to Delete',
                'widget_type': 'bar_chart',
                'data_source': 'seo_impressions',
            },
            format='json',
        )
        widget_id = widget_resp.json()['data']['id']
        response = self.client.delete(f'/api/v1/dashboard/widgets/{widget_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Widget.objects.filter(id=widget_id).exists())

    def test_update_layout(self):
        dash_resp = self._create_dashboard()
        dash_id = dash_resp.json()['data']['id']
        widget_resp = self.client.post(
            f'/api/v1/dashboard/{dash_id}/widgets/',
            {
                'name': 'Widget',
                'widget_type': 'metric_card',
                'data_source': 'seo_ctr',
            },
            format='json',
        )
        widget_id = widget_resp.json()['data']['id']
        response = self.client.put(
            f'/api/v1/dashboard/{dash_id}/layout/',
            {
                'widgets': [
                    {
                        'id': widget_id,
                        'position_x': 2,
                        'position_y': 1,
                        'width': 4,
                        'height': 3,
                    }
                ]
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        widget = Widget.objects.get(id=widget_id)
        self.assertEqual(widget.position_x, 2)
        self.assertEqual(widget.position_y, 1)

    def test_delete_dashboard(self):
        dash_resp = self._create_dashboard()
        dash_id = dash_resp.json()['data']['id']
        response = self.client.delete(f'/api/v1/dashboard/{dash_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Dashboard.objects.filter(id=dash_id).exists())