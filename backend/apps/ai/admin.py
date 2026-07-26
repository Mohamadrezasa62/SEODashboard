from django.contrib import admin
from .models import AIProvider, AIPromptTemplate, AIUsageLog


@admin.register(AIProvider)
class AIProviderAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider', 'model', 'is_active', 'is_default', 'created_at')
    list_filter = ('provider', 'is_active', 'is_default')


@admin.register(AIPromptTemplate)
class AIPromptTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'provider', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug')


@admin.register(AIUsageLog)
class AIUsageLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'provider', 'total_tokens', 'is_success', 'created_at')
    list_filter = ('is_success', 'provider')
    search_fields = ('user__email',)