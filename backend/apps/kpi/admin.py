from django.contrib import admin
from .models import KPI, KPIRecord, KPIAlert


@admin.register(KPI)
class KPIAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'kpi_type', 'period', 'target_value', 'current_value', 'is_active')
    list_filter = ('kpi_type', 'period', 'is_active')
    search_fields = ('name', 'project__name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(KPIRecord)
class KPIRecordAdmin(admin.ModelAdmin):
    list_display = ('kpi', 'date', 'value', 'created_at')
    list_filter = ('date',)
    search_fields = ('kpi__name',)


@admin.register(KPIAlert)
class KPIAlertAdmin(admin.ModelAdmin):
    list_display = ('kpi', 'alert_type', 'is_resolved', 'created_at')
    list_filter = ('alert_type', 'is_resolved')
    search_fields = ('kpi__name',)