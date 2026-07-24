import uuid
from django.db import models
from apps.core.models import TimeStampedModel
from apps.users.models import User


class Permission(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codename = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    module = models.CharField(max_length=50, db_index=True)

    class Meta:
        db_table = 'rbac_permissions'
        indexes = [
            models.Index(fields=['module', 'codename']),
        ]

    def __str__(self):
        return self.codename


class Role(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, db_index=True)
    description = models.TextField(null=True, blank=True)
    is_system = models.BooleanField(default=False)
    permissions = models.ManyToManyField(Permission, through='RolePermission', related_name='roles')

    class Meta:
        db_table = 'rbac_roles'

    def __str__(self):
        return self.name


class RolePermission(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        db_table = 'rbac_role_permissions'
        unique_together = ('role', 'permission')


class UserRole(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='user_roles')
    assigned_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='assigned_roles'
    )

    class Meta:
        db_table = 'rbac_user_roles'
        unique_together = ('user', 'role')


class FeatureFlag(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, db_index=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    is_enabled = models.BooleanField(default=False, db_index=True)
    allowed_roles = models.JSONField(default=list)
    metadata = models.JSONField(default=dict)

    class Meta:
        db_table = 'feature_flags'

    def __str__(self):
        return self.name


class Plugin(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    description = models.TextField(null=True, blank=True)
    version = models.CharField(max_length=20, default='1.0.0')
    is_active = models.BooleanField(default=False, db_index=True)
    config = models.JSONField(default=dict)

    class Meta:
        db_table = 'plugins'

    def __str__(self):
        return self.name