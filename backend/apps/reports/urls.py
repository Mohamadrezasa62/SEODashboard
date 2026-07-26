from django.urls import path
from .views import (
    ReportListView, ReportDetailView,
    ScheduledReportListView, ScheduledReportDetailView,
)

urlpatterns = [
    path('projects/<uuid:project_id>/', ReportListView.as_view(), name='report-list'),
    path('<uuid:report_id>/', ReportDetailView.as_view(), name='report-detail'),
    path('projects/<uuid:project_id>/scheduled/', ScheduledReportListView.as_view(), name='scheduled-report-list'),
    path('scheduled/<uuid:scheduled_id>/', ScheduledReportDetailView.as_view(), name='scheduled-report-detail'),
]