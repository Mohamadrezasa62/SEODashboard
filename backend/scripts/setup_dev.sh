#!/bin/bash

set -e

echo "=============================="
echo "SEO Dashboard Dev Setup"
echo "=============================="

echo "[1/6] Creating virtual environment..."
python -m venv .venv

echo "[2/6] Activating and installing dependencies..."
source .venv/bin/activate || .venv/Scripts/activate
pip install -r requirements/development.txt

echo "[3/6] Copying .env file..."
if [ ! -f ../.env ]; then
    cp ../.env.example ../.env
    echo "  .env created — please update with your values"
fi

echo "[4/6] Starting Docker services..."
cd ..
docker-compose up -d db redis

echo "  Waiting for MySQL to be ready..."
sleep 15

echo "[5/6] Running migrations..."
cd backend
python manage.py migrate

echo "[6/6] Seeding permissions and creating superuser..."
python manage.py seed_permissions
python manage.py createsuperuser --noinput \
    --email admin@seodashboard.com \
    || echo "  Superuser already exists or needs manual creation"

echo ""
echo "=============================="
echo "Dev setup complete!"
echo "Run: python manage.py runserver"
echo "Admin: http://localhost:8000/admin/"
echo "=============================="