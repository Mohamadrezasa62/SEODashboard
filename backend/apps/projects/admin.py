from django.contrib import admin
from .models import Project, ProjectMember, ProjectSettings


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'domain', 'status', 'owner', 'created_at')
    list_filter = ('status',)
    search_fields = ('name', 'domain', 'owner__email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ('project', 'user', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active')
    search_fields = ('user__email', 'project__name')


@admin.register(ProjectSettings)
class ProjectSettingsAdmin(admin.ModelAdmin):
    list_display = ('project', 'gsc_connected', 'sync_frequency_hours', 'last_sync_at')