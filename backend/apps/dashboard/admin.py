from django.contrib import admin
from .models import Dashboard, Widget


@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'project', 'is_default', 'is_shared', 'created_at')
    list_filter = ('is_default', 'is_shared')
    search_fields = ('name', 'owner__email')


@admin.register(Widget)
class WidgetAdmin(admin.ModelAdmin):
    list_display = ('name', 'dashboard', 'widget_type', 'data_source', 'created_at')
    list_filter = ('widget_type',)
    search_fields = ('name', 'dashboard__name')