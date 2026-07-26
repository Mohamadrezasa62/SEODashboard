from rest_framework import status
from rest_framework.views import APIView
from apps.core.mixins import ResponseMixin
from .serializers import (
    GSCCredentialSerializer, GSCConnectSerializer,
    GSCSyncLogSerializer, ManualSyncSerializer,
)
from .services import GSCService
from .tasks import sync_gsc_data_task


class GSCConnectView(ResponseMixin, APIView):
    def post(self, request, project_id):
        serializer = GSCConnectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = GSCService()
        credential = service.connect(
            project_id=project_id,
            user=request.user,
            **serializer.validated_data,
        )
        return self.success_response(
            data=GSCCredentialSerializer(credential).data,
            message='GSC connected successfully.',
            status_code=status.HTTP_201_CREATED,
        )


class GSCDisconnectView(ResponseMixin, APIView):
    def delete(self, request, project_id):
        service = GSCService()
        service.disconnect(project_id, request.user)
        return self.success_response(message='GSC disconnected.')


class GSCSitesView(ResponseMixin, APIView):
    def get(self, request, project_id):
        service = GSCService()
        sites = service.get_available_sites(project_id, request.user)
        return self.success_response(data=sites)


class GSCSyncView(ResponseMixin, APIView):
    def post(self, request, project_id):
        serializer = ManualSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        start_date = serializer.validated_data.get('start_date')
        end_date = serializer.validated_data.get('end_date')
        sync_gsc_data_task.delay(
            str(project_id),
            start_date.isoformat() if start_date else None,
            end_date.isoformat() if end_date else None,
        )
        return self.success_response(message='Sync queued successfully.')


class GSCSyncLogsView(ResponseMixin, APIView):
    def get(self, request, project_id):
        service = GSCService()
        logs = service.get_sync_logs(project_id, request.user)
        serializer = GSCSyncLogSerializer(logs, many=True)
        return self.success_response(data=serializer.data)