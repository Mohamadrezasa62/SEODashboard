#!/bin/bash

set -e

echo "=== SEO Dashboard Entrypoint ==="
echo "Environment: ${DJANGO_SETTINGS_MODULE}"

echo "[1/4] Waiting for MySQL..."
until nc -z "${DB_HOST:-db}" "${DB_PORT:-3306}"; do
    echo "  MySQL not ready, waiting..."
    sleep 2
done
echo "  MySQL is ready."

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "[2/4] Running migrations..."
    python manage.py migrate --noinput

    echo "[3/4] Collecting static files..."
    python manage.py collectstatic --noinput --clear
else
    echo "[2/4] Skipping migrations."
    echo "[3/4] Skipping static files."
fi

echo "[4/4] Starting server..."
exec "$@"
