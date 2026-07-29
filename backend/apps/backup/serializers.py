# from rest_framework import serializers
# from .models import BackupRecord
# from apps.users.serializers import UserListSerializer


# class BackupRecordSerializer(serializers.ModelSerializer):
#     initiated_by = UserListSerializer(read_only=True)
#     file_size_mb = serializers.SerializerMethodField()
#     duration_seconds = serializers.SerializerMethodField()

#     class Meta:
#         model = BackupRecord
#         fields = (
#             'id', 'name', 'backup_type', 'status',
#             'file_path', 'file_size', 'file_size_mb',
#             'checksum', 'started_at', 'finished_at',
#             'duration_seconds', 'error_message',
#             'initiated_by', 'created_at',
#         )
#         read_only_fields = ('id', 'created_at')

#     def get_file_size_mb(self, obj):
#         if obj.file_size:
#             return round(obj.file_size / (1024 * 1024), 2)
#         return None

#     def get_duration_seconds(self, obj):
#         if obj.started_at and obj.finished_at:
#             return (obj.finished_at - obj.started_at).seconds
#         return None

from rest_framework import serializers
from .models import BackupRecord, RestoreRecord
from apps.users.serializers import UserListSerializer


class BackupRecordSerializer(serializers.ModelSerializer):
    initiated_by = UserListSerializer(read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    duration_seconds = serializers.SerializerMethodField()
    restore_count = serializers.SerializerMethodField()

    class Meta:
        model = BackupRecord
        fields = (
            'id', 'name', 'backup_type', 'status',
            'file_path', 'file_size', 'file_size_mb',
            'checksum', 'is_verified',
            'started_at', 'finished_at',
            'duration_seconds', 'error_message', 'notes',
            'initiated_by', 'restore_count', 'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def get_file_size_mb(self, obj):
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return None

    def get_duration_seconds(self, obj):
        if obj.started_at and obj.finished_at:
            return (obj.finished_at - obj.started_at).seconds
        return None

    def get_restore_count(self, obj):
        return obj.restores.count()


class RestoreRecordSerializer(serializers.ModelSerializer):
    initiated_by = UserListSerializer(read_only=True)
    backup_name = serializers.SerializerMethodField()
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = RestoreRecord
        fields = (
            'id', 'backup', 'backup_name', 'status',
            'initiated_by', 'started_at', 'finished_at',
            'duration_seconds', 'error_message', 'notes',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def get_backup_name(self, obj):
        return obj.backup.name

    def get_duration_seconds(self, obj):
        if obj.started_at and obj.finished_at:
            return (obj.finished_at - obj.started_at).seconds
        return None


class CreateBackupSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)


class RestoreSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)
    confirm = serializers.BooleanField()

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError(
                'You must confirm the restore operation.'
            )
        return value