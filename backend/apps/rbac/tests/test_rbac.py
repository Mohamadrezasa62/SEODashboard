from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.rbac.models import Permission, Role, RolePermission


class RBACTestCase(TestCase):
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

    def test_developer_can_list_permissions(self):
        self.client.force_authenticate(user=self.developer)
        response = self.client.get('/api/v1/rbac/permissions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_employee_cannot_list_permissions(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get('/api/v1/rbac/permissions/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_developer_can_create_role(self):
        self.client.force_authenticate(user=self.developer)
        response = self.client.post('/api/v1/rbac/roles/', {
            'name': 'Test Role',
            'slug': 'test-role',
            'description': 'A test role',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_my_permissions_endpoint(self):
        self.client.force_authenticate(user=self.developer)
        response = self.client.get('/api/v1/rbac/my-permissions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertEqual(data['role'], 'developer')

    def test_change_user_role(self):
        self.client.force_authenticate(user=self.developer)
        response = self.client.patch(
            f'/api/v1/rbac/users/{self.employee.id}/role/',
            {'role': 'company_manager'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employee.refresh_from_db()
        self.assertEqual(self.employee.role, 'company_manager')

    def test_feature_flag_check(self):
        from apps.rbac.models import FeatureFlag
        FeatureFlag.objects.create(
            name='Test Feature',
            slug='test-feature',
            is_enabled=True,
            allowed_roles=['developer'],
        )
        self.client.force_authenticate(user=self.developer)
        response = self.client.get('/api/v1/rbac/features/test-feature/check/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()['data']['enabled'])

        self.client.force_authenticate(user=self.employee)
        response = self.client.get('/api/v1/rbac/features/test-feature/check/')
        self.assertFalse(response.json()['data']['enabled'])