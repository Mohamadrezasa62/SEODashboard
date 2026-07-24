import uuid
from django.db import models
from apps.core.models import TimeStampedModel
from apps.users.models import User
from apps.projects.models import Project


class Report(TimeStampedModel):
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('ready', 'Ready'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='reports')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    config = models.JSONField(default=dict)
    file = models.FileField(upload_to='reports/', null=True, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    date_from = models.DateField(null=True, blank=True)
    date_to = models.DateField(null=True, blank=True)
    generated_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'reports'
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['created_by', 'status']),
        ]

    def __str__(self):
        return f'{self.name} ({self.format})'


class ScheduledReport(TimeStampedModel):
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='scheduled_reports')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scheduled_reports')
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, db_index=True)
    format = models.CharField(max_length=10, choices=Report.FORMAT_CHOICES)
    config = models.JSONField(default=dict)
    recipients = models.JSONField(default=list)
    is_active = models.BooleanField(default=True, db_index=True)
    next_run_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_run_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'scheduled_reports'
        indexes = [
            models.Index(fields=['is_active', 'next_run_at']),
        ]