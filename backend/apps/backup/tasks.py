# import logging
# from celery import shared_task

# logger = logging.getLogger(__name__)


# @shared_task
# def scheduled_backup_task():
#     from apps.backup.services import BackupService
#     try:
#         service = BackupService()
#         record = service.create_backup(user=None, backup_type='scheduled')
#         logger.info('Scheduled backup completed: %s', record.name)
#         return {'status': 'success', 'backup_id': str(record.id)}
#     except Exception as e:
#         logger.error('Scheduled backup failed: %s', e)
#         raise

import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2)
def scheduled_backup_task(self):
    from apps.backup.services import BackupService
    try:
        service = BackupService()
        record = service.create_backup(user=None, backup_type='scheduled')
        logger.info('Scheduled backup completed: %s', record.name)
        return {'status': 'success', 'backup_id': str(record.id)}
    except Exception as e:
        logger.error('Scheduled backup failed: %s', e)
        raise self.retry(exc=e, countdown=300)


@shared_task(bind=True, max_retries=1)
def verify_backup_task(self, backup_id):
    from apps.backup.services import BackupService
    try:
        service = BackupService()
        record = service.verify_backup(backup_id)
        logger.info('Backup verified: %s', record.name)
        return {'status': 'verified', 'backup_id': str(record.id)}
    except Exception as e:
        logger.error('Backup verification failed: %s', e)
        raise self.retry(exc=e, countdown=60)


@shared_task
def cleanup_old_backups_task(keep_count=10):
    from apps.backup.repositories import BackupRepository
    import os
    backups = list(BackupRepository.get_successful())
    to_delete = backups[keep_count:]

    deleted_count = 0
    for backup in to_delete:
        try:
            if backup.file_path and os.path.exists(backup.file_path):
                os.remove(backup.file_path)
            backup.delete()
            deleted_count += 1
        except Exception as e:
            logger.error('Failed to delete backup %s: %s', backup.id, e)

    logger.info('Cleaned up %d old backups', deleted_count)
    return {'deleted': deleted_count}