from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from apps.users.models import User
from apps.ai.models import AIProvider, AIPromptTemplate


class AITestCase(TestCase):
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
        self.client.force_authenticate(user=self.developer)

    def test_create_provider(self):
        response = self.client.post(
            '/api/v1/ai/providers/',
            {
                'name': 'Test OpenAI',
                'provider': 'openai',
                'model': 'gpt-4o',
                'api_key': 'sk-test-key-12345678',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()['data']
        self.assertEqual(data['name'], 'Test OpenAI')
        self.assertNotIn('api_key_encrypted', data)

    def test_list_providers(self):
        AIProvider.objects.create(
            name='Provider 1',
            provider='openai',
            model='gpt-4o',
            api_key_encrypted='dGVzdA==',
        )
        response = self.client.get('/api/v1/ai/providers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['data']), 1)

    def test_employee_cannot_access_providers(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get('/api/v1/ai/providers/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_set_default_provider(self):
        p1 = AIProvider.objects.create(
            name='P1', provider='openai', model='gpt-4o',
            api_key_encrypted='dGVzdA==', is_default=True,
        )
        p2 = AIProvider.objects.create(
            name='P2', provider='anthropic', model='claude-opus-4-6',
            api_key_encrypted='dGVzdA==',
        )
        response = self.client.post(f'/api/v1/ai/providers/{p2.id}/set-default/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        p1.refresh_from_db()
        p2.refresh_from_db()
        self.assertFalse(p1.is_default)
        self.assertTrue(p2.is_default)

    def test_delete_provider(self):
        provider = AIProvider.objects.create(
            name='Delete Me', provider='openai', model='gpt-4o',
            api_key_encrypted='dGVzdA==',
        )
        response = self.client.delete(f'/api/v1/ai/providers/{provider.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(AIProvider.objects.filter(id=provider.id).exists())

    def test_create_template(self):
        response = self.client.post(
            '/api/v1/ai/templates/',
            {
                'name': 'SEO Template',
                'slug': 'seo-template',
                'system_prompt': 'You are an SEO expert.',
                'user_prompt_template': 'Suggest for keyword: {keyword}',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_ai_usage_stats(self):
        response = self.client.get('/api/v1/ai/usage/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertIn('total_requests', data)
        self.assertIn('total_tokens', data)

    @patch('apps.ai.services.AIService._call_openai')
    def test_seo_suggestion(self, mock_call):
        from apps.projects.models import Project, ProjectMember
        project = Project.objects.create(
            name='AI Test Project',
            slug='ai-test-project',
            domain='https://aitest.com',
            owner=self.developer,
        )
        ProjectMember.objects.create(
            project=project, user=self.developer, role='manager'
        )
        AIProvider.objects.create(
            name='Default', provider='openai', model='gpt-4o',
            api_key_encrypted='dGVzdA==', is_active=True, is_default=True,
        )
        mock_call.return_value = ('Test suggestion', {
            'prompt_tokens': 100,
            'completion_tokens': 200,
            'total_tokens': 300,
        })
        response = self.client.post(
            f'/api/v1/ai/projects/{project.id}/suggest/',
            {'keyword': 'test keyword'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('suggestion', response.json()['data'])