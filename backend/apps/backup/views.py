# from rest_framework import status
# from rest_framework.views import APIView
# from apps.core.mixins import ResponseMixin
# from apps.core.permissions import IsDeveloper
# from .serializers import BackupRecordSerializer
# from .services import BackupService


# class BackupListView(ResponseMixin, APIView):
#     permission_classes = [IsDeveloper]

#     def get(self, request):
#         service = BackupService()
#         backups = service.list_backups()
#         serializer = BackupRecordSerializer(backups, many=True)
#         return self.success_response(data=serializer.data)

#     def post(self, request):
#         service = BackupService()
#         record = service.create_backup(user=request.user, backup_type='manual')
#         return self.success_response(
#             data=BackupRecordSerializer(record).data,
#             message='Backup created successfully.',
#             status_code=status.HTTP_201_CREATED,
#         )


# class BackupDetailView(ResponseMixin, APIView):
#     permission_classes = [IsDeveloper]

#     def get(self, request, backup_id):
#         service = BackupService()
#         backup = service.get_backup(backup_id)
#         return self.success_response(data=BackupRecordSerializer(backup).data)

#     def delete(self, request, backup_id):
#         service = BackupService()
#         service.delete_backup(backup_id, request.user)
#         return self.success_response(message='Backup deleted.')

from rest_framework import status
from rest_framework.views import APIView
from apps.core.mixins import ResponseMixin
from apps.core.permissions import IsDeveloper
from .serializers import (
    BackupRecordSerializer, RestoreRecordSerializer,
    CreateBackupSerializer, RestoreSerializer,
)
from .services import BackupService
from .tasks import verify_backup_task


class BackupListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        service = BackupService()
        backups = service.list_backups()
        serializer = BackupRecordSerializer(backups, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request):
        serializer = CreateBackupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = BackupService()
        record = service.create_backup(
            user=request.user,
            backup_type='manual',
            notes=serializer.validated_data.get('notes'),
        )
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


class BackupVerifyView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def post(self, request, backup_id):
        verify_backup_task.delay(str(backup_id))
        return self.success_response(message='Backup verification queued.')


class BackupRestoreView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def post(self, request, backup_id):
        serializer = RestoreSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = BackupService()
        record = service.restore_backup(
            backup_id=backup_id,
            user=request.user,
            notes=serializer.validated_data.get('notes'),
        )
        return self.success_response(
            data=RestoreRecordSerializer(record).data,
            message='Restore completed successfully.',
        )


class RestoreListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        service = BackupService()
        restores = service.list_restores()
        serializer = RestoreRecordSerializer(restores, many=True)
        return self.success_response(data=serializer.data)