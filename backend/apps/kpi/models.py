import uuid
from django.db import models
from apps.core.models import TimeStampedModel
from apps.projects.models import Project
from apps.users.models import User


class KPI(TimeStampedModel):
    TYPE_CHOICES = [
        ('clicks', 'Total Clicks'),
        ('impressions', 'Total Impressions'),
        ('ctr', 'Average CTR'),
        ('position', 'Average Position'),
        ('keywords', 'Total Keywords'),
        ('pages', 'Total Pages'),
        ('custom', 'Custom'),
    ]

    PERIOD_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='kpis')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_kpis')
    name = models.CharField(max_length=255)
    kpi_type = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES, db_index=True)
    target_value = models.DecimalField(max_digits=15, decimal_places=4)
    current_value = models.DecimalField(max_digits=15, decimal_places=4, default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    alert_threshold_pct = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    formula = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'kpis'
        indexes = [
            models.Index(fields=['project', 'is_active']),
            models.Index(fields=['kpi_type', 'period']),
        ]

    def __str__(self):
        return f'{self.name} ({self.project.name})'

    @property
    def achievement_pct(self):
        if self.target_value == 0:
            return 0
        return float((self.current_value / self.target_value) * 100)


class KPIRecord(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kpi = models.ForeignKey(KPI, on_delete=models.CASCADE, related_name='records')
    date = models.DateField(db_index=True)
    value = models.DecimalField(max_digits=15, decimal_places=4)
    note = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'kpi_records'
        unique_together = ('kpi', 'date')
        indexes = [
            models.Index(fields=['kpi', 'date']),
        ]


class KPIAlert(TimeStampedModel):
    ALERT_TYPE_CHOICES = [
        ('below_target', 'Below Target'),
        ('above_target', 'Above Target'),
        ('threshold_breach', 'Threshold Breach'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kpi = models.ForeignKey(KPI, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPE_CHOICES, db_index=True)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'kpi_alerts'
        indexes = [
            models.Index(fields=['kpi', 'is_resolved']),
        ]