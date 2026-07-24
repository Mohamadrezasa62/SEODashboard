import uuid
from django.db import models
from apps.core.models import TimeStampedModel
from apps.users.models import User


class AuditLog(TimeStampedModel):
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('export', 'Export'),
        ('permission_change', 'Permission Change'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs'
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES, db_index=True)
    model_name = models.CharField(max_length=100, db_index=True)
    object_id = models.CharField(max_length=36, null=True, blank=True, db_index=True)
    object_repr = models.CharField(max_length=500, null=True, blank=True)
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['user', 'action']),
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.action} on {self.model_name} by {self.user}'


class SystemHealthLog(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.CharField(max_length=50, db_index=True)
    status = models.CharField(max_length=20, db_index=True)
    response_time_ms = models.PositiveIntegerField(default=0)
    details = models.JSONField(default=dict)
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'system_health_logs'
        indexes = [
            models.Index(fields=['service', 'status']),
            models.Index(fields=['created_at']),
        ]