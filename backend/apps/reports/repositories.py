from django.utils import timezone
from datetime import timedelta
from .models import Report, ScheduledReport


class ReportRepository:
    @staticmethod
    def get_by_id(report_id):
        try:
            return Report.objects.get(id=report_id)
        except Report.DoesNotExist:
            return None

    @staticmethod
    def get_project_reports(project):
        return Report.objects.filter(project=project).order_by('-created_at')

    @staticmethod
    def get_user_reports(project, user):
        return Report.objects.filter(project=project, created_by=user).order_by('-created_at')

    @staticmethod
    def create(project, created_by, name, format, config, date_from=None, date_to=None):
        return Report.objects.create(
            project=project,
            created_by=created_by,
            name=name,
            format=format,
            config=config,
            date_from=date_from,
            date_to=date_to,
            status='pending',
        )

    @staticmethod
    def mark_generating(report):
        report.status = 'generating'
        report.save(update_fields=['status'])

    @staticmethod
    def mark_ready(report, file_path, file_size):
        report.status = 'ready'
        report.file = file_path
        report.file_size = file_size
        report.generated_at = timezone.now()
        report.save(update_fields=['status', 'file', 'file_size', 'generated_at'])

    @staticmethod
    def mark_failed(report, error_message):
        report.status = 'failed'
        report.error_message = error_message
        report.save(update_fields=['status', 'error_message'])


class ScheduledReportRepository:
    @staticmethod
    def get_by_id(scheduled_id):
        try:
            return ScheduledReport.objects.get(id=scheduled_id)
        except ScheduledReport.DoesNotExist:
            return None

    @staticmethod
    def get_project_scheduled(project):
        return ScheduledReport.objects.filter(project=project).order_by('-created_at')

    @staticmethod
    def get_due_reports():
        return ScheduledReport.objects.filter(
            is_active=True,
            next_run_at__lte=timezone.now(),
        ).select_related('project', 'created_by')

    @staticmethod
    def create(project, created_by, name, frequency, format, config, recipients):
        from datetime import datetime
        next_run = timezone.now() + timedelta(days=1)
        return ScheduledReport.objects.create(
            project=project,
            created_by=created_by,
            name=name,
            frequency=frequency,
            format=format,
            config=config,
            recipients=recipients,
            next_run_at=next_run,
        )

    @staticmethod
    def update_next_run(scheduled):
        freq_map = {
            'daily': timedelta(days=1),
            'weekly': timedelta(weeks=1),
            'monthly': timedelta(days=30),
        }
        delta = freq_map.get(scheduled.frequency, timedelta(days=1))
        scheduled.last_run_at = timezone.now()
        scheduled.next_run_at = timezone.now() + delta
        scheduled.save(update_fields=['last_run_at', 'next_run_at'])

    @staticmethod
    def toggle(scheduled, active):
        scheduled.is_active = active
        scheduled.save(update_fields=['is_active'])
        return scheduled