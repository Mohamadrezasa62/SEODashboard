#!/bin/bash
set -euo pipefail

DOMAIN=${1:-"your-domain.com"}
EMAIL=${2:-"admin@your-domain.com"}

echo "Setting up SSL for domain: $DOMAIN"
echo "Email: $EMAIL"

echo "[1/4] Starting nginx for HTTP challenge..."
docker-compose -f docker-compose.prod.yml up -d nginx

sleep 5

echo "[2/4] Obtaining SSL certificate..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

echo "[3/4] Updating nginx config with SSL..."
sed -i "s/your-domain.com/$DOMAIN/g" nginx/conf.d/prod.conf

echo "[4/4] Reloading nginx..."
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo ""
echo "SSL setup complete!"
echo "Test: https://$DOMAIN"