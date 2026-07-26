from django.utils import timezone
from django.db.models import Avg, Max, Min
from .models import KPI, KPIRecord, KPIAlert
from apps.projects.models import Project


class KPIRepository:
    @staticmethod
    def get_by_id(kpi_id):
        try:
            return KPI.objects.get(id=kpi_id)
        except KPI.DoesNotExist:
            return None

    @staticmethod
    def get_project_kpis(project, active_only=True):
        qs = KPI.objects.filter(project=project).select_related('created_by')
        if active_only:
            qs = qs.filter(is_active=True)
        return qs.order_by('-created_at')

    @staticmethod
    def create(project, created_by, name, kpi_type, period, target_value, alert_threshold_pct=20):
        return KPI.objects.create(
            project=project,
            created_by=created_by,
            name=name,
            kpi_type=kpi_type,
            period=period,
            target_value=target_value,
            alert_threshold_pct=alert_threshold_pct,
        )

    @staticmethod
    def update(kpi, **kwargs):
        for key, value in kwargs.items():
            setattr(kpi, key, value)
        kpi.save()
        return kpi

    @staticmethod
    def update_current_value(kpi, value):
        kpi.current_value = value
        kpi.save(update_fields=['current_value'])
        return kpi

    @staticmethod
    def delete(kpi):
        kpi.delete()


class KPIRecordRepository:
    @staticmethod
    def get_kpi_records(kpi, date_from=None, date_to=None):
        qs = KPIRecord.objects.filter(kpi=kpi).order_by('date')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs

    @staticmethod
    def create_or_update(kpi, date, value, note=None):
        obj, created = KPIRecord.objects.update_or_create(
            kpi=kpi,
            date=date,
            defaults={'value': value, 'note': note},
        )
        return obj, created

    @staticmethod
    def get_latest(kpi):
        return KPIRecord.objects.filter(kpi=kpi).order_by('-date').first()

    @staticmethod
    def get_stats(kpi):
        return KPIRecord.objects.filter(kpi=kpi).aggregate(
            avg_value=Avg('value'),
            max_value=Max('value'),
            min_value=Min('value'),
        )


class KPIAlertRepository:
    @staticmethod
    def create(kpi, alert_type, message):
        return KPIAlert.objects.create(
            kpi=kpi,
            alert_type=alert_type,
            message=message,
        )

    @staticmethod
    def get_kpi_alerts(kpi, unresolved_only=False):
        qs = KPIAlert.objects.filter(kpi=kpi).order_by('-created_at')
        if unresolved_only:
            qs = qs.filter(is_resolved=False)
        return qs

    @staticmethod
    def resolve(alert):
        alert.is_resolved = True
        alert.resolved_at = timezone.now()
        alert.save(update_fields=['is_resolved', 'resolved_at'])
        return alert

    @staticmethod
    def get_unresolved_project_alerts(project):
        return KPIAlert.objects.filter(
            kpi__project=project,
            is_resolved=False,
        ).select_related('kpi').order_by('-created_at')