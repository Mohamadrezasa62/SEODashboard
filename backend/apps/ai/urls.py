from django.urls import path
from .views import (
    AIProviderListView, AIProviderDetailView, AIProviderSetDefaultView,
    AITemplateListView, SEOSuggestionView, AIUsageStatsView,
)

urlpatterns = [
    path('providers/', AIProviderListView.as_view(), name='ai-provider-list'),
    path('providers/<uuid:provider_id>/', AIProviderDetailView.as_view(), name='ai-provider-detail'),
    path('providers/<uuid:provider_id>/set-default/', AIProviderSetDefaultView.as_view(), name='ai-provider-default'),
    path('templates/', AITemplateListView.as_view(), name='ai-template-list'),
    path('projects/<uuid:project_id>/suggest/', SEOSuggestionView.as_view(), name='ai-suggest'),
    path('usage/', AIUsageStatsView.as_view(), name='ai-usage'),
]