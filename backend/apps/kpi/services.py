from decimal import Decimal
from django.utils import timezone
from datetime import date, timedelta

from apps.core.exceptions import NotFoundException, PermissionDeniedException, ServiceException
from apps.projects.repositories import ProjectRepository, ProjectMemberRepository
from apps.users.repositories import ActivityLogRepository
from .repositories import KPIRepository, KPIRecordRepository, KPIAlertRepository


class KPIService:
    def _get_project_and_check_access(self, project_id, user):
        project = ProjectRepository.get_by_id(project_id)
        if not project:
            raise NotFoundException('Project not found.')
        if not ProjectMemberRepository.is_member(project, user):
            raise PermissionDeniedException('Access denied.')
        return project

    def _get_kpi_and_check_access(self, kpi_id, user):
        kpi = KPIRepository.get_by_id(kpi_id)
        if not kpi:
            raise NotFoundException('KPI not found.')
        if not ProjectMemberRepository.is_member(kpi.project, user):
            raise PermissionDeniedException('Access denied.')
        return kpi

    def list_kpis(self, project_id, user, active_only=True):
        project = self._get_project_and_check_access(project_id, user)
        return KPIRepository.get_project_kpis(project, active_only)

    def get_kpi(self, kpi_id, user):
        return self._get_kpi_and_check_access(kpi_id, user)

    def create_kpi(self, project_id, user, name, kpi_type, period, target_value, alert_threshold_pct=20):
        project = self._get_project_and_check_access(project_id, user)
        if user.role == 'employee':
            raise PermissionDeniedException('Employees cannot create KPIs.')
        kpi = KPIRepository.create(
            project=project,
            created_by=user,
            name=name,
            kpi_type=kpi_type,
            period=period,
            target_value=target_value,
            alert_threshold_pct=alert_threshold_pct,
        )
        ActivityLogRepository.log(
            user=user,
            action='create',
            description=f'Created KPI: {name}',
        )
        return kpi

    def update_kpi(self, kpi_id, user, data):
        kpi = self._get_kpi_and_check_access(kpi_id, user)
        if user.role == 'employee':
            raise PermissionDeniedException('Employees cannot update KPIs.')
        return KPIRepository.update(kpi, **data)

    def delete_kpi(self, kpi_id, user):
        kpi = self._get_kpi_and_check_access(kpi_id, user)
        if user.role == 'employee':
            raise PermissionDeniedException('Employees cannot delete KPIs.')
        KPIRepository.delete(kpi)
        ActivityLogRepository.log(
            user=user,
            action='delete',
            description=f'Deleted KPI: {kpi.name}',
        )

    def record_value(self, kpi_id, user, record_date, value, note=None):
        kpi = self._get_kpi_and_check_access(kpi_id, user)
        if user.role == 'employee':
            raise PermissionDeniedException('Employees cannot record KPI values.')

        record, created = KPIRecordRepository.create_or_update(
            kpi=kpi,
            date=record_date,
            value=value,
            note=note,
        )
        KPIRepository.update_current_value(kpi, value)
        self._check_and_create_alerts(kpi, value, user)
        return record

    def get_records(self, kpi_id, user, date_from=None, date_to=None):
        kpi = self._get_kpi_and_check_access(kpi_id, user)
        return KPIRecordRepository.get_kpi_records(kpi, date_from, date_to)

    def get_alerts(self, project_id, user):
        project = self._get_project_and_check_access(project_id, user)
        return KPIAlertRepository.get_unresolved_project_alerts(project)

    def resolve_alert(self, alert_id, user):
        try:
            from .models import KPIAlert
            alert = KPIAlert.objects.get(id=alert_id)
        except Exception:
            raise NotFoundException('Alert not found.')
        if not ProjectMemberRepository.is_member(alert.kpi.project, user):
            raise PermissionDeniedException('Access denied.')
        return KPIAlertRepository.resolve(alert)

    def _check_and_create_alerts(self, kpi, current_value, user):
        if kpi.target_value == 0:
            return

        achievement_pct = (Decimal(str(current_value)) / kpi.target_value) * 100
        threshold = Decimal(str(100)) - kpi.alert_threshold_pct

        if achievement_pct < threshold:
            alert = KPIAlertRepository.create(
                kpi=kpi,
                alert_type='below_target',
                message=f'KPI "{kpi.name}" is at {achievement_pct:.1f}% of target. Below threshold of {threshold}%.',
            )
            self._notify_kpi_alert(kpi, alert, user)

    def _notify_kpi_alert(self, kpi, alert, triggered_by):
        from apps.notifications.services import NotificationService
        service = NotificationService()
        members = kpi.project.members.filter(
            is_active=True,
            role__in=['manager'],
        ).select_related('user')
        for member in members:
            service.create_notification(
                recipient=member.user,
                sender=triggered_by,
                notification_type='kpi_alert',
                title=f'KPI Alert: {kpi.name}',
                body=alert.message,
                action_url=f'/projects/{kpi.project.id}/kpi/{kpi.id}',
                metadata={'kpi_id': str(kpi.id), 'alert_id': str(alert.id)},
            )