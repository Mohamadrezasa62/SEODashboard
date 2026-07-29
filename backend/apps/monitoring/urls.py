# from django.urls import path
# from .views import HealthCheckView, AuditLogListView, SystemStatsView

# urlpatterns = [
#     path('health/', HealthCheckView.as_view(), name='health-check'),
#     path('audit-logs/', AuditLogListView.as_view(), name='audit-logs'),
#     path('stats/', SystemStatsView.as_view(), name='system-stats'),
# ]

from django.urls import path
from .views import (
    HealthCheckView, AuditLogListView, SystemStatsView,
    TaskLogListView, TaskLogDetailView, TaskStatsView,
    PeriodicTaskListView,
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs'),
    path('stats/', SystemStatsView.as_view(), name='system-stats'),
    path('tasks/', TaskLogListView.as_view(), name='task-log-list'),
    path('tasks/<str:task_id>/', TaskLogDetailView.as_view(), name='task-log-detail'),
    path('task-stats/', TaskStatsView.as_view(), name='task-stats'),
    path('periodic-tasks/', PeriodicTaskListView.as_view(), name='periodic-task-list'),
    path('periodic-tasks/<int:task_id>/', PeriodicTaskListView.as_view(), name='periodic-task-detail'),
]