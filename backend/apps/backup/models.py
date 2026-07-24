import uuid
from django.db import models
from apps.core.models import TimeStampedModel
from apps.users.models import User


class BackupRecord(TimeStampedModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    TYPE_CHOICES = [
        ('manual', 'Manual'),
        ('scheduled', 'Scheduled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    backup_type = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    file_path = models.CharField(max_length=500, null=True, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    initiated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='backups'
    )
    error_message = models.TextField(null=True, blank=True)
    checksum = models.CharField(max_length=64, null=True, blank=True)

    class Meta:
        db_table = 'backup_records'
        indexes = [
            models.Index(fields=['status', 'backup_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.name} ({self.status})'