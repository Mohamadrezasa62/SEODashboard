from django.db.models import Sum, Count, Avg
from .models import AIProvider, AIPromptTemplate, AIUsageLog


class AIRepository:
    @staticmethod
    def get_all_providers():
        return AIProvider.objects.all().order_by('-is_default', 'name')

    @staticmethod
    def get_provider_by_id(provider_id):
        try:
            return AIProvider.objects.get(id=provider_id)
        except AIProvider.DoesNotExist:
            return None

    @staticmethod
    def get_default_provider():
        return AIProvider.objects.filter(is_active=True, is_default=True).first()

    @staticmethod
    def create_provider(name, provider, model, api_key_encrypted, config=None):
        return AIProvider.objects.create(
            name=name,
            provider=provider,
            model=model,
            api_key_encrypted=api_key_encrypted,
            config=config or {},
        )

    @staticmethod
    def update_provider(provider, **kwargs):
        for key, value in kwargs.items():
            setattr(provider, key, value)
        provider.save()
        return provider

    @staticmethod
    def set_default_provider(provider):
        AIProvider.objects.filter(is_default=True).update(is_default=False)
        provider.is_default = True
        provider.is_active = True
        provider.save(update_fields=['is_default', 'is_active'])
        return provider

    @staticmethod
    def get_all_templates():
        return AIPromptTemplate.objects.filter(is_active=True).order_by('name')

    @staticmethod
    def get_template_by_id(template_id):
        try:
            return AIPromptTemplate.objects.get(id=template_id)
        except AIPromptTemplate.DoesNotExist:
            return None

    @staticmethod
    def create_template(name, slug, system_prompt, user_prompt_template,
                        provider_id=None, description=None):
        return AIPromptTemplate.objects.create(
            name=name,
            slug=slug,
            system_prompt=system_prompt,
            user_prompt_template=user_prompt_template,
            provider_id=provider_id,
            description=description,
        )

    @staticmethod
    def log_usage(user, project, provider, prompt_tokens=0, completion_tokens=0,
                  total_tokens=0, response_time_ms=0, is_success=True, error_message=None):
        return AIUsageLog.objects.create(
            user=user,
            project=project,
            provider=provider,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            response_time_ms=response_time_ms,
            is_success=is_success,
            error_message=error_message,
        )

    @staticmethod
    def get_usage_stats(user, project_id=None):
        qs = AIUsageLog.objects.filter(user=user)
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs.aggregate(
            total_requests=Count('id'),
            total_tokens=Sum('total_tokens'),
            total_cost=Sum('cost_usd'),
            avg_response_time=Avg('response_time_ms'),
            successful=Count('id', filter=__import__('django.db.models', fromlist=['Q']).Q(is_success=True)),
        )