# import os
# import subprocess
# import hashlib
# import logging
# from django.utils import timezone
# from django.conf import settings
# from apps.core.exceptions import ServiceException
# from .repositories import BackupRepository

# logger = logging.getLogger(__name__)


# class BackupService:
#     def get_backup_dir(self):
#         backup_dir = getattr(settings, 'BACKUP_DIR', '/app/backups')
#         os.makedirs(backup_dir, exist_ok=True)
#         return backup_dir

#     def create_backup(self, user=None, backup_type='manual'):
#         backup_name = f'backup_{timezone.now().strftime("%Y%m%d_%H%M%S")}'
#         record = BackupRepository.create(
#             name=backup_name,
#             backup_type=backup_type,
#             initiated_by=user,
#         )
#         BackupRepository.mark_running(record)

#         try:
#             file_path = self._run_mysqldump(backup_name)
#             file_size = os.path.getsize(file_path)
#             checksum = self._compute_checksum(file_path)

#             BackupRepository.mark_success(record, file_path, file_size, checksum)
#             logger.info('Backup created: %s', file_path)
#             return record

#         except Exception as e:
#             BackupRepository.mark_failed(record, str(e))
#             logger.error('Backup failed: %s', e)
#             raise ServiceException(f'Backup failed: {str(e)}')

#     def _run_mysqldump(self, backup_name):
#         from django.conf import settings as django_settings
#         db = django_settings.DATABASES['default']

#         backup_dir = self.get_backup_dir()
#         file_path = os.path.join(backup_dir, f'{backup_name}.sql.gz')

#         env = os.environ.copy()
#         env['MYSQL_PWD'] = db['PASSWORD']

#         dump_cmd = [
#             'mysqldump',
#             f'--host={db["HOST"]}',
#             f'--port={db["PORT"]}',
#             f'--user={db["USER"]}',
#             '--single-transaction',
#             '--routines',
#             '--triggers',
#             db['NAME'],
#         ]

#         with open(file_path, 'wb') as f:
#             dump_proc = subprocess.Popen(dump_cmd, stdout=subprocess.PIPE, env=env)
#             gzip_proc = subprocess.Popen(
#                 ['gzip', '-c'],
#                 stdin=dump_proc.stdout,
#                 stdout=f,
#             )
#             dump_proc.stdout.close()
#             gzip_proc.communicate()

#             if dump_proc.wait() != 0:
#                 raise ServiceException('mysqldump failed.')

#         return file_path

#     def _compute_checksum(self, file_path):
#         sha256 = hashlib.sha256()
#         with open(file_path, 'rb') as f:
#             for chunk in iter(lambda: f.read(8192), b''):
#                 sha256.update(chunk)
#         return sha256.hexdigest()

#     def list_backups(self):
#         return BackupRepository.get_all()

#     def get_backup(self, backup_id):
#         backup = BackupRepository.get_by_id(backup_id)
#         if not backup:
#             from apps.core.exceptions import NotFoundException
#             raise NotFoundException('Backup not found.')
#         return backup

#     def delete_backup(self, backup_id, user):
#         backup = self.get_backup(backup_id)
#         if backup.file_path and os.path.exists(backup.file_path):
#             os.remove(backup.file_path)
#         backup.delete()
#         logger.info('Backup deleted by %s: %s', user.email if user else 'system', backup_id)

import os
import subprocess
import hashlib
import logging
from django.utils import timezone
from django.conf import settings
from apps.core.exceptions import ServiceException, NotFoundException
from .repositories import BackupRepository, RestoreRepository

logger = logging.getLogger(__name__)


class BackupService:
    def get_backup_dir(self):
        backup_dir = getattr(settings, 'BACKUP_DIR', '/app/backups')
        os.makedirs(backup_dir, exist_ok=True)
        return backup_dir

    def create_backup(self, user=None, backup_type='manual', notes=None):
        backup_name = f'backup_{timezone.now().strftime("%Y%m%d_%H%M%S")}'
        record = BackupRepository.create(
            name=backup_name,
            backup_type=backup_type,
            initiated_by=user,
        )
        if notes:
            record.notes = notes
            record.save(update_fields=['notes'])

        BackupRepository.mark_running(record)

        try:
            file_path = self._run_mysqldump(backup_name)
            file_size = os.path.getsize(file_path)
            checksum = self._compute_checksum(file_path)
            BackupRepository.mark_success(record, file_path, file_size, checksum)
            logger.info('Backup created: %s (%d bytes)', file_path, file_size)
            return record

        except Exception as e:
            BackupRepository.mark_failed(record, str(e))
            logger.error('Backup failed: %s', e)
            raise ServiceException(f'Backup failed: {str(e)}')

    def verify_backup(self, backup_id):
        backup = BackupRepository.get_by_id(backup_id)
        if not backup:
            raise NotFoundException('Backup not found.')
        if backup.status != 'success':
            raise ServiceException('Only successful backups can be verified.')
        if not backup.file_path or not os.path.exists(backup.file_path):
            raise ServiceException('Backup file not found on disk.')

        current_checksum = self._compute_checksum(backup.file_path)
        if current_checksum != backup.checksum:
            raise ServiceException(
                f'Checksum mismatch. Expected {backup.checksum}, got {current_checksum}.'
            )

        BackupRepository.mark_verified(backup)
        return backup

    def restore_backup(self, backup_id, user=None, notes=None):
        backup = BackupRepository.get_by_id(backup_id)
        if not backup:
            raise NotFoundException('Backup not found.')
        if backup.status != 'success':
            raise ServiceException('Only successful backups can be restored.')
        if not backup.file_path or not os.path.exists(backup.file_path):
            raise ServiceException('Backup file not found on disk.')

        record = RestoreRepository.create(backup=backup, initiated_by=user, notes=notes)
        RestoreRepository.mark_running(record)

        try:
            self._run_mysql_restore(backup.file_path)
            RestoreRepository.mark_success(record)
            logger.info('Restore completed from backup: %s', backup.name)
            return record

        except Exception as e:
            RestoreRepository.mark_failed(record, str(e))
            logger.error('Restore failed: %s', e)
            raise ServiceException(f'Restore failed: {str(e)}')

    def list_backups(self):
        return BackupRepository.get_all()

    def list_restores(self):
        return RestoreRepository.get_all()

    def get_backup(self, backup_id):
        backup = BackupRepository.get_by_id(backup_id)
        if not backup:
            raise NotFoundException('Backup not found.')
        return backup

    def delete_backup(self, backup_id, user=None):
        backup = self.get_backup(backup_id)
        if backup.file_path and os.path.exists(backup.file_path):
            os.remove(backup.file_path)
        backup.delete()
        logger.info('Backup deleted by %s: %s', user.email if user else 'system', backup_id)

    def _run_mysqldump(self, backup_name):
        from django.conf import settings as django_settings
        db = django_settings.DATABASES['default']
        backup_dir = self.get_backup_dir()
        file_path = os.path.join(backup_dir, f'{backup_name}.sql.gz')

        env = os.environ.copy()
        env['MYSQL_PWD'] = db['PASSWORD']

        dump_cmd = [
            'mysqldump',
            f'--host={db["HOST"]}',
            f'--port={db["PORT"]}',
            f'--user={db["USER"]}',
            '--single-transaction',
            '--routines',
            '--triggers',
            db['NAME'],
        ]

        with open(file_path, 'wb') as f:
            dump_proc = subprocess.Popen(dump_cmd, stdout=subprocess.PIPE, env=env)
            gzip_proc = subprocess.Popen(
                ['gzip', '-c'],
                stdin=dump_proc.stdout,
                stdout=f,
            )
            dump_proc.stdout.close()
            gzip_proc.communicate()
            if dump_proc.wait() != 0:
                raise ServiceException('mysqldump process failed.')

        return file_path

    def _run_mysql_restore(self, file_path):
        from django.conf import settings as django_settings
        db = django_settings.DATABASES['default']

        env = os.environ.copy()
        env['MYSQL_PWD'] = db['PASSWORD']

        mysql_cmd = [
            'mysql',
            f'--host={db["HOST"]}',
            f'--port={db["PORT"]}',
            f'--user={db["USER"]}',
            db['NAME'],
        ]

        with open(file_path, 'rb') as f:
            gunzip_proc = subprocess.Popen(
                ['gunzip', '-c'],
                stdin=f,
                stdout=subprocess.PIPE,
            )
            mysql_proc = subprocess.Popen(
                mysql_cmd,
                stdin=gunzip_proc.stdout,
                env=env,
            )
            gunzip_proc.stdout.close()
            mysql_proc.communicate()

            if mysql_proc.returncode != 0:
                raise ServiceException('MySQL restore process failed.')

    def _compute_checksum(self, file_path):
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        return sha256.hexdigest()