from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.projects.models import Project, ProjectMember


class FeedbackTestCase(TestCase):
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
            slug='test-project',
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

    def _create_thread(self, title='Test Thread', priority='medium'):
        return self.client.post(
            f'/api/v1/feedback/projects/{self.project.id}/threads/',
            {'title': title, 'priority': priority},
            format='json',
        )

    def test_create_thread_success(self):
        response = self._create_thread()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['title'], 'Test Thread')
        self.assertEqual(data['data']['status'], 'open')

    def test_list_threads(self):
        self._create_thread('Thread 1')
        self._create_thread('Thread 2')
        response = self.client.get(
            f'/api/v1/feedback/projects/{self.project.id}/threads/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['data']), 2)

    def test_employee_can_create_thread(self):
        self.client.force_authenticate(user=self.employee)
        response = self._create_thread('Employee Thread')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_add_comment_to_thread(self):
        thread_resp = self._create_thread()
        thread_id = thread_resp.json()['data']['id']
        response = self.client.post(
            f'/api/v1/feedback/threads/{thread_id}/comments/',
            {'content': 'This is a test comment'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['data']['content'], 'This is a test comment')

    def test_reply_to_comment(self):
        thread_resp = self._create_thread()
        thread_id = thread_resp.json()['data']['id']
        comment_resp = self.client.post(
            f'/api/v1/feedback/threads/{thread_id}/comments/',
            {'content': 'Parent comment'},
            format='json',
        )
        comment_id = comment_resp.json()['data']['id']
        reply_resp = self.client.post(
            f'/api/v1/feedback/threads/{thread_id}/comments/',
            {'content': 'Reply comment', 'parent_id': comment_id},
            format='json',
        )
        self.assertEqual(reply_resp.status_code, status.HTTP_201_CREATED)

    def test_resolve_thread(self):
        thread_resp = self._create_thread()
        thread_id = thread_resp.json()['data']['id']
        response = self.client.post(
            f'/api/v1/feedback/threads/{thread_id}/resolve/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['data']['status'], 'resolved')

    def test_employee_cannot_resolve_thread(self):
        thread_resp = self._create_thread()
        thread_id = thread_resp.json()['data']['id']
        self.client.force_authenticate(user=self.employee)
        response = self.client.post(
            f'/api/v1/feedback/threads/{thread_id}/resolve/'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_mark_thread_seen(self):
        thread_resp = self._create_thread()
        thread_id = thread_resp.json()['data']['id']
        response = self.client.post(
            f'/api/v1/feedback/threads/{thread_id}/seen/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_thread(self):
        thread_resp = self._create_thread()
        thread_id = thread_resp.json()['data']['id']
        response = self.client.delete(
            f'/api/v1/feedback/threads/{thread_id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_employee_cannot_delete_others_thread(self):
        thread_resp = self._create_thread()
        thread_id = thread_resp.json()['data']['id']
        self.client.force_authenticate(user=self.employee)
        response = self.client.delete(
            f'/api/v1/feedback/threads/{thread_id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_nonmember_cannot_access_threads(self):
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
            f'/api/v1/feedback/projects/{self.project.id}/threads/'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)