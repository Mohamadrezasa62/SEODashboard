#!/bin/bash
set -euo pipefail

COMPOSE_FILE=${1:-"docker-compose.yml"}

echo "Running manual backup..."
docker-compose -f "$COMPOSE_FILE" exec backend python manage.py shell -c "
from apps.backup.services import BackupService
service = BackupService()
record = service.create_backup(backup_type='manual', notes='Manual backup via script')
print(f'Backup created: {record.name} ({record.status})')
print(f'File: {record.file_path}')
print(f'Size: {record.file_size} bytes')
"