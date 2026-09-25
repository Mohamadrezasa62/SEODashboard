# Codex Progress

این فایل برای ادامه دادن کار بدون خواندن دوباره کل پروژه است.

## وضعیت فعلی

- پروژه در مسیر `C:\Users\Mohammad\Documents\ChatGPT\SEO Dashboard` بررسی شد.
- هدف فعلی: آماده کردن Docker برای اجرای پایدار و بعد تست دکمه‌های UI.
- Docker لوکال فعلاً کنار گذاشته شده؛ تست نهایی قرار است بعداً روی VPS یا وقتی Docker daemon آماده بود انجام شود.

## Milestone 1: Smoke Test UI

### انجام شده

- مشکل اولیه Docker Hub `403 Forbidden` در اجرای بعدی تکرار نشد.
- مشکل `exec /entrypoint.sh: no such file or directory` بررسی شد.
- علت: فایل `backend/scripts/entrypoint.sh` با line ending ویندوزی `CRLF` بود.
- فایل `entrypoint.sh` به `LF` نرمال شد.
- فایل `.gitattributes` اضافه شد تا `backend/scripts/*.sh` همیشه با `LF` ذخیره شود.
- مشکل `ModuleNotFoundError: No module named 'django'` بررسی شد.
- علت: در `backend/Dockerfile` پکیج‌ها با `pip install --user` برای `/root/.local` نصب می‌شدند، ولی runtime با کاربر `django` اجرا می‌شد.
- Dockerfile اصلاح شد تا پکیج‌ها با `--prefix=/install` نصب و بعد به `/usr/local` کپی شوند.
- مشکل `ModuleNotFoundError: No module named 'debug_toolbar'` بررسی شد.
- علت: compose از `config.settings.development` استفاده می‌کرد، اما image فقط requirements production را نصب می‌کرد.
- فایل `backend/requirements/docker-dev.txt` اضافه شد: شامل `base.txt`، `django-debug-toolbar` و `gunicorn`.
- `docker-compose.yml` اصلاح شد تا سرویس‌های Python از `docker-dev.txt` استفاده کنند.
- مشکل اجرای همزمان migration توسط backend و celeryها بررسی شد.
- `entrypoint.sh` اصلاح شد تا migration/static فقط وقتی `RUN_MIGRATIONS=true` باشد اجرا شود.
- در `docker-compose.yml` فقط سرویس `backend` مقدار `RUN_MIGRATIONS: "true"` گرفت.
- migrations اولیه برای appهای Django ساخته شد.

### مانده

- وقتی Docker روی VPS یا لوکال آماده بود:
  - `docker compose up --build -d`
  - `docker compose ps`
  - `docker compose logs --tail=120 backend frontend nginx`
  - تست `http://localhost/`
  - تست API health و auth

## Milestone 2: Button Inventory

- باید همه دکمه‌ها/فرم‌های `frontend/public/index.html` تست شوند:
  - navigation sidebar
  - ذخیره API base
  - register
  - login
  - logout
  - باز کردن فرم پروژه جدید
  - ساخت پروژه
  - تغییر پروژه فعال
  - refresh data

## Milestone 3: Browser Reproduction

- بعد از بالا آمدن backend، هر action باید با مرورگر تست شود.
- اگر Chrome/Computer Use در محیط در دسترس نبود، تست با in-app browser یا ابزارهای CLI/API انجام شود.

## نکته‌های مهم

- اگر backend در logs خطای `gunicorn: not found` داد، یعنی image قدیمی است یا `docker-dev.txt` داخل build استفاده نشده.
- اگر celeryها migration اجرا کردند، یعنی `RUN_MIGRATIONS` اشتباه به آنها رسیده.
- اگر دیتابیس خطای `Duplicate column` داد، دیتابیس volume از اجرای نیمه‌کاره قبلی آلوده است. روی محیط تازه/VPS احتمالاً رخ نمی‌دهد. برای محیط dev تازه، `docker compose down -v` مشکل را پاک می‌کند، ولی این دستور دیتابیس لوکال را حذف می‌کند.

## فایل‌های تغییر داده شده

- `.gitattributes`
- `backend/Dockerfile`
- `backend/scripts/entrypoint.sh`
- `backend/requirements/docker-dev.txt`
- `docker-compose.yml`
- `backend/apps/**/migrations/*.py`

