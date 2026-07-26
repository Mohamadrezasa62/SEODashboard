from rest_framework import serializers
from .models import AuditLog, SystemHealthLog
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