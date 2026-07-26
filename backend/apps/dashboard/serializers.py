from rest_framework import serializers
from .models import Dashboard, Widget


class WidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Widget
        fields = (
            'id', 'name', 'widget_type', 'data_source',
            'position_x', 'position_y', 'width', 'height',
            'config', 'filters', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class DashboardSerializer(serializers.ModelSerializer):
    widgets = WidgetSerializer(many=True, read_only=True)
    owner_email = serializers.SerializerMethodField()
    widgets_count = serializers.SerializerMethodField()

    class Meta:
        model = Dashboard
        fields = (
            'id', 'name', 'owner_email', 'project',
            'is_default', 'is_shared', 'layout',
            'widgets', 'widgets_count',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_owner_email(self, obj):
        return obj.owner.email

    def get_widgets_count(self, obj):
        return obj.widgets.count()


class DashboardListSerializer(serializers.ModelSerializer):
    owner_email = serializers.SerializerMethodField()
    widgets_count = serializers.SerializerMethodField()

    class Meta:
        model = Dashboard
        fields = (
            'id', 'name', 'owner_email', 'project',
            'is_default', 'is_shared',
            'widgets_count', 'created_at',
        )

    def get_owner_email(self, obj):
        return obj.owner.email

    def get_widgets_count(self, obj):
        return obj.widgets.count()


class CreateDashboardSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    project_id = serializers.UUIDField(required=False, allow_null=True)
    is_default = serializers.BooleanField(default=False, required=False)
    is_shared = serializers.BooleanField(default=False, required=False)
    layout = serializers.JSONField(default=list, required=False)


class UpdateDashboardSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    is_default = serializers.BooleanField(required=False)
    is_shared = serializers.BooleanField(required=False)
    layout = serializers.JSONField(required=False)


class CreateWidgetSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    widget_type = serializers.ChoiceField(choices=[
        'line_chart', 'bar_chart', 'pie_chart', 'metric_card',
        'table', 'heatmap', 'funnel', 'kpi_gauge',
    ])
    data_source = serializers.CharField(max_length=100)
    config = serializers.JSONField(default=dict, required=False)
    filters = serializers.JSONField(default=dict, required=False)
    position_x = serializers.IntegerField(default=0, required=False)
    position_y = serializers.IntegerField(default=0, required=False)
    width = serializers.IntegerField(default=6, min_value=1, max_value=12, required=False)
    height = serializers.IntegerField(default=4, min_value=1, max_value=20, required=False)


class UpdateWidgetSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    config = serializers.JSONField(required=False)
    filters = serializers.JSONField(required=False)
    position_x = serializers.IntegerField(required=False)
    position_y = serializers.IntegerField(required=False)
    width = serializers.IntegerField(min_value=1, max_value=12, required=False)
    height = serializers.IntegerField(min_value=1, max_value=20, required=False)


class WidgetPositionSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    position_x = serializers.IntegerField(min_value=0)
    position_y = serializers.IntegerField(min_value=0)
    width = serializers.IntegerField(min_value=1, max_value=12)
    height = serializers.IntegerField(min_value=1, max_value=20)


class UpdateLayoutSerializer(serializers.Serializer):
    widgets = serializers.ListField(child=WidgetPositionSerializer())