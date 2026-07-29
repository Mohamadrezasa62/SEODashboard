# from django.utils import timezone
# from .models import BackupRecord


# class BackupRepository:
#     @staticmethod
#     def get_all():
#         return BackupRecord.objects.all().order_by('-created_at')

#     @staticmethod
#     def get_by_id(backup_id):
#         try:
#             return BackupRecord.objects.get(id=backup_id)
#         except BackupRecord.DoesNotExist:
#             return None

#     @staticmethod
#     def create(name, backup_type, initiated_by=None):
#         return BackupRecord.objects.create(
#             name=name,
#             backup_type=backup_type,
#             initiated_by=initiated_by,
#             status='pending',
#         )

#     @staticmethod
#     def mark_running(record):
#         record.status = 'running'
#         record.started_at = timezone.now()
#         record.save(update_fields=['status', 'started_at'])

#     @staticmethod
#     def mark_success(record, file_path, file_size, checksum):
#         record.status = 'success'
#         record.file_path = file_path
#         record.file_size = file_size
#         record.checksum = checksum
#         record.finished_at = timezone.now()
#         record.save(update_fields=['status', 'file_path', 'file_size', 'checksum', 'finished_at'])

#     @staticmethod
#     def mark_failed(record, error_message):
#         record.status = 'failed'
#         record.error_message = error_message
#         record.finished_at = timezone.now()
#         record.save(update_fields=['status', 'error_message', 'finished_at'])
from django.utils import timezone
from .models import BackupRecord, RestoreRecord


class BackupRepository:
    @staticmethod
    def get_all():
        return BackupRecord.objects.all().order_by('-created_at')

    @staticmethod
    def get_by_id(backup_id):
        try:
            return BackupRecord.objects.get(id=backup_id)
        except BackupRecord.DoesNotExist:
            return None

    @staticmethod
    def get_successful():
        return BackupRecord.objects.filter(status='success').order_by('-created_at')

    @staticmethod
    def create(name, backup_type, initiated_by=None):
        return BackupRecord.objects.create(
            name=name,
            backup_type=backup_type,
            initiated_by=initiated_by,
            status='pending',
        )

    @staticmethod
    def mark_running(record):
        record.status = 'running'
        record.started_at = timezone.now()
        record.save(update_fields=['status', 'started_at'])

    @staticmethod
    def mark_success(record, file_path, file_size, checksum):
        record.status = 'success'
        record.file_path = file_path
        record.file_size = file_size
        record.checksum = checksum
        record.finished_at = timezone.now()
        record.save(update_fields=['status', 'file_path', 'file_size', 'checksum', 'finished_at'])

    @staticmethod
    def mark_failed(record, error_message):
        record.status = 'failed'
        record.error_message = error_message
        record.finished_at = timezone.now()
        record.save(update_fields=['status', 'error_message', 'finished_at'])

    @staticmethod
    def mark_verified(record):
        record.is_verified = True
        record.save(update_fields=['is_verified'])


class RestoreRepository:
    @staticmethod
    def get_all():
        return RestoreRecord.objects.select_related('backup', 'initiated_by').order_by('-created_at')

    @staticmethod
    def get_by_id(restore_id):
        try:
            return RestoreRecord.objects.get(id=restore_id)
        except RestoreRecord.DoesNotExist:
            return None

    @staticmethod
    def create(backup, initiated_by=None, notes=None):
        return RestoreRecord.objects.create(
            backup=backup,
            initiated_by=initiated_by,
            notes=notes,
            status='pending',
        )

    @staticmethod
    def mark_running(record):
        record.status = 'running'
        record.started_at = timezone.now()
        record.save(update_fields=['status', 'started_at'])

    @staticmethod
    def mark_success(record):
        record.status = 'success'
        record.finished_at = timezone.now()
        record.save(update_fields=['status', 'finished_at'])

    @staticmethod
    def mark_failed(record, error_message):
        record.status = 'failed'
        record.error_message = error_message
        record.finished_at = timezone.now()
        record.save(update_fields=['status', 'error_message', 'finished_at'])