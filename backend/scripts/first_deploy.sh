#!/bin/bash
set -euo pipefail

DOMAIN=${1:-"your-domain.com"}
EMAIL=${2:-"admin@your-domain.com"}
REPO=${3:-"https://github.com/your-username/seo-dashboard.git"}

echo "=============================="
echo "SEO Dashboard First Deploy"
echo "Domain: $DOMAIN"
echo "=============================="

# 1. Update system
echo "[1/10] Updating system..."
apt-get update && apt-get upgrade -y
apt-get install -y docker.io docker-compose git curl python3 make

# 2. Start Docker
systemctl enable docker
systemctl start docker

# 3. Clone repo
echo "[2/10] Cloning repository..."
mkdir -p /opt/seo-dashboard
git clone "$REPO" /opt/seo-dashboard || git -C /opt/seo-dashboard pull
cd /opt/seo-dashboard

# 4. Setup env
echo "[3/10] Setting up environment..."
if [ ! -f .env.prod ]; then
    cp .env.prod.example .env.prod
    echo "IMPORTANT: Edit /opt/seo-dashboard/.env.prod before continuing!"
    echo "Press Enter when ready..."
    read
fi

# 5. Create directories
echo "[4/10] Creating directories..."
mkdir -p /var/log/seo-dashboard
mkdir -p /app/backups

# 6. Start DB and Redis first
echo "[5/10] Starting database services..."
docker-compose -f docker-compose.prod.yml up -d db redis
sleep 20

# 7. Run migrations
echo "[6/10] Running migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate --noinput

# 8. Seed data
echo "[7/10] Seeding initial data..."
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py seed_permissions
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py seed_initial_data \
    --admin-email "admin@${DOMAIN}" \
    --admin-password "$(openssl rand -base64 12)"
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py setup_periodic_tasks

# 9. SSL Certificate
echo "[8/10] Setting up SSL..."
docker-compose -f docker-compose.prod.yml up -d nginx
sleep 5
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Update nginx config with actual domain
sed -i "s/your-domain.com/$DOMAIN/g" nginx/conf.d/prod.conf

# 10. Start everything
echo "[9/10] Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

sleep 20

echo "[10/10] Health check..."
HEALTH=$(curl -sf "https://$DOMAIN/api/v1/monitoring/health/" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])" \
    2>/dev/null || echo "error")

echo ""
echo "=============================="
echo "Deploy Complete!"
echo "Domain: https://$DOMAIN"
echo "Health: $HEALTH"
echo "Admin: https://$DOMAIN/admin/"
echo "API: https://$DOMAIN/api/v1/"
echo "=============================="