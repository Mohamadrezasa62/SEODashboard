import logging
from celery import shared_task
from datetime import date, timedelta

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def sync_gsc_data_task(self, project_id, start_date_str=None, end_date_str=None):
    from apps.gsc.services import GSCService
    try:
        service = GSCService()
        start_date = date.fromisoformat(start_date_str) if start_date_str else None
        end_date = date.fromisoformat(end_date_str) if end_date_str else None
        sync_log = service.sync_project(project_id, start_date, end_date)
        if sync_log:
            return {'status': 'success', 'rows_synced': sync_log.rows_synced}
        return {'status': 'skipped'}
    except Exception as exc:
        logger.error('GSC sync task failed for project %s: %s', project_id, exc)
        raise self.retry(exc=exc)


@shared_task
def sync_all_active_projects_task():
    from apps.projects.models import Project
    from apps.gsc.services import GSCService
    projects = Project.objects.filter(
        status='active',
        deleted_at__isnull=True,
        project_settings__gsc_connected=True,
    ).select_related('project_settings')

    service = GSCService()
    for project in projects:
        try:
            sync_gsc_data_task.delay(str(project.id))
            logger.info('Queued GSC sync for project %s', project.name)
        except Exception as e:
            logger.error('Failed to queue sync for project %s: %s', project.name, e)