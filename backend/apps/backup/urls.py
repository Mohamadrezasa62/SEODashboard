# from django.urls import path
# from .views import BackupListView, BackupDetailView

# urlpatterns = [
#     path('', BackupListView.as_view(), name='backup-list'),
#     path('<uuid:backup_id>/', BackupDetailView.as_view(), name='backup-detail'),
# ]

from django.urls import path
from .views import (
    BackupListView, BackupDetailView,
    BackupVerifyView, BackupRestoreView,
    RestoreListView,
)

urlpatterns = [
    path('', BackupListView.as_view(), name='backup-list'),
    path('<uuid:backup_id>/', BackupDetailView.as_view(), name='backup-detail'),
    path('<uuid:backup_id>/verify/', BackupVerifyView.as_view(), name='backup-verify'),
    path('<uuid:backup_id>/restore/', BackupRestoreView.as_view(), name='backup-restore'),
    path('restores/', RestoreListView.as_view(), name='restore-list'),
]