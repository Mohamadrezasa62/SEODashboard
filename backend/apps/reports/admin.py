from django.contrib import admin
from .models import Report, ScheduledReport


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'format', 'status', 'created_by', 'created_at')
    list_filter = ('format', 'status')
    search_fields = ('name', 'project__name')
    readonly_fields = ('created_at', 'generated_at')


@admin.register(ScheduledReport)
class ScheduledReportAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'frequency', 'format', 'is_active', 'next_run_at')
    list_filter = ('frequency', 'format', 'is_active')
    search_fields = ('name', 'project__name')