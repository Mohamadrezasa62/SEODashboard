# import os
# from celery import Celery

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

# app = Celery('seo_dashboard')
# app.config_from_object('django.conf:settings', namespace='CELERY')
# app.autodiscover_tasks()

# @app.task(bind=True, ignore_result=True)
# def debug_task(self):
#     print(f'Request: {self.request!r}')
import os
from celery import Celery
from celery.signals import task_prerun, task_postrun, task_failure, task_retry

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('seo_dashboard')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


@task_prerun.connect
def task_prerun_handler(task_id, task, args, kwargs, **extra):
    try:
        from apps.monitoring.models import TaskLog
        from django.utils import timezone
        TaskLog.objects.update_or_create(
            task_id=task_id,
            defaults={
                'task_name': task.name,
                'status': 'running',
                'args': list(args) if args else [],
                'kwargs': dict(kwargs) if kwargs else {},
                'started_at': timezone.now(),
            },
        )
    except Exception:
        pass


@task_postrun.connect
def task_postrun_handler(task_id, task, retval, state, **extra):
    try:
        from apps.monitoring.models import TaskLog
        from django.utils import timezone
        log = TaskLog.objects.filter(task_id=task_id).first()
        if log:
            log.status = 'success' if state == 'SUCCESS' else 'failed'
            log.finished_at = timezone.now()
            if log.started_at:
                log.duration_seconds = (log.finished_at - log.started_at).total_seconds()
            try:
                log.result = retval if isinstance(retval, (dict, list, str, int, float, bool, type(None))) else str(retval)
            except Exception:
                log.result = None
            log.save(update_fields=['status', 'finished_at', 'duration_seconds', 'result'])
    except Exception:
        pass


@task_failure.connect
def task_failure_handler(task_id, exception, traceback, **extra):
    try:
        from apps.monitoring.models import TaskLog
        from django.utils import timezone
        import traceback as tb
        log = TaskLog.objects.filter(task_id=task_id).first()
        if log:
            log.status = 'failed'
            log.error_message = str(exception)
            log.traceback = ''.join(tb.format_tb(traceback)) if traceback else None
            log.finished_at = timezone.now()
            log.save(update_fields=['status', 'error_message', 'traceback', 'finished_at'])
    except Exception:
        pass


@task_retry.connect
def task_retry_handler(request, reason, **extra):
    try:
        from apps.monitoring.models import TaskLog
        log = TaskLog.objects.filter(task_id=request.id).first()
        if log:
            log.status = 'retrying'
            log.retries = (log.retries or 0) + 1
            log.save(update_calls=['status', 'retries'])
    except Exception:
        pass


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')