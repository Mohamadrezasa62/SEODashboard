from django.utils import timezone
from .models import GSCCredential, GSCSyncLog
from apps.projects.models import Project
from apps.users.models import User


class GSCCredentialRepository:
    @staticmethod
    def get_by_project(project):
        try:
            return GSCCredential.objects.get(project=project, is_active=True)
        except GSCCredential.DoesNotExist:
            return None

    @staticmethod
    def create_or_update(project, user, access_token, refresh_token, token_expiry, site_url):
        obj, created = GSCCredential.objects.update_or_create(
            project=project,
            defaults={
                'user': user,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_expiry': token_expiry,
                'site_url': site_url,
                'is_active': True,
            },
        )
        return obj, created

    @staticmethod
    def deactivate(credential):
        credential.is_active = False
        credential.save(update_fields=['is_active'])


class GSCSyncLogRepository:
    @staticmethod
    def create(project, date_range_start=None, date_range_end=None):
        return GSCSyncLog.objects.create(
            project=project,
            status='pending',
            date_range_start=date_range_start,
            date_range_end=date_range_end,
        )

    @staticmethod
    def mark_running(sync_log):
        sync_log.status = 'running'
        sync_log.started_at = timezone.now()
        sync_log.save(update_fields=['status', 'started_at'])

    @staticmethod
    def mark_success(sync_log, rows_synced):
        sync_log.status = 'success'
        sync_log.finished_at = timezone.now()
        sync_log.rows_synced = rows_synced
        sync_log.save(update_fields=['status', 'finished_at', 'rows_synced'])

    @staticmethod
    def mark_failed(sync_log, error_message):
        sync_log.status = 'failed'
        sync_log.finished_at = timezone.now()
        sync_log.error_message = error_message
        sync_log.save(update_fields=['status', 'finished_at', 'error_message'])

    @staticmethod
    def get_project_logs(project, limit=20):
        return GSCSyncLog.objects.filter(project=project).order_by('-created_at')[:limit]

    @staticmethod
    def get_last_successful(project):
        return GSCSyncLog.objects.filter(
            project=project, status='success'
        ).order_by('-created_at').first()