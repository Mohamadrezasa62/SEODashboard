from rest_framework import status
from rest_framework.views import APIView
from apps.core.mixins import ResponseMixin
from .serializers import (
    KPISerializer, CreateKPISerializer, UpdateKPISerializer,
    KPIRecordSerializer, RecordKPIValueSerializer,
    KPIAlertSerializer, KPIRecordFilterSerializer,
)
from .services import KPIService


class KPIListView(ResponseMixin, APIView):
    def get(self, request, project_id):
        active_only = request.query_params.get('active_only', 'true').lower() != 'false'
        service = KPIService()
        kpis = service.list_kpis(project_id, request.user, active_only)
        serializer = KPISerializer(kpis, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request, project_id):
        serializer = CreateKPISerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = KPIService()
        kpi = service.create_kpi(
            project_id=project_id,
            user=request.user,
            **serializer.validated_data,
        )
        return self.success_response(
            data=KPISerializer(kpi).data,
            message='KPI created successfully.',
            status_code=status.HTTP_201_CREATED,
        )


class KPIDetailView(ResponseMixin, APIView):
    def get(self, request, kpi_id):
        service = KPIService()
        kpi = service.get_kpi(kpi_id, request.user)
        return self.success_response(data=KPISerializer(kpi).data)

    def patch(self, request, kpi_id):
        serializer = UpdateKPISerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = KPIService()
        kpi = service.update_kpi(kpi_id, request.user, serializer.validated_data)
        return self.success_response(
            data=KPISerializer(kpi).data,
            message='KPI updated.',
        )

    def delete(self, request, kpi_id):
        service = KPIService()
        service.delete_kpi(kpi_id, request.user)
        return self.success_response(message='KPI deleted.')


class KPIRecordView(ResponseMixin, APIView):
    def get(self, request, kpi_id):
        filter_serializer = KPIRecordFilterSerializer(data=request.query_params)
        filter_serializer.is_valid(raise_exception=True)
        service = KPIService()
        records = service.get_records(
            kpi_id=kpi_id,
            user=request.user,
            date_from=filter_serializer.validated_data.get('date_from'),
            date_to=filter_serializer.validated_data.get('date_to'),
        )
        serializer = KPIRecordSerializer(records, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request, kpi_id):
        serializer = RecordKPIValueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = KPIService()
        record = service.record_value(
            kpi_id=kpi_id,
            user=request.user,
            record_date=serializer.validated_data['date'],
            value=serializer.validated_data['value'],
            note=serializer.validated_data.get('note'),
        )
        return self.success_response(
            data=KPIRecordSerializer(record).data,
            message='KPI value recorded.',
            status_code=status.HTTP_201_CREATED,
        )


class KPIAlertsView(ResponseMixin, APIView):
    def get(self, request, project_id):
        service = KPIService()
        alerts = service.get_alerts(project_id, request.user)
        serializer = KPIAlertSerializer(alerts, many=True)
        return self.success_response(data=serializer.data)


class KPIAlertResolveView(ResponseMixin, APIView):
    def post(self, request, alert_id):
        service = KPIService()
        alert = service.resolve_alert(alert_id, request.user)
        return self.success_response(
            data=KPIAlertSerializer(alert).data,
            message='Alert resolved.',
        )