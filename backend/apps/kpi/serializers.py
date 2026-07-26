from rest_framework import serializers
from .models import KPI, KPIRecord, KPIAlert
from apps.users.serializers import UserListSerializer


class KPISerializer(serializers.ModelSerializer):
    created_by = UserListSerializer(read_only=True)
    achievement_pct = serializers.ReadOnlyField()
    latest_record_date = serializers.SerializerMethodField()

    class Meta:
        model = KPI
        fields = (
            'id', 'name', 'kpi_type', 'period',
            'target_value', 'current_value', 'achievement_pct',
            'is_active', 'alert_threshold_pct',
            'created_by', 'latest_record_date',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'current_value', 'created_at', 'updated_at')

    def get_latest_record_date(self, obj):
        from apps.kpi.repositories import KPIRecordRepository
        latest = KPIRecordRepository.get_latest(obj)
        return latest.date if latest else None


class CreateKPISerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    kpi_type = serializers.ChoiceField(choices=[
        'clicks', 'impressions', 'ctr', 'position',
        'keywords', 'pages', 'custom',
    ])
    period = serializers.ChoiceField(choices=['daily', 'weekly', 'monthly', 'quarterly'])
    target_value = serializers.DecimalField(max_digits=15, decimal_places=4)
    alert_threshold_pct = serializers.DecimalField(
        max_digits=5, decimal_places=2, default=20, required=False
    )


class UpdateKPISerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    target_value = serializers.DecimalField(max_digits=15, decimal_places=4, required=False)
    alert_threshold_pct = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    is_active = serializers.BooleanField(required=False)


class KPIRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = KPIRecord
        fields = ('id', 'date', 'value', 'note', 'created_at')
        read_only_fields = ('id', 'created_at')


class RecordKPIValueSerializer(serializers.Serializer):
    date = serializers.DateField()
    value = serializers.DecimalField(max_digits=15, decimal_places=4)
    note = serializers.CharField(required=False, allow_blank=True)


class KPIAlertSerializer(serializers.ModelSerializer):
    kpi_name = serializers.SerializerMethodField()
    project_id = serializers.SerializerMethodField()

    class Meta:
        model = KPIAlert
        fields = (
            'id', 'kpi_name', 'project_id',
            'alert_type', 'message',
            'is_resolved', 'resolved_at', 'created_at',
        )

    def get_kpi_name(self, obj):
        return obj.kpi.name

    def get_project_id(self, obj):
        return str(obj.kpi.project.id)


class KPIRecordFilterSerializer(serializers.Serializer):
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)