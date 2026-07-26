from rest_framework import serializers
from .models import Report, ScheduledReport
from apps.users.serializers import UserListSerializer


class ReportSerializer(serializers.ModelSerializer):
    created_by = UserListSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = (
            'id', 'name', 'format', 'status',
            'config', 'date_from', 'date_to',
            'file_url', 'file_size',
            'generated_at', 'error_message',
            'created_by', 'created_at',
        )
        read_only_fields = ('id', 'status', 'file_url', 'file_size', 'generated_at', 'created_at')

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None


class CreateReportSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    format = serializers.ChoiceField(choices=['pdf', 'excel', 'csv'])
    config = serializers.JSONField(default=dict, required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)


class ScheduledReportSerializer(serializers.ModelSerializer):
    created_by = UserListSerializer(read_only=True)

    class Meta:
        model = ScheduledReport
        fields = (
            'id', 'name', 'frequency', 'format',
            'config', 'recipients', 'is_active',
            'next_run_at', 'last_run_at',
            'created_by', 'created_at',
        )
        read_only_fields = ('id', 'next_run_at', 'last_run_at', 'created_at')


class CreateScheduledReportSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    frequency = serializers.ChoiceField(choices=['daily', 'weekly', 'monthly'])
    format = serializers.ChoiceField(choices=['pdf', 'excel', 'csv'])
    config = serializers.JSONField(default=dict, required=False)
    recipients = serializers.ListField(
        child=serializers.EmailField(),
        min_length=1,
    )


class ToggleScheduledReportSerializer(serializers.Serializer):
    active = serializers.BooleanField()