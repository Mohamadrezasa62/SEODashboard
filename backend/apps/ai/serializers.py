from rest_framework import serializers
from .models import AIProvider, AIPromptTemplate, AIUsageLog


class AIProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIProvider
        fields = (
            'id', 'name', 'provider', 'model',
            'is_active', 'is_default', 'config', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class CreateAIProviderSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    provider = serializers.ChoiceField(choices=['openai', 'anthropic', 'gemini'])
    model = serializers.CharField(max_length=100)
    api_key = serializers.CharField(write_only=True)
    config = serializers.JSONField(default=dict, required=False)


class UpdateAIProviderSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=False)
    model = serializers.CharField(max_length=100, required=False)
    api_key = serializers.CharField(write_only=True, required=False)
    is_active = serializers.BooleanField(required=False)
    config = serializers.JSONField(required=False)


class AIPromptTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIPromptTemplate
        fields = (
            'id', 'name', 'slug', 'description',
            'system_prompt', 'user_prompt_template',
            'provider', 'is_active', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class CreateAITemplateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    slug = serializers.SlugField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    system_prompt = serializers.CharField()
    user_prompt_template = serializers.CharField()
    provider_id = serializers.UUIDField(required=False, allow_null=True)


class SEOSuggestionSerializer(serializers.Serializer):
    keyword = serializers.CharField(max_length=500)
    context = serializers.CharField(required=False, allow_blank=True)


class AIUsageStatsSerializer(serializers.Serializer):
    total_requests = serializers.IntegerField()
    total_tokens = serializers.IntegerField()
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=6, allow_null=True)
    avg_response_time = serializers.FloatField(allow_null=True)
    successful = serializers.IntegerField()