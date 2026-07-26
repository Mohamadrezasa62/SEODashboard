from django.urls import path
from .views import (
    DashboardListView, DashboardDetailView,
    DashboardSetDefaultView, DashboardLayoutView,
    WidgetListView, WidgetDetailView,
)

urlpatterns = [
    path('', DashboardListView.as_view(), name='dashboard-list'),
    path('<uuid:dashboard_id>/', DashboardDetailView.as_view(), name='dashboard-detail'),
    path('<uuid:dashboard_id>/set-default/', DashboardSetDefaultView.as_view(), name='dashboard-set-default'),
    path('<uuid:dashboard_id>/layout/', DashboardLayoutView.as_view(), name='dashboard-layout'),
    path('<uuid:dashboard_id>/widgets/', WidgetListView.as_view(), name='widget-list'),
    path('widgets/<uuid:widget_id>/', WidgetDetailView.as_view(), name='widget-detail'),
]