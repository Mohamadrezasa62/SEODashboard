from rest_framework import serializers
from .models import BackupRecord
from apps.users.serializers import UserListSerializer


class BackupRecordSerializer(serializers.ModelSerializer):
    initiated_by = UserListSerializer(read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = BackupRecord
        fields = (
            'id', 'name', 'backup_type', 'status',
            'file_path', 'file_size', 'file_size_mb',
            'checksum', 'started_at', 'finished_at',
            'duration_seconds', 'error_message',
            'initiated_by', 'created_at',
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