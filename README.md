# SEO Dashboard MVP

نسخه فعلی پروژه از حالت release/production خارج شده و به یک MVP ساده تبدیل شده است. بک‌اند Django/DRF همان ساختار قبلی را حفظ کرده، اما فرانت‌اند دیگر Next.js، React، Tailwind یا هیچ فریم‌ورک دیگری ندارد و فقط با HTML، CSS و JavaScript خام اجرا می‌شود.

## قابلیت‌های MVP

- ورود و ثبت‌نام با API فعلی بک‌اند
- ذخیره توکن JWT در مرورگر برای استفاده ساده در توسعه
- ساخت و مشاهده پروژه‌ها
- انتخاب پروژه فعال
- نمایش خلاصه SEO، روند کلیک، دستگاه‌ها، کلمات کلیدی و صفحات برتر در صورت وجود داده
- نمایش KPI ها و گزارش‌های پروژه در صورت وجود داده
- نمایش health check سیستم
- تنظیم دستی آدرس API از داخل رابط کاربری

## ساختار مهم

```text
backend/                 Django + DRF بدون تغییر معماری اصلی
frontend/public/          فرانت MVP با HTML/CSS/JS خام
frontend/package.json     فقط برای اجرای local static server
frontend/Dockerfile       سرو فرانت با nginx سبک
docker-compose.yml        اجرای MySQL، Redis، Backend، Celery، Frontend و nginx
nginx/conf.d/default.conf پروکسی توسعه روی HTTP ساده
.env.example              نمونه تنظیمات توسعه
```

## فعال‌سازی سریع با Docker

از ریشه پروژه اجرا کنید:

```bash
cd "C:\Users\Salmani\Desktop\Salmani\Social Projects\SEODashboard"
copy .env.example .env

docker compose up --build
```

## استقرار روی Linux

برای استقرار production روی Linux، ابتدا repository را روی سرور قرار دهید و فایل محیطی را خارج از Git بسازید:

```bash
cp .env.prod.example .env.prod
chmod 600 .env.prod
# همه placeholderها را در .env.prod با مقدار واقعی جایگزین کنید
docker compose -f docker-compose.prod.yml --env-file .env.prod build
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

قبل از اجرای production، دامنه را در `nginx/conf.d/prod.conf` جایگزین کنید و certificateهای TLS را در volumeهای تعریف‌شده قرار دهید. سپس migration و seed را اجرا کنید:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec backend python manage.py migrate --noinput
docker compose -f docker-compose.prod.yml --env-file .env.prod exec backend python manage.py collectstatic --noinput
docker compose -f docker-compose.prod.yml --env-file .env.prod exec backend python manage.py seed_permissions
docker compose -f docker-compose.prod.yml --env-file .env.prod exec backend python manage.py seed_initial_data
docker compose -f docker-compose.prod.yml --env-file .env.prod exec backend python manage.py setup_periodic_tasks
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

فایل `.env.prod` و certificateها نباید commit شوند. قبل از اعلام موفقیت deploy، health endpoint، ورود، ساخت پروژه، dashboard، logها و backup قابل restore را تست کنید.

بعد از بالا آمدن سرویس‌ها، در یک ترمینال دیگر آماده‌سازی دیتابیس را انجام دهید:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_permissions
docker compose exec backend python manage.py seed_initial_data
docker compose exec backend python manage.py setup_periodic_tasks
```

اگر کاربر مدیر آماده نشد، یک superuser بسازید:

```bash
docker compose exec backend python manage.py createsuperuser
```

## آدرس‌ها

| بخش | آدرس |
|---|---|
| فرانت MVP | http://localhost:3000 |
| فرانت از پشت nginx | http://localhost |
| API بک‌اند | http://localhost:8000/api/v1/ |
| پنل ادمین Django | http://localhost:8000/admin/ |
| سلامت سیستم | http://localhost:8000/api/v1/monitoring/health/ |

## اجرای فرانت بدون Docker

اگر فقط می‌خواهید فرانت ساده را ببینید:

```bash
cd frontend
npm install
npm run dev
```

سپس http://localhost:3000 را باز کنید. برای استفاده واقعی از داشبورد، بک‌اند هم باید روی http://localhost:8000/api/v1 فعال باشد.

## اجرای بک‌اند بدون Docker

ابتدا MySQL و Redis باید روی سیستم فعال باشند و مقدارهای `.env` با آن‌ها هماهنگ باشد.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements/development.txt
python manage.py migrate
python manage.py seed_permissions
python manage.py seed_initial_data
python manage.py runserver
```

## نکته‌های استفاده

1. وارد فرانت شوید یا از فرم ثبت‌نام حساب بسازید.
2. از بخش پروژه‌ها یک پروژه جدید اضافه کنید.
3. پروژه فعال را از نوار بالای داشبورد انتخاب کنید.
4. اگر داده SEO/GSC/KPI/Report در بک‌اند وجود داشته باشد، جدول‌ها و نمودارهای ساده پر می‌شوند.
5. اگر API شما روی آدرس دیگری است، از کادر «آدرس API» در منوی کناری آن را تغییر دهید.

## تغییرات MVP

- فرانت سنگین Next.js از مسیر اجرا کنار گذاشته شد.
- فرانت جدید در `frontend/public` ساخته شد.
- `frontend/Dockerfile` به nginx سبک تغییر کرد.
- مسیرهای اشتباه Docker compose برای Dockerfileهای ناموجود اصلاح شد.
- nginx توسعه دیگر اجبار HTTPS ندارد و برای MVP روی HTTP ساده کار می‌کند.
- تکرارهای واضح `backend/apps/authentication/views.py` حذف شد.
