.PHONY: help dev prod stop logs shell test migrate seed backup deploy ssl

help:
	@echo "SEO Dashboard — Available Commands"
	@echo ""
	@echo "  make dev          — Start development environment"
	@echo "  make prod         — Start production environment"
	@echo "  make stop         — Stop all containers"
	@echo "  make logs         — View logs"
	@echo "  make shell        — Open Django shell"
	@echo "  make test         — Run backend tests"
	@echo "  make migrate      — Run migrations"
	@echo "  make seed         — Seed initial data"
	@echo "  make backup       — Create manual backup"
	@echo "  make deploy       — Deploy to production"
	@echo "  make ssl          — Setup SSL certificate"

dev:
	docker-compose up -d
	@echo "Dev server running at http://localhost:3000"

prod:
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Production server running"

stop:
	docker-compose down
	docker-compose -f docker-compose.prod.yml down

logs:
	docker-compose logs -f --tail=100

logs-prod:
	docker-compose -f docker-compose.prod.yml logs -f --tail=100

shell:
	docker-compose exec backend python manage.py shell

shell-prod:
	docker-compose -f docker-compose.prod.yml exec backend python manage.py shell

test:
	cd backend && .venv/Scripts/activate && pytest --cov=apps -v

migrate:
	docker-compose exec backend python manage.py migrate

migrate-prod:
	docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

seed:
	docker-compose exec backend python manage.py seed_permissions
	docker-compose exec backend python manage.py seed_initial_data
	docker-compose exec backend python manage.py setup_periodic_tasks

backup:
	chmod +x backend/scripts/backup_now.sh
	./backend/scripts/backup_now.sh

deploy:
	chmod +x backend/scripts/deploy.sh
	./backend/scripts/deploy.sh

ssl:
	chmod +x backend/scripts/setup_ssl.sh
	./backend/scripts/setup_ssl.sh $(DOMAIN) $(EMAIL)

health:
	curl -s http://localhost:8000/api/v1/monitoring/health/ | python3 -m json.tool