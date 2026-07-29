#!/bin/bash

set -e

echo "=============================="
echo "SEO Dashboard Deploy Script"
echo "=============================="

COMPOSE_FILE="docker-compose.prod.yml"

echo "[1/7] Pulling latest images..."
docker-compose -f $COMPOSE_FILE pull

echo "[2/7] Starting database and redis..."
docker-compose -f $COMPOSE_FILE up -d db redis
sleep 10

echo "[3/7] Running migrations..."
docker-compose -f $COMPOSE_FILE run --rm backend python manage.py migrate --noinput

echo "[4/7] Collecting static files..."
docker-compose -f $COMPOSE_FILE run --rm backend python manage.py collectstatic --noinput

echo "[5/7] Seeding permissions..."
docker-compose -f $COMPOSE_FILE run --rm backend python manage.py seed_permissions

echo "[6/7] Starting all services..."
docker-compose -f $COMPOSE_FILE up -d

echo "[7/7] Cleaning up old images..."
docker system prune -f

echo ""
echo "=============================="
echo "Deploy complete!"
echo "Health check: https://your-domain.com/api/v1/monitoring/health/"
echo "=============================="