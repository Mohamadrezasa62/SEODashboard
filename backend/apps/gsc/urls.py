from django.urls import path
from .views import (
    GSCConnectView, GSCDisconnectView,
    GSCSitesView, GSCSyncView, GSCSyncLogsView,
)

urlpatterns = [
    path('<uuid:project_id>/connect/', GSCConnectView.as_view(), name='gsc-connect'),
    path('<uuid:project_id>/disconnect/', GSCDisconnectView.as_view(), name='gsc-disconnect'),
    path('<uuid:project_id>/sites/', GSCSitesView.as_view(), name='gsc-sites'),
    path('<uuid:project_id>/sync/', GSCSyncView.as_view(), name='gsc-sync'),
    path('<uuid:project_id>/sync/logs/', GSCSyncLogsView.as_view(), name='gsc-sync-logs'),
]