# from rest_framework import serializers
# from .models import AuditLog, SystemHealthLog
# from apps.users.serializers import UserListSerializer


# class AuditLogSerializer(serializers.ModelSerializer):
#     user = UserListSerializer(read_only=True)

#     class Meta:
#         model = AuditLog
#         fields = (
#             'id', 'user', 'action', 'model_name',
#             'object_id', 'object_repr', 'changes',
#             'ip_address', 'created_at',
#         )
#         read_only_fields = ('id', 'created_at')


# class SystemHealthSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = SystemHealthLog
#         fields = ('id', 'service', 'status', 'response_time_ms', 'details', 'created_at')

from rest_framework import serializers
from .models import AuditLog, SystemHealthLog, TaskLog
from apps.users.serializers import UserListSerializer


class AuditLogSerializer(serializers.ModelSerializer):
    user = UserListSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = (
            'id', 'user', 'action', 'model_name',
            'object_id', 'object_repr', 'changes',
            'ip_address', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class SystemHealthSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemHealthLog
        fields = ('id', 'service', 'status', 'response_time_ms', 'details', 'created_at')


class TaskLogSerializer(serializers.ModelSerializer):
    duration_formatted = serializers.SerializerMethodField()
    task_short_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskLog
        fields = (
            'id', 'task_id', 'task_name', 'task_short_name',
            'status', 'args', 'kwargs', 'result',
            'error_message', 'started_at', 'finished_at',
            'duration_seconds', 'duration_formatted',
            'retries', 'worker', 'created_at',
        )

    def get_duration_formatted(self, obj):
        if not obj.duration_seconds:
            return None
        secs = obj.duration_seconds
        if secs < 60:
            return f'{secs:.1f}s'
        mins = int(secs // 60)
        secs_rem = secs % 60
        return f'{mins}m {secs_rem:.0f}s'

    def get_task_short_name(self, obj):
        parts = obj.task_name.split('.')
        return parts[-1] if parts else obj.task_name
    