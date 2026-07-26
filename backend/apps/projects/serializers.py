from rest_framework import serializers
from .models import Project, ProjectMember, ProjectSettings
from apps.users.serializers import UserListSerializer


class ProjectSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectSettings
        fields = (
            'gsc_connected', 'gsc_site_url', 'sync_frequency_hours',
            'last_sync_at', 'notification_settings',
        )
        read_only_fields = ('gsc_connected', 'gsc_site_url', 'last_sync_at')


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserListSerializer(read_only=True)
    invited_by_email = serializers.SerializerMethodField()

    class Meta:
        model = ProjectMember
        fields = ('id', 'user', 'role', 'invited_by_email', 'is_active', 'created_at')

    def get_invited_by_email(self, obj):
        return obj.invited_by.email if obj.invited_by else None


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserListSerializer(read_only=True)
    project_settings = ProjectSettingsSerializer(read_only=True)
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            'id', 'name', 'slug', 'description', 'domain', 'status',
            'owner', 'logo', 'settings', 'project_settings',
            'members_count', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')

    def get_members_count(self, obj):
        return obj.members.filter(is_active=True).count()


class ProjectListSerializer(serializers.ModelSerializer):
    owner_email = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    gsc_connected = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            'id', 'name', 'slug', 'domain', 'status',
            'owner_email', 'logo', 'members_count',
            'gsc_connected', 'created_at',
        )

    def get_owner_email(self, obj):
        return obj.owner.email

    def get_members_count(self, obj):
        return obj.members.filter(is_active=True).count()

    def get_gsc_connected(self, obj):
        try:
            return obj.project_settings.gsc_connected
        except Exception:
            return False


class CreateProjectSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    domain = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)

    def validate_domain(self, value):
        value = value.lower().strip()
        if not value.startswith(('http://', 'https://')):
            value = f'https://{value}'
        return value


class UpdateProjectSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    domain = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=['active', 'paused', 'archived'], required=False)


class AddMemberSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role = serializers.ChoiceField(choices=['manager', 'analyst', 'viewer'], default='viewer')


class UpdateMemberRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['manager', 'analyst', 'viewer'])