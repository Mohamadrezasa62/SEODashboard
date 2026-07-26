from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db import connection
from django.core.cache import cache
from apps.core.mixins import ResponseMixin
from apps.core.permissions import IsDeveloper
from .serializers import AuditLogSerializer, SystemHealthSerializer
from .services import MonitoringService


class HealthCheckView(ResponseMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        health = {'status': 'ok', 'services': {}}

        try:
            connection.ensure_connection()
            health['services']['database'] = 'ok'
        except Exception as e:
            health['services']['database'] = f'error: {str(e)}'
            health['status'] = 'degraded'

        try:
            cache.set('health_check', '1', timeout=5)
            cache.get('health_check')
            health['services']['redis'] = 'ok'
        except Exception as e:
            health['services']['redis'] = f'error: {str(e)}'
            health['status'] = 'degraded'

        return self.success_response(data=health)


class AuditLogListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        service = MonitoringService()
        user_id = request.query_params.get('user_id')
        model_name = request.query_params.get('model_name')
        action = request.query_params.get('action')
        logs = service.get_audit_logs(
            user_id=user_id,
            model_name=model_name,
            action=action,
        )
        serializer = AuditLogSerializer(logs, many=True)
        return self.success_response(data=serializer.data)


class SystemStatsView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        service = MonitoringService()
        stats = service.get_system_stats()
        return self.success_response(data=stats)