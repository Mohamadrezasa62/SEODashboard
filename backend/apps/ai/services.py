import logging
from django.utils import timezone
from apps.core.exceptions import NotFoundException, ServiceException, PermissionDeniedException
from apps.users.repositories import ActivityLogRepository
from .repositories import AIRepository

logger = logging.getLogger(__name__)


class AIService:
    def list_providers(self):
        return AIRepository.get_all_providers()

    def get_provider(self, provider_id):
        provider = AIRepository.get_provider_by_id(provider_id)
        if not provider:
            raise NotFoundException('AI provider not found.')
        return provider

    def create_provider(self, user, name, provider, model, api_key, config=None):
        encrypted_key = self._encrypt_key(api_key)
        return AIRepository.create_provider(
            name=name,
            provider=provider,
            model=model,
            api_key_encrypted=encrypted_key,
            config=config or {},
        )

    def update_provider(self, provider_id, user, data):
        provider = self.get_provider(provider_id)
        if 'api_key' in data:
            data['api_key_encrypted'] = self._encrypt_key(data.pop('api_key'))
        return AIRepository.update_provider(provider, **data)

    def delete_provider(self, provider_id, user):
        provider = self.get_provider(provider_id)
        provider.delete()

    def set_default_provider(self, provider_id, user):
        provider = self.get_provider(provider_id)
        return AIRepository.set_default_provider(provider)

    def list_templates(self):
        return AIRepository.get_all_templates()

    def get_template(self, template_id):
        template = AIRepository.get_template_by_id(template_id)
        if not template:
            raise NotFoundException('Template not found.')
        return template

    def create_template(self, user, name, slug, system_prompt,
                        user_prompt_template, provider_id=None, description=None):
        return AIRepository.create_template(
            name=name,
            slug=slug,
            system_prompt=system_prompt,
            user_prompt_template=user_prompt_template,
            provider_id=provider_id,
            description=description,
        )

    def generate_seo_suggestion(self, project_id, user, keyword, context=None):
        from apps.projects.repositories import ProjectRepository, ProjectMemberRepository
        project = ProjectRepository.get_by_id(project_id)
        if not project:
            raise NotFoundException('Project not found.')
        if not ProjectMemberRepository.is_member(project, user):
            raise PermissionDeniedException('Access denied.')

        provider = AIRepository.get_default_provider()
        if not provider:
            raise ServiceException('No active AI provider configured.')

        prompt = self._build_seo_prompt(keyword, project.domain, context)
        start_time = timezone.now()

        try:
            response_text, usage = self._call_provider(provider, prompt)
            duration_ms = int((timezone.now() - start_time).total_seconds() * 1000)

            AIRepository.log_usage(
                user=user,
                project=project,
                provider=provider,
                prompt_tokens=usage.get('prompt_tokens', 0),
                completion_tokens=usage.get('completion_tokens', 0),
                total_tokens=usage.get('total_tokens', 0),
                response_time_ms=duration_ms,
                is_success=True,
            )
            return response_text

        except Exception as e:
            duration_ms = int((timezone.now() - start_time).total_seconds() * 1000)
            AIRepository.log_usage(
                user=user,
                project=project,
                provider=provider,
                response_time_ms=duration_ms,
                is_success=False,
                error_message=str(e),
            )
            raise ServiceException(f'AI generation failed: {str(e)}')

    def _build_seo_prompt(self, keyword, domain, context):
        base = f'You are an SEO expert. Provide actionable SEO suggestions for the keyword "{keyword}" for the domain "{domain}".'
        if context:
            base += f' Additional context: {context}'
        base += ' Provide 5 specific, actionable recommendations.'
        return base

    def _call_provider(self, provider, prompt):
        api_key = self._decrypt_key(provider.api_key_encrypted)

        if provider.provider == 'openai':
            return self._call_openai(api_key, provider.model, prompt)
        elif provider.provider == 'anthropic':
            return self._call_anthropic(api_key, provider.model, prompt)
        else:
            raise ServiceException(f'Provider {provider.provider} not implemented.')

    def _call_openai(self, api_key, model, prompt):
        import openai
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            messages=[{'role': 'user', 'content': prompt}],
            max_tokens=1000,
        )
        text = response.choices[0].message.content
        usage = {
            'prompt_tokens': response.usage.prompt_tokens,
            'completion_tokens': response.usage.completion_tokens,
            'total_tokens': response.usage.total_tokens,
        }
        return text, usage

    def _call_anthropic(self, api_key, model, prompt):
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=model,
            max_tokens=1000,
            messages=[{'role': 'user', 'content': prompt}],
        )
        text = response.content[0].text
        usage = {
            'prompt_tokens': response.usage.input_tokens,
            'completion_tokens': response.usage.output_tokens,
            'total_tokens': response.usage.input_tokens + response.usage.output_tokens,
        }
        return text, usage

    def _encrypt_key(self, key):
        import base64
        return base64.b64encode(key.encode()).decode()

    def _decrypt_key(self, encrypted_key):
        import base64
        return base64.b64decode(encrypted_key.encode()).decode()

    def get_usage_stats(self, user, project_id=None):
        return AIRepository.get_usage_stats(user, project_id)