# How to run Project
cd backend
python -m venv .venv
cd requirements

docker-compose up -d

py -m pip install -r base.txt
py -m pip install -r development.txt
py -m pip install -r production.txt

py manage.py makemigrations
py manage.py migrate

cd ../frontend
npm install
npm run dev

# open a new terminal and type:
cd ./backend
py manage.py runserver

# SEO Dashboard

پنل مدیریت SEO سازمانی با Multi-Tenant، RBAC، Feedback، AI Integration

## Stack

**Backend:** Django 5, DRF, Celery, Redis, MySQL 8
**Frontend:** Next.js 14, TypeScript, Tailwind, Shadcn/UI, TanStack

## Quick Start (Development)

```bash
# Clone
git clone https://github.com/your-username/seo-dashboard.git
cd seo-dashboard

# Copy env
cp .env.example .env
# Edit .env with your values

# Start services
docker-compose up -d db redis

# Backend setup
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements/development.txt
python manage.py migrate
python manage.py seed_permissions
python manage.py createsuperuser
python manage.py runserver

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

## Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1/
- Admin Panel: http://localhost:8000/admin/
- Health Check: http://localhost:8000/api/v1/monitoring/health/

## Production Deploy

```bash
cp .env.prod.example .env.prod
# Edit .env.prod

chmod +x backend/scripts/deploy.sh
./backend/scripts/deploy.sh
```

## Default Roles

| Role | دسترسی |
|------|--------|
| Developer | دسترسی کامل |
| Company Manager | مدیریت پروژه و گزارش |
| Employee | پروژه‌های خود |

## API Endpoints

| Module | Base URL |
|--------|----------|
| Auth | /api/v1/auth/ |
| Users | /api/v1/users/ |
| RBAC | /api/v1/rbac/ |
| Projects | /api/v1/projects/ |
| SEO | /api/v1/seo/ |
| GSC | /api/v1/gsc/ |
| Feedback | /api/v1/feedback/ |
| KPI | /api/v1/kpi/ |
| Dashboard | /api/v1/dashboard/ |
| Reports | /api/v1/reports/ |
| AI | /api/v1/ai/ |
| Monitoring | /api/v1/monitoring/ |
| Backup | /api/v1/backup/ |

# SEO Dashboard

پنل مدیریت SEO سازمانی — Enterprise SEO Management Dashboard

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 5, DRF, Celery, Redis, MySQL 8 |
| Frontend | Next.js 14, TypeScript, Tailwind, Shadcn/UI |
| Infrastructure | Docker, Nginx, GitHub Actions, Certbot |

## Quick Start (Development)

```bash
# Clone
git clone https://github.com/your-username/seo-dashboard.git
cd seo-dashboard

# Setup environment
cp .env.example .env
# Edit .env with your values

# Start with Make
make dev

# OR manually:
docker-compose up -d db redis

# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements/development.txt
python manage.py migrate
python manage.py seed_permissions
python manage.py seed_initial_data
python manage.py setup_periodic_tasks
python manage.py runserver

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1/ |
| Admin Panel | http://localhost:8000/admin/ |
| Health Check | http://localhost:8000/api/v1/monitoring/health/ |

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Developer | admin@seodashboard.com | Admin1234! |

## Production Deploy

```bash
# 1. Setup server
cp .env.prod.example .env.prod
nano .env.prod

# 2. SSL Certificate
make ssl DOMAIN=your-domain.com EMAIL=admin@your-domain.com

# 3. Deploy
make deploy
```

## API Endpoints

| Module | Base URL |
|--------|----------|
| Auth | `/api/v1/auth/` |
| Users | `/api/v1/users/` |
| RBAC | `/api/v1/rbac/` |
| Projects | `/api/v1/projects/` |
| SEO | `/api/v1/seo/` |
| GSC | `/api/v1/gsc/` |
| Feedback | `/api/v1/feedback/` |
| KPI | `/api/v1/kpi/` |
| Dashboard | `/api/v1/dashboard/` |
| Reports | `/api/v1/reports/` |
| AI | `/api/v1/ai/` |
| Monitoring | `/api/v1/monitoring/` |
| Backup | `/api/v1/backup/` |

## Architecture
seo-dashboard/
├── backend/ Django + DRF
│ ├── apps/
│ │ ├── core/ Base models, middleware, utils
│ │ ├── users/ User management
│ │ ├── authentication/ JWT + OAuth2
│ │ ├── rbac/ Roles + Permissions
│ │ ├── projects/ Project management
│ │ ├── seo/ SEO data analysis
│ │ ├── gsc/ Google Search Console
│ │ ├── feedback/ Feedback system
│ │ ├── notifications/ Notification center
│ │ ├── kpi/ KPI tracking
│ │ ├── dashboard/ Dashboard builder
│ │ ├── reports/ Report generation
│ │ ├── ai/ AI integration
│ │ ├── monitoring/ System monitoring
│ │ └── backup/ Backup & restore
│ └── config/ Django settings
├── frontend/ Next.js 14
│ └── src/
│ ├── app/ Pages (App Router)
│ ├── components/ UI components
│ ├── lib/ API, hooks, utils
│ ├── store/ Zustand state
│ └── types/ TypeScript types
├── nginx/ Nginx config
├── docker/ Dockerfiles
└── .github/ CI/CD workflows


## Testing

```bash
# Backend
cd backend
pytest --cov=apps -v

# Frontend
cd frontend
npm test
npm run type-check
npm run build
```