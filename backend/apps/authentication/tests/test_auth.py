from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User


class AuthTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/v1/auth/register/'
        self.login_url = '/api/v1/auth/login/'

    def _create_verified_user(self, email='test@test.com', password='Test1234!'):
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name='Test',
            last_name='User',
            role='employee',
            is_verified=True,
        )
        return user

    def test_register_success(self):
        data = {
            'email': 'newuser@test.com',
            'password': 'Test1234!',
            'confirm_password': 'Test1234!',
            'first_name': 'New',
            'last_name': 'User',
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.json()['success'])

    def test_register_duplicate_email(self):
        self._create_verified_user()
        data = {
            'email': 'test@test.com',
            'password': 'Test1234!',
            'confirm_password': 'Test1234!',
            'first_name': 'Another',
            'last_name': 'User',
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch(self):
        data = {
            'email': 'newuser2@test.com',
            'password': 'Test1234!',
            'confirm_password': 'Different1234!',
            'first_name': 'New',
            'last_name': 'User',
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        self._create_verified_user()
        data = {'email': 'test@test.com', 'password': 'Test1234!'}
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resp_data = response.json()
        self.assertTrue(resp_data['success'])
        self.assertIn('tokens', resp_data['data'])
        self.assertIn('access', resp_data['data']['tokens'])
        self.assertIn('refresh', resp_data['data']['tokens'])

    def test_login_wrong_password(self):
        self._create_verified_user()
        data = {'email': 'test@test.com', 'password': 'WrongPassword!'}
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_unverified_user(self):
        User.objects.create_user(
            email='unverified@test.com',
            password='Test1234!',
            first_name='Un',
            last_name='Verified',
            is_verified=False,
        )
        data = {'email': 'unverified@test.com', 'password': 'Test1234!'}
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_me_endpoint_requires_auth(self):
        response = self.client.get('/api/v1/users/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint_with_auth(self):
        user = self._create_verified_user()
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/v1/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['data']['email'], user.email)

    def test_logout_blacklists_token(self):
        user = self._create_verified_user()
        login_resp = self.client.post(
            self.login_url,
            {'email': 'test@test.com', 'password': 'Test1234!'},
            format='json',
        )
        tokens = login_resp.json()['data']['tokens']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
        logout_resp = self.client.post(
            '/api/v1/auth/logout/',
            {'refresh': tokens['refresh']},
            format='json',
        )
        self.assertEqual(logout_resp.status_code, status.HTTP_200_OK)