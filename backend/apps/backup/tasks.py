import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def scheduled_backup_task():
    from apps.backup.services import BackupService
    try:
        service = BackupService()
        record = service.create_backup(user=None, backup_type='scheduled')
        logger.info('Scheduled backup completed: %s', record.name)
        return {'status': 'success', 'backup_id': str(record.id)}
    except Exception as e:
        logger.error('Scheduled backup failed: %s', e)
        raise