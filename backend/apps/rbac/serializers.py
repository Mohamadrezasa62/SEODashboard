from rest_framework import serializers
from .models import Permission, Role, UserRole, FeatureFlag, Plugin
from apps.users.serializers import UserListSerializer


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ('id', 'codename', 'name', 'description', 'module', 'created_at')
        read_only_fields = ('id', 'created_at')


class CreatePermissionSerializer(serializers.Serializer):
    codename = serializers.CharField(max_length=100)
    name = serializers.CharField(max_length=255)
    module = serializers.CharField(max_length=50)
    description = serializers.CharField(required=False, allow_blank=True)


class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ('id', 'name', 'slug', 'description', 'is_system', 'permissions', 'permissions_count', 'created_at')
        read_only_fields = ('id', 'is_system', 'created_at')

    def get_permissions_count(self, obj):
        return obj.permissions.count()


class RoleListSerializer(serializers.ModelSerializer):
    permissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ('id', 'name', 'slug', 'description', 'is_system', 'permissions_count', 'created_at')

    def get_permissions_count(self, obj):
        return obj.permissions.count()


class CreateRoleSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50)
    slug = serializers.SlugField(max_length=50)
    description = serializers.CharField(required=False, allow_blank=True)


class UpdateRolePermissionsSerializer(serializers.Serializer):
    permission_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=True,
    )


class UserRoleSerializer(serializers.ModelSerializer):
    role = RoleListSerializer(read_only=True)
    assigned_by_email = serializers.SerializerMethodField()

    class Meta:
        model = UserRole
        fields = ('id', 'role', 'assigned_by_email', 'created_at')

    def get_assigned_by_email(self, obj):
        return obj.assigned_by.email if obj.assigned_by else None


class AssignRoleSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role_id = serializers.UUIDField()


class ChangeUserRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['developer', 'company_manager', 'employee'])


class FeatureFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureFlag
        fields = ('id', 'name', 'slug', 'description', 'is_enabled', 'allowed_roles', 'metadata', 'created_at')
        read_only_fields = ('id', 'created_at')


class CreateFeatureFlagSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    slug = serializers.SlugField(max_length=100)
    description = serializers.CharField(required=False, allow_blank=True)
    allowed_roles = serializers.ListField(
        child=serializers.ChoiceField(choices=['developer', 'company_manager', 'employee']),
        required=False,
        default=list,
    )


class ToggleSerializer(serializers.Serializer):
    enabled = serializers.BooleanField()


class PluginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plugin
        fields = ('id', 'name', 'slug', 'description', 'version', 'is_active', 'config', 'created_at')
        read_only_fields = ('id', 'created_at')


class PluginConfigSerializer(serializers.Serializer):
    config = serializers.JSONField()


class PluginToggleSerializer(serializers.Serializer):
    active = serializers.BooleanField()