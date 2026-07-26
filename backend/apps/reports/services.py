import logging
from django.utils import timezone
from apps.core.exceptions import NotFoundException, PermissionDeniedException
from apps.projects.repositories import ProjectRepository, ProjectMemberRepository
from apps.users.repositories import ActivityLogRepository
from .repositories import ReportRepository, ScheduledReportRepository
from .tasks import generate_report_task

logger = logging.getLogger(__name__)


class ReportService:
    def _get_project_and_check_access(self, project_id, user):
        project = ProjectRepository.get_by_id(project_id)
        if not project:
            raise NotFoundException('Project not found.')
        if not ProjectMemberRepository.is_member(project, user):
            raise PermissionDeniedException('Access denied.')
        return project

    def list_reports(self, project_id, user):
        project = self._get_project_and_check_access(project_id, user)
        if user.role == 'employee':
            return ReportRepository.get_user_reports(project, user)
        return ReportRepository.get_project_reports(project)

    def get_report(self, report_id, user):
        report = ReportRepository.get_by_id(report_id)
        if not report:
            raise NotFoundException('Report not found.')
        if not ProjectMemberRepository.is_member(report.project, user):
            raise PermissionDeniedException('Access denied.')
        if user.role == 'employee' and report.created_by != user:
            raise PermissionDeniedException('Access denied.')
        return report

    def create_report(self, project_id, user, name, format, config, date_from=None, date_to=None):
        project = self._get_project_and_check_access(project_id, user)
        report = ReportRepository.create(
            project=project,
            created_by=user,
            name=name,
            format=format,
            config=config,
            date_from=date_from,
            date_to=date_to,
        )
        generate_report_task.delay(str(report.id))
        ActivityLogRepository.log(
            user=user,
            action='create',
            description=f'Created report: {name}',
        )
        return report

    def delete_report(self, report_id, user):
        report = self.get_report(report_id, user)
        if report.file:
            report.file.delete(save=False)
        report.delete()

    def create_scheduled_report(self, project_id, user, name, frequency, format,
                                config, recipients):
        if user.role == 'employee':
            raise PermissionDeniedException('Employees cannot create scheduled reports.')
        project = self._get_project_and_check_access(project_id, user)
        scheduled = ScheduledReportRepository.create(
            project=project,
            created_by=user,
            name=name,
            frequency=frequency,
            format=format,
            config=config,
            recipients=recipients,
        )
        return scheduled

    def list_scheduled_reports(self, project_id, user):
        project = self._get_project_and_check_access(project_id, user)
        return ScheduledReportRepository.get_project_scheduled(project)

    def toggle_scheduled_report(self, scheduled_id, user, active):
        scheduled = ScheduledReportRepository.get_by_id(scheduled_id)
        if not scheduled:
            raise NotFoundException('Scheduled report not found.')
        if not ProjectMemberRepository.is_member(scheduled.project, user):
            raise PermissionDeniedException('Access denied.')
        if user.role == 'employee':
            raise PermissionDeniedException('Access denied.')
        return ScheduledReportRepository.toggle(scheduled, active)

    def delete_scheduled_report(self, scheduled_id, user):
        scheduled = ScheduledReportRepository.get_by_id(scheduled_id)
        if not scheduled:
            raise NotFoundException('Scheduled report not found.')
        if not ProjectMemberRepository.is_member(scheduled.project, user):
            raise PermissionDeniedException('Access denied.')
        scheduled.delete()