import uuid
from django.db import models
from apps.core.models import TimeStampedModel, SoftDeleteModel
from apps.users.models import User


class Project(TimeStampedModel, SoftDeleteModel):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(null=True, blank=True)
    domain = models.CharField(max_length=255, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', db_index=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_projects')
    settings = models.JSONField(default=dict)
    logo = models.ImageField(upload_to='project_logos/', null=True, blank=True)

    class Meta:
        db_table = 'projects'
        indexes = [
            models.Index(fields=['status', 'deleted_at']),
            models.Index(fields=['owner', 'status']),
        ]

    def __str__(self):
        return self.name


class ProjectMember(TimeStampedModel):
    ROLE_CHOICES = [
        ('manager', 'Manager'),
        ('analyst', 'Analyst'),
        ('viewer', 'Viewer'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer', db_index=True)
    invited_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='sent_invitations'
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = 'project_members'
        unique_together = ('project', 'user')
        indexes = [
            models.Index(fields=['user', 'is_active']),
        ]

    def __str__(self):
        return f'{self.user.email} in {self.project.name}'


class ProjectSettings(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='project_settings')
    gsc_connected = models.BooleanField(default=False)
    gsc_site_url = models.CharField(max_length=255, null=True, blank=True)
    gsc_credentials = models.JSONField(default=dict)
    sync_frequency_hours = models.PositiveIntegerField(default=24)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    notification_settings = models.JSONField(default=dict)

    class Meta:
        db_table = 'project_settings'