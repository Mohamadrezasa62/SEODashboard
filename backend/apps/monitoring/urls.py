from django.urls import path
from .views import HealthCheckView, AuditLogListView, SystemStatsView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs'),
    path('stats/', SystemStatsView.as_view(), name='system-stats'),
]