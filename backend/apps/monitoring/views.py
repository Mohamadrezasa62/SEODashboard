# from rest_framework.views import APIView
# from rest_framework.permissions import AllowAny
# from django.db import connection
# from django.core.cache import cache
# from apps.core.mixins import ResponseMixin
# from apps.core.permissions import IsDeveloper
# from .serializers import AuditLogSerializer, SystemHealthSerializer
# from .services import MonitoringService


# class HealthCheckView(ResponseMixin, APIView):
#     permission_classes = [AllowAny]

#     def get(self, request):
#         health = {'status': 'ok', 'services': {}}

#         try:
#             connection.ensure_connection()
#             health['services']['database'] = 'ok'
#         except Exception as e:
#             health['services']['database'] = f'error: {str(e)}'
#             health['status'] = 'degraded'

#         try:
#             cache.set('health_check', '1', timeout=5)
#             cache.get('health_check')
#             health['services']['redis'] = 'ok'
#         except Exception as e:
#             health['services']['redis'] = f'error: {str(e)}'
#             health['status'] = 'degraded'

#         return self.success_response(data=health)


# class AuditLogListView(ResponseMixin, APIView):
#     permission_classes = [IsDeveloper]

#     def get(self, request):
#         service = MonitoringService()
#         user_id = request.query_params.get('user_id')
#         model_name = request.query_params.get('model_name')
#         action = request.query_params.get('action')
#         logs = service.get_audit_logs(
#             user_id=user_id,
#             model_name=model_name,
#             action=action,
#         )
#         serializer = AuditLogSerializer(logs, many=True)
#         return self.success_response(data=serializer.data)


# class SystemStatsView(ResponseMixin, APIView):
#     permission_classes = [IsDeveloper]

#     def get(self, request):
#         service = MonitoringService()
#         stats = service.get_system_stats()
#         return self.success_response(data=stats)

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db import connection
from django.core.cache import cache
from django.utils import timezone
from apps.core.mixins import ResponseMixin
from apps.core.permissions import IsDeveloper
from .serializers import AuditLogSerializer, SystemHealthSerializer, TaskLogSerializer
from .services import MonitoringService
from .models import TaskLog


class HealthCheckView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        health = {'status': 'ok', 'services': {}}
        try:
            connection.ensure_connection()
            health['services']['database'] = 'ok'
        except Exception as e:
            health['services']['database'] = f'error: {str(e)}'
            health['status'] = 'degraded'
        try:
            cache.set('health_check', '1', timeout=5)
            cache.get('health_check')
            health['services']['redis'] = 'ok'
        except Exception as e:
            health['services']['redis'] = f'error: {str(e)}'
            health['status'] = 'degraded'
        return self.success_response(data=health)


class AuditLogListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        service = MonitoringService()
        user_id = request.query_params.get('user_id')
        model_name = request.query_params.get('model_name')
        action = request.query_params.get('action')
        logs = service.get_audit_logs(
            user_id=user_id,
            model_name=model_name,
            action=action,
        )
        serializer = AuditLogSerializer(logs, many=True)
        return self.success_response(data=serializer.data)


class SystemStatsView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        service = MonitoringService()
        stats = service.get_system_stats()
        return self.success_response(data=stats)


class TaskLogListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        status_filter = request.query_params.get('status')
        task_name = request.query_params.get('task_name')
        limit = int(request.query_params.get('limit', 50))

        qs = TaskLog.objects.all().order_by('-created_at')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if task_name:
            qs = qs.filter(task_name__icontains=task_name)

        qs = qs[:limit]
        serializer = TaskLogSerializer(qs, many=True)
        return self.success_response(data=serializer.data)


class TaskLogDetailView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request, task_id):
        try:
            log = TaskLog.objects.get(task_id=task_id)
        except TaskLog.DoesNotExist:
            return self.error_response(message='Task not found.', status_code=404)
        return self.success_response(data=TaskLogSerializer(log).data)


class TaskStatsView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        from django.db.models import Count, Avg
        stats = TaskLog.objects.aggregate(
            total=Count('id'),
            success=Count('id', filter=__import__('django.db.models', fromlist=['Q']).Q(status='success')),
            failed=Count('id', filter=__import__('django.db.models', fromlist=['Q']).Q(status='failed')),
            running=Count('id', filter=__import__('django.db.models', fromlist=['Q']).Q(status='running')),
            avg_duration=Avg('duration_seconds'),
        )

        last_24h = TaskLog.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(hours=24)
        ).values('status').annotate(count=Count('id'))

        by_name = TaskLog.objects.values('task_name').annotate(
            count=Count('id'),
            success_count=Count('id', filter=__import__('django.db.models', fromlist=['Q']).Q(status='success')),
            fail_count=Count('id', filter=__import__('django.db.models', fromlist=['Q']).Q(status='failed')),
        ).order_by('-count')[:10]

        return self.success_response(data={
            'overall': stats,
            'last_24h': list(last_24h),
            'by_task': list(by_name),
        })


class PeriodicTaskListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        from django_celery_beat.models import PeriodicTask, CrontabSchedule
        tasks = PeriodicTask.objects.select_related('crontab', 'interval').order_by('name')
        data = []
        for task in tasks:
            schedule_str = ''
            if task.crontab:
                c = task.crontab
                schedule_str = f'{c.minute} {c.hour} {c.day_of_month} {c.month_of_year} {c.day_of_week}'
            elif task.interval:
                schedule_str = f'every {task.interval.every} {task.interval.period}'

            data.append({
                'id': task.id,
                'name': task.name,
                'task': task.task,
                'enabled': task.enabled,
                'schedule': schedule_str,
                'last_run_at': task.last_run_at,
                'total_run_count': task.total_run_count,
                'args': task.args,
                'kwargs': task.kwargs,
            })
        return self.success_response(data=data)

    def patch(self, request, task_id):
        from django_celery_beat.models import PeriodicTask
        try:
            task = PeriodicTask.objects.get(id=task_id)
        except PeriodicTask.DoesNotExist:
            return self.error_response(message='Task not found.', status_code=404)

        enabled = request.data.get('enabled')
        if enabled is not None:
            task.enabled = enabled
            task.save(update_fields=['enabled'])

        return self.success_response(data={'id': task.id, 'enabled': task.enabled})