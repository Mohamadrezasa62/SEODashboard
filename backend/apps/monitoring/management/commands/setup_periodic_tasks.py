# from django.core.management.base import BaseCommand
# from django_celery_beat.models import PeriodicTask, CrontabSchedule, IntervalSchedule
# import json


# PERIODIC_TASKS = [
#     {
#         'name': 'Sync All Active GSC Projects',
#         'task': 'apps.gsc.tasks.sync_all_active_projects_task',
#         'crontab': {'minute': '0', 'hour': '3'},
#         'enabled': True,
#     },
#     {
#         'name': 'Run Scheduled Reports',
#         'task': 'apps.reports.tasks.run_scheduled_reports_task',
#         'crontab': {'minute': '0', 'hour': '*'},
#         'enabled': True,
#     },
#     {
#         'name': 'Daily Database Backup',
#         'task': 'apps.backup.tasks.scheduled_backup_task',
#         'crontab': {'minute': '0', 'hour': '2'},
#         'enabled': True,
#     },
#     {
#         'name': 'System Health Check',
#         'task': 'apps.monitoring.tasks.check_system_health',
#         'crontab': {'minute': '*/15', 'hour': '*'},
#         'enabled': True,
#     },
#     {
#         'name': 'Cleanup Old Task Logs',
#         'task': 'apps.monitoring.tasks.cleanup_old_task_logs',
#         'crontab': {'minute': '0', 'hour': '4'},
#         'enabled': True,
#     },
# ]


# class Command(BaseCommand):
#     help = 'Setup all periodic Celery Beat tasks'

#     def handle(self, *args, **options):
#         self.stdout.write('Setting up periodic tasks...')

#         for task_config in PERIODIC_TASKS:
#             crontab_config = task_config.get('crontab', {})
#             schedule, _ = CrontabSchedule.objects.get_or_create(
#                 minute=crontab_config.get('minute', '*'),
#                 hour=crontab_config.get('hour', '*'),
#                 day_of_week=crontab_config.get('day_of_week', '*'),
#                 day_of_month=crontab_config.get('day_of_month', '*'),
#                 month_of_year=crontab_config.get('month_of_year', '*'),
#             )

#             task, created = PeriodicTask.objects.get_or_create(
#                 name=task_config['name'],
#                 defaults={
#                     'task': task_config['task'],
#                     'crontab': schedule,
#                     'enabled': task_config.get('enabled', True),
#                     'args': json.dumps([]),
#                     'kwargs': json.dumps({}),
#                 },
#             )

#             if not created:
#                 task.crontab = schedule
#                 task.enabled = task_config.get('enabled', True)
#                 task.save(update_fields=['crontab', 'enabled'])

#             action = 'Created' if created else 'Updated'
#             self.stdout.write(f'  {action}: {task_config["name"]}')

#         self.stdout.write(
#             self.style.SUCCESS(f'Done. {len(PERIODIC_TASKS)} periodic tasks configured.')
#         )
from django.core.management.base import BaseCommand
from django_celery_beat.models import PeriodicTask, CrontabSchedule
import json


PERIODIC_TASKS = [
    {
        'name': 'Sync All Active GSC Projects',
        'task': 'apps.gsc.tasks.sync_all_active_projects_task',
        'crontab': {'minute': '0', 'hour': '3'},
        'enabled': True,
    },
    {
        'name': 'Run Scheduled Reports',
        'task': 'apps.reports.tasks.run_scheduled_reports_task',
        'crontab': {'minute': '0', 'hour': '*'},
        'enabled': True,
    },
    {
        'name': 'Daily Database Backup',
        'task': 'apps.backup.tasks.scheduled_backup_task',
        'crontab': {'minute': '0', 'hour': '2'},
        'enabled': True,
    },
    {
        'name': 'System Health Check',
        'task': 'apps.monitoring.tasks.check_system_health',
        'crontab': {'minute': '*/15', 'hour': '*'},
        'enabled': True,
    },
    {
        'name': 'Cleanup Old Task Logs',
        'task': 'apps.monitoring.tasks.cleanup_old_task_logs',
        'crontab': {'minute': '0', 'hour': '4'},
        'enabled': True,
    },
    {
        'name': 'Cleanup Old Backups',
        'task': 'apps.backup.tasks.cleanup_old_backups_task',
        'crontab': {'minute': '30', 'hour': '3'},
        'enabled': True,
        'kwargs': {'keep_count': 10},
    },
]


class Command(BaseCommand):
    help = 'Setup all periodic Celery Beat tasks'

    def handle(self, *args, **options):
        self.stdout.write('Setting up periodic tasks...')

        for task_config in PERIODIC_TASKS:
            crontab_config = task_config.get('crontab', {})
            schedule, _ = CrontabSchedule.objects.get_or_create(
                minute=crontab_config.get('minute', '*'),
                hour=crontab_config.get('hour', '*'),
                day_of_week=crontab_config.get('day_of_week', '*'),
                day_of_month=crontab_config.get('day_of_month', '*'),
                month_of_year=crontab_config.get('month_of_year', '*'),
            )

            task_kwargs = task_config.get('kwargs', {})
            task, created = PeriodicTask.objects.get_or_create(
                name=task_config['name'],
                defaults={
                    'task': task_config['task'],
                    'crontab': schedule,
                    'enabled': task_config.get('enabled', True),
                    'args': json.dumps([]),
                    'kwargs': json.dumps(task_kwargs),
                },
            )

            if not created:
                task.crontab = schedule
                task.enabled = task_config.get('enabled', True)
                task.kwargs = json.dumps(task_kwargs)
                task.save(update_fields=['crontab', 'enabled', 'kwargs'])

            action = 'Created' if created else 'Updated'
            self.stdout.write(f'  {action}: {task_config["name"]}')

        self.stdout.write(
            self.style.SUCCESS(f'Done. {len(PERIODIC_TASKS)} periodic tasks configured.')
        )