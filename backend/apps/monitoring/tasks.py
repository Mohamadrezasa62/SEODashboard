import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def log_task_start(self, task_name, task_id, args=None, kwargs=None, worker=None):
    from apps.monitoring.models import TaskLog
    TaskLog.objects.update_or_create(
        task_id=task_id,
        defaults={
            'task_name': task_name,
            'status': 'running',
            'args': args or [],
            'kwargs': kwargs or {},
            'started_at': timezone.now(),
            'worker': worker,
        },
    )


@shared_task(bind=True)
def log_task_success(self, task_id, result=None):
    from apps.monitoring.models import TaskLog
    try:
        log = TaskLog.objects.get(task_id=task_id)
        log.status = 'success'
        log.result = result
        log.finished_at = timezone.now()
        if log.started_at:
            log.duration_seconds = (log.finished_at - log.started_at).total_seconds()
        log.save(update_fields=['status', 'result', 'finished_at', 'duration_seconds'])
    except TaskLog.DoesNotExist:
        pass


@shared_task(bind=True)
def log_task_failure(self, task_id, error_message=None, traceback=None):
    from apps.monitoring.models import TaskLog
    try:
        log = TaskLog.objects.get(task_id=task_id)
        log.status = 'failed'
        log.error_message = error_message
        log.traceback = traceback
        log.finished_at = timezone.now()
        log.save(update_fields=['status', 'error_message', 'traceback', 'finished_at'])
    except TaskLog.DoesNotExist:
        pass


@shared_task
def cleanup_old_task_logs():
    from apps.monitoring.models import TaskLog
    cutoff = timezone.now() - timezone.timedelta(days=30)
    deleted, _ = TaskLog.objects.filter(
        created_at__lt=cutoff,
        status__in=['success', 'failed', 'revoked'],
    ).delete()
    logger.info('Cleaned up %d old task logs', deleted)
    return {'deleted': deleted}


@shared_task
def check_system_health():
    from apps.monitoring.models import SystemHealthLog
    from django.db import connection
    from django.core.cache import cache
    import time

    services = {}

    start = time.time()
    try:
        connection.ensure_connection()
        services['database'] = {
            'status': 'ok',
            'response_time_ms': int((time.time() - start) * 1000),
        }
    except Exception as e:
        services['database'] = {'status': 'error', 'error': str(e)}

    start = time.time()
    try:
        cache.set('health_ping', '1', timeout=5)
        cache.get('health_ping')
        services['redis'] = {
            'status': 'ok',
            'response_time_ms': int((time.time() - start) * 1000),
        }
    except Exception as e:
        services['redis'] = {'status': 'error', 'error': str(e)}

    for service_name, info in services.items():
        SystemHealthLog.objects.create(
            service=service_name,
            status=info['status'],
            response_time_ms=info.get('response_time_ms', 0),
            details=info,
        )

    logger.info('Health check completed: %s', services)
    return services