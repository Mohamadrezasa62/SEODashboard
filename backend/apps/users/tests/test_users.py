from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User, UserProfile


class UserTestCase(TestCase):
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

    def test_get_me(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get('/api/v1/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertEqual(data['email'], 'emp@test.com')
        self.assertIn('profile', data)

    def test_update_profile(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.patch(
            '/api/v1/users/me/',
            {
                'first_name': 'Updated',
                'last_name': 'Name',
                'phone': '09123456789',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employee.refresh_from_db()
        self.assertEqual(self.employee.first_name, 'Updated')

    def test_change_password_success(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.post(
            '/api/v1/users/me/change-password/',
            {
                'old_password': 'Test1234!',
                'new_password': 'NewPass1234!',
                'confirm_password': 'NewPass1234!',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employee.refresh_from_db()
        self.assertTrue(self.employee.check_password('NewPass1234!'))

    def test_change_password_wrong_old(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.post(
            '/api/v1/users/me/change-password/',
            {
                'old_password': 'WrongPassword!',
                'new_password': 'NewPass1234!',
                'confirm_password': 'NewPass1234!',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_users_requires_manager(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get('/api/v1/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_list_users(self):
        self.client.force_authenticate(user=self.developer)
        response = self.client.get('/api/v1/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_developer_can_create_user(self):
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(
            '/api/v1/users/create/',
            {
                'email': 'newuser@test.com',
                'first_name': 'New',
                'last_name': 'User',
                'role': 'employee',
                'password': 'Test1234!',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_employee_cannot_create_user(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.post(
            '/api/v1/users/create/',
            {
                'email': 'another@test.com',
                'first_name': 'Another',
                'last_name': 'User',
                'role': 'employee',
                'password': 'Test1234!',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_profile_auto_created(self):
        user = User.objects.create_user(
            email='newprofile@test.com',
            password='Test1234!',
            first_name='New',
            last_name='Profile',
        )
        self.assertTrue(
            UserProfile.objects.filter(user=user).exists()
        )