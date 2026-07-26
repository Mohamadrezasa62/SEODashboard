from rest_framework import serializers
from .models import GSCCredential, GSCSyncLog


class GSCCredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = GSCCredential
        fields = ('id', 'site_url', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at')


class GSCConnectSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    token_expiry = serializers.DateTimeField()
    site_url = serializers.CharField(max_length=255)


class GSCSyncLogSerializer(serializers.ModelSerializer):
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = GSCSyncLog
        fields = (
            'id', 'status', 'started_at', 'finished_at',
            'rows_synced', 'error_message',
            'date_range_start', 'date_range_end',
            'duration_seconds', 'created_at',
        )

    def get_duration_seconds(self, obj):
        if obj.started_at and obj.finished_at:
            return (obj.finished_at - obj.started_at).seconds
        return None


class ManualSyncSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)