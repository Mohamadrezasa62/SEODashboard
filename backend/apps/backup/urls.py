from django.urls import path
from .views import BackupListView, BackupDetailView

urlpatterns = [
    path('', BackupListView.as_view(), name='backup-list'),
    path('<uuid:backup_id>/', BackupDetailView.as_view(), name='backup-detail'),
]