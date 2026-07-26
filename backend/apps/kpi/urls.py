from django.urls import path
from .views import (
    KPIListView, KPIDetailView,
    KPIRecordView, KPIAlertsView, KPIAlertResolveView,
)

urlpatterns = [
    path('projects/<uuid:project_id>/kpis/', KPIListView.as_view(), name='kpi-list'),
    path('kpis/<uuid:kpi_id>/', KPIDetailView.as_view(), name='kpi-detail'),
    path('kpis/<uuid:kpi_id>/records/', KPIRecordView.as_view(), name='kpi-records'),
    path('projects/<uuid:project_id>/kpi-alerts/', KPIAlertsView.as_view(), name='kpi-alerts'),
    path('kpi-alerts/<uuid:alert_id>/resolve/', KPIAlertResolveView.as_view(), name='kpi-alert-resolve'),
]