from rest_framework import status
from rest_framework.views import APIView
from apps.core.mixins import ResponseMixin
from apps.core.permissions import IsDeveloper
from .serializers import BackupRecordSerializer
from .services import BackupService


class BackupListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        service = BackupService()
        backups = service.list_backups()
        serializer = BackupRecordSerializer(backups, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request):
        service = BackupService()
        record = service.create_backup(user=request.user, backup_type='manual')
        return self.success_response(
            data=BackupRecordSerializer(record).data,
            message='Backup created successfully.',
            status_code=status.HTTP_201_CREATED,
        )


class BackupDetailView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request, backup_id):
        service = BackupService()
        backup = service.get_backup(backup_id)
        return self.success_response(data=BackupRecordSerializer(backup).data)

    def delete(self, request, backup_id):
        service = BackupService()
        service.delete_backup(backup_id, request.user)
        return self.success_response(message='Backup deleted.')