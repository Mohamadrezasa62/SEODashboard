#!/bin/bash

set -e

echo "Waiting for MySQL..."
while ! nc -z $DB_HOST $DB_PORT; do
    sleep 1
done
echo "MySQL is ready."

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec "$@"