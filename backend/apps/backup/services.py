import os
import subprocess
import hashlib
import logging
from django.utils import timezone
from django.conf import settings
from apps.core.exceptions import ServiceException
from .repositories import BackupRepository

logger = logging.getLogger(__name__)


class BackupService:
    def get_backup_dir(self):
        backup_dir = getattr(settings, 'BACKUP_DIR', '/app/backups')
        os.makedirs(backup_dir, exist_ok=True)
        return backup_dir

    def create_backup(self, user=None, backup_type='manual'):
        backup_name = f'backup_{timezone.now().strftime("%Y%m%d_%H%M%S")}'
        record = BackupRepository.create(
            name=backup_name,
            backup_type=backup_type,
            initiated_by=user,
        )
        BackupRepository.mark_running(record)

        try:
            file_path = self._run_mysqldump(backup_name)
            file_size = os.path.getsize(file_path)
            checksum = self._compute_checksum(file_path)

            BackupRepository.mark_success(record, file_path, file_size, checksum)
            logger.info('Backup created: %s', file_path)
            return record

        except Exception as e:
            BackupRepository.mark_failed(record, str(e))
            logger.error('Backup failed: %s', e)
            raise ServiceException(f'Backup failed: {str(e)}')

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
                raise ServiceException('mysqldump failed.')

        return file_path

    def _compute_checksum(self, file_path):
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        return sha256.hexdigest()

    def list_backups(self):
        return BackupRepository.get_all()

    def get_backup(self, backup_id):
        backup = BackupRepository.get_by_id(backup_id)
        if not backup:
            from apps.core.exceptions import NotFoundException
            raise NotFoundException('Backup not found.')
        return backup

    def delete_backup(self, backup_id, user):
        backup = self.get_backup(backup_id)
        if backup.file_path and os.path.exists(backup.file_path):
            os.remove(backup.file_path)
        backup.delete()
        logger.info('Backup deleted by %s: %s', user.email if user else 'system', backup_id)