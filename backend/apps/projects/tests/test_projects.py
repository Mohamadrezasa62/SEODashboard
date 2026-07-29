from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.projects.models import Project, ProjectMember


class ProjectTestCase(TestCase):
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
        self.client.force_authenticate(user=self.manager)

    def _create_project(self, name='Test Project'):
        response = self.client.post('/api/v1/projects/', {
            'name': name,
            'domain': 'https://test.com',
            'description': 'Test description',
        }, format='json')
        return response

    def test_create_project_success(self):
        response = self._create_project()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['name'], 'Test Project')

    def test_list_projects(self):
        self._create_project('Project 1')
        self._create_project('Project 2')
        response = self.client.get('/api/v1/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['data']), 2)

    def test_employee_sees_only_own_projects(self):
        self._create_project('Manager Project')
        self.client.force_authenticate(user=self.employee)
        response = self.client.get('/api/v1/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['data']), 0)

    def test_get_project_detail(self):
        create_resp = self._create_project()
        project_id = create_resp.json()['data']['id']
        response = self.client.get(f'/api/v1/projects/{project_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_project(self):
        create_resp = self._create_project()
        project_id = create_resp.json()['data']['id']
        response = self.client.patch(
            f'/api/v1/projects/{project_id}/',
            {'name': 'Updated Name'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['data']['name'], 'Updated Name')

    def test_delete_project(self):
        create_resp = self._create_project()
        project_id = create_resp.json()['data']['id']
        response = self.client.delete(f'/api/v1/projects/{project_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        get_resp = self.client.get(f'/api/v1/projects/{project_id}/')
        self.assertEqual(get_resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_member_to_project(self):
        create_resp = self._create_project()
        project_id = create_resp.json()['data']['id']
        response = self.client.post(
            f'/api/v1/projects/{project_id}/members/',
            {'user_id': str(self.employee.id), 'role': 'viewer'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_employee_can_access_project_after_being_added(self):
        create_resp = self._create_project()
        project_id = create_resp.json()['data']['id']
        self.client.post(
            f'/api/v1/projects/{project_id}/members/',
            {'user_id': str(self.employee.id), 'role': 'viewer'},
            format='json',
        )
        self.client.force_authenticate(user=self.employee)
        response = self.client.get(f'/api/v1/projects/{project_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)