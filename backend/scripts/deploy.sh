# #!/bin/bash

# set -e

# echo "=============================="
# echo "SEO Dashboard Deploy Script"
# echo "=============================="

# COMPOSE_FILE="docker-compose.prod.yml"

# echo "[1/7] Pulling latest images..."
# docker-compose -f $COMPOSE_FILE pull

# echo "[2/7] Starting database and redis..."
# docker-compose -f $COMPOSE_FILE up -d db redis
# sleep 10

# echo "[3/7] Running migrations..."
# docker-compose -f $COMPOSE_FILE run --rm backend python manage.py migrate --noinput

# echo "[4/7] Collecting static files..."
# docker-compose -f $COMPOSE_FILE run --rm backend python manage.py collectstatic --noinput

# echo "[5/7] Seeding permissions..."
# docker-compose -f $COMPOSE_FILE run --rm backend python manage.py seed_permissions

# echo "[6/7] Starting all services..."
# docker-compose -f $COMPOSE_FILE up -d

# echo "[7/7] Cleaning up old images..."
# docker system prune -f

# echo ""
# echo "=============================="
# echo "Deploy complete!"
# echo "Health check: https://your-domain.com/api/v1/monitoring/health/"
# echo "=============================="
#!/bin/bash
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/seo-dashboard/deploy_${TIMESTAMP}.log"

mkdir -p /var/log/seo-dashboard

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=============================="
log "SEO Dashboard Deploy — ${TIMESTAMP}"
log "=============================="

log "[1/9] Pulling latest images..."
docker-compose -f $COMPOSE_FILE pull >> "$LOG_FILE" 2>&1

log "[2/9] Starting database and redis..."
docker-compose -f $COMPOSE_FILE up -d db redis
sleep 15

log "[3/9] Running migrations..."
docker-compose -f $COMPOSE_FILE run --rm backend python manage.py migrate --noinput >> "$LOG_FILE" 2>&1

log "[4/9] Collecting static files..."
docker-compose -f $COMPOSE_FILE run --rm backend python manage.py collectstatic --noinput --clear >> "$LOG_FILE" 2>&1

log "[5/9] Seeding permissions..."
docker-compose -f $COMPOSE_FILE run --rm backend python manage.py seed_permissions >> "$LOG_FILE" 2>&1

log "[6/9] Setting up periodic tasks..."
docker-compose -f $COMPOSE_FILE run --rm backend python manage.py setup_periodic_tasks >> "$LOG_FILE" 2>&1

log "[7/9] Starting all services..."
docker-compose -f $COMPOSE_FILE up -d >> "$LOG_FILE" 2>&1

log "[8/9] Waiting for services to be healthy..."
sleep 20

log "[9/9] Running health check..."
HEALTH=$(curl -sf http://localhost/api/v1/monitoring/health/ | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['status'])" 2>/dev/null || echo "error")

if [ "$HEALTH" = "ok" ]; then
    log "Health check passed."
else
    log "WARNING: Health check returned: ${HEALTH}"
fi

log "[Cleanup] Removing unused Docker images..."
docker system prune -f >> "$LOG_FILE" 2>&1

log ""
log "=============================="
log "Deploy complete!"
log "Log: $LOG_FILE"
log "Health: https://your-domain.com/api/v1/monitoring/health/"
log "=============================="