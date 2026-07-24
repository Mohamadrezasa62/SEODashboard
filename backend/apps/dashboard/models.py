import uuid
from django.db import models
from apps.core.models import TimeStampedModel
from apps.users.models import User
from apps.projects.models import Project


class Dashboard(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dashboards')
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, null=True, blank=True, related_name='dashboards'
    )
    is_default = models.BooleanField(default=False, db_index=True)
    is_shared = models.BooleanField(default=False, db_index=True)
    layout = models.JSONField(default=list)

    class Meta:
        db_table = 'dashboards'
        indexes = [
            models.Index(fields=['owner', 'is_default']),
        ]

    def __str__(self):
        return f'{self.name} ({self.owner.email})'


class Widget(TimeStampedModel):
    WIDGET_TYPE_CHOICES = [
        ('line_chart', 'Line Chart'),
        ('bar_chart', 'Bar Chart'),
        ('pie_chart', 'Pie Chart'),
        ('metric_card', 'Metric Card'),
        ('table', 'Table'),
        ('heatmap', 'Heatmap'),
        ('funnel', 'Funnel'),
        ('kpi_gauge', 'KPI Gauge'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE, related_name='widgets')
    name = models.CharField(max_length=255)
    widget_type = models.CharField(max_length=30, choices=WIDGET_TYPE_CHOICES, db_index=True)
    position_x = models.PositiveSmallIntegerField(default=0)
    position_y = models.PositiveSmallIntegerField(default=0)
    width = models.PositiveSmallIntegerField(default=6)
    height = models.PositiveSmallIntegerField(default=4)
    data_source = models.CharField(max_length=100)
    config = models.JSONField(default=dict)
    filters = models.JSONField(default=dict)

    class Meta:
        db_table = 'widgets'
        indexes = [
            models.Index(fields=['dashboard', 'widget_type']),
        ]

    def __str__(self):
        return f'{self.name} ({self.widget_type})'