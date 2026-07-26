from django.contrib import admin
from .models import AuditLog, SystemHealthLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'model_name', 'object_id', 'ip_address', 'created_at')
    list_filter = ('action', 'model_name')
    search_fields = ('user__email', 'model_name', 'object_id')
    readonly_fields = ('created_at',)


@admin.register(SystemHealthLog)
class SystemHealthLogAdmin(admin.ModelAdmin):
    list_display = ('service', 'status', 'response_time_ms', 'created_at')
    list_filter = ('service', 'status')