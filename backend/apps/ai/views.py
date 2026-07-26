from rest_framework import status
from rest_framework.views import APIView
from apps.core.mixins import ResponseMixin
from apps.core.permissions import IsDeveloper
from .serializers import (
    AIProviderSerializer, CreateAIProviderSerializer, UpdateAIProviderSerializer,
    AIPromptTemplateSerializer, CreateAITemplateSerializer,
    SEOSuggestionSerializer, AIUsageStatsSerializer,
)
from .services import AIService


class AIProviderListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        service = AIService()
        providers = service.list_providers()
        serializer = AIProviderSerializer(providers, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request):
        serializer = CreateAIProviderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AIService()
        provider = service.create_provider(request.user, **serializer.validated_data)
        return self.success_response(
            data=AIProviderSerializer(provider).data,
            status_code=status.HTTP_201_CREATED,
        )


class AIProviderDetailView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def patch(self, request, provider_id):
        serializer = UpdateAIProviderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AIService()
        provider = service.update_provider(provider_id, request.user, serializer.validated_data)
        return self.success_response(data=AIProviderSerializer(provider).data)

    def delete(self, request, provider_id):
        service = AIService()
        service.delete_provider(provider_id, request.user)
        return self.success_response(message='Provider deleted.')


class AIProviderSetDefaultView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def post(self, request, provider_id):
        service = AIService()
        provider = service.set_default_provider(provider_id, request.user)
        return self.success_response(
            data=AIProviderSerializer(provider).data,
            message='Default provider set.',
        )


class AITemplateListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        service = AIService()
        templates = service.list_templates()
        serializer = AIPromptTemplateSerializer(templates, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request):
        serializer = CreateAITemplateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AIService()
        template = service.create_template(request.user, **serializer.validated_data)
        return self.success_response(
            data=AIPromptTemplateSerializer(template).data,
            status_code=status.HTTP_201_CREATED,
        )


class SEOSuggestionView(ResponseMixin, APIView):
    def post(self, request, project_id):
        serializer = SEOSuggestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = AIService()
        suggestion = service.generate_seo_suggestion(
            project_id=project_id,
            user=request.user,
            keyword=serializer.validated_data['keyword'],
            context=serializer.validated_data.get('context'),
        )
        return self.success_response(data={'suggestion': suggestion})


class AIUsageStatsView(ResponseMixin, APIView):
    def get(self, request):
        project_id = request.query_params.get('project_id')
        service = AIService()
        stats = service.get_usage_stats(request.user, project_id)
        serializer = AIUsageStatsSerializer(stats)
        return self.success_response(data=serializer.data)