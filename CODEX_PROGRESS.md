# Codex Progress

این فایل برای ادامه دادن کار بدون خواندن دوباره کل پروژه است.

## وضعیت فعلی

- پروژه در مسیر `C:\Users\Mohammad\Documents\ChatGPT\SEO Dashboard` بررسی شد.
- هدف فعلی: آماده کردن Docker برای اجرای پایدار و بعد تست دکمه‌های UI.
- Docker لوکال فعلاً کنار گذاشته شده؛ تست نهایی قرار است بعداً روی VPS یا وقتی Docker daemon آماده بود انجام شود.

## نقشه راه توسعه تا استقرار Linux

### Milestone 0: تثبیت محدوده و محیط توسعه

- [x] مشخص کردن مقادیر محیطی توسعه، staging و production.
- [x] اطمینان از اینکه secretها داخل Git، image یا فایل‌های عمومی commit نمی‌شوند.
- [x] ثبت ابزارهای مورد نیاز در مستندات و فایل‌های Compose.
- [x] آماده‌سازی branch اصلی برای ثبت تغییرات قابل بازگشت.

### Milestone 1: Smoke Test زیرساخت Docker

- [x] رفع مشکل line ending فایل `entrypoint.sh`.
- [x] اضافه کردن `.gitattributes` برای نگه‌داشتن `LF` فایل‌های shell.
- [x] اصلاح نصب dependencyهای Python در image.
- [x] اضافه کردن dependencyهای development Docker.
- [x] جلوگیری از اجرای همزمان migration توسط backend و workerها.
- [x] ساخت migrationهای اولیه appهای Django.
- [ ] اجرای موفق `docker compose up --build -d` روی محیطی که Docker daemon فعال دارد؛ Docker daemon این محیط در دسترس نبود.
- [ ] بررسی وضعیت همه سرویس‌ها و logهای backend، frontend و nginx روی Docker فعال.
- [ ] تست health check، API و دسترسی فرانت از طریق nginx روی Docker فعال.
- [x] اعتبارسنجی syntax فرانت و Compose development/production.

### Milestone 2: تکمیل و اعتبارسنجی Backend

- [ ] اجرای migration و commandهای seed/setup در محیط تازه.
- [ ] تست register، login، JWT refresh/logout و دسترسی endpointهای محافظت‌شده.
- [ ] تست CRUD پروژه‌ها و انتخاب پروژه فعال.
- [ ] تست endpointهای SEO، GSC، KPI، report و monitoring در حالت داده‌دار و بدون داده.
- [ ] بررسی CORS، CSRF، allowed hosts و خطاهای API در حالت production-like.
- [ ] افزودن یا تکمیل تست‌های خودکار برای مسیرهای حیاتی.

### Milestone 3: تکمیل و اعتبارسنجی Frontend

- [ ] تست navigation sidebar و نمایش صحیح بخش‌ها.
- [ ] تست ذخیره و استفاده از API base.
- [ ] تست register، login و logout.
- [ ] تست باز کردن فرم پروژه، ساخت پروژه و تغییر پروژه فعال.
- [ ] تست refresh data و نمایش loading، empty state و error state.
- [ ] تست رفتار UI در viewport دسکتاپ و موبایل.
- [ ] اصلاح خطاهای JavaScript، نمایش پیام‌ها و مدیریت token در مرورگر.

### Milestone 4: یکپارچه‌سازی کامل و آماده‌سازی Production

- [ ] اجرای تست end-to-end از ورود تا ساخت پروژه و refresh داده.
- [ ] بررسی اتصال frontend → nginx → backend و backend → MySQL/Redis.
- [ ] مشخص کردن strategy برای backup دیتابیس و فایل‌های media/static.
- [ ] تنظیم logging قابل پیگیری و health checks برای سرویس‌ها.
- [ ] ساخت imageهای نهایی بدون dependency غیرضروری development.
- [ ] بررسی امنیتی تنظیمات production: DEBUG، secret key، HTTPS، cookies، CORS و firewall.
- [ ] مستندسازی rollback، restore backup و روش restart سرویس‌ها.

### Milestone 5: استقرار روی Linux Server

- [ ] آماده‌سازی سرور Linux، DNS، کاربر deploy و دسترسی SSH با کلید.
- [ ] نصب Docker Engine و Docker Compose Plugin و فعال‌سازی restart policy.
- [ ] انتقال repository و فایل production environment خارج از Git.
- [ ] تنظیم دامنه، reverse proxy و HTTPS با certificate معتبر.
- [ ] اجرای deploy اولیه با `docker compose up --build -d`.
- [ ] اجرای migration، seed/setupهای لازم و ساخت superuser در صورت نیاز.
- [ ] تست عمومی دامنه، health endpoint، login، ساخت پروژه و بارگذاری dashboard.
- [ ] بررسی logها، مصرف منابع، persistence volumeها و backup قابل بازیابی.
- [ ] ثبت نسخه deploy‌شده، زمان deploy و روش rollback.

### Milestone 6: تحویل و نگهداری پس از Deploy

- [ ] انجام smoke test نهایی بعد از deploy و ثبت نتیجه.
- [ ] فعال‌سازی مانیتورینگ uptime و هشدار برای health check یا توقف سرویس‌ها.
- [ ] تعریف روال انتشار نسخه‌های بعدی و اجرای migrationها.
- [ ] تعریف برنامه backup منظم و تست دوره‌ای restore.
- [ ] بستن این milestone فقط بعد از تأیید عملکرد پایدار روی Linux server.

## وضعیت اجرای این برنامه

- Milestoneهای 0 و بخش‌های قابل اجرای محلی از 1 و 4 تکمیل شدند.
- اجرای واقعی backend، مرورگر، Docker و Linux server هنوز نیازمند محیط اجرایی فعال است.
- Milestoneهای 2، 3، 5 و 6 عمداً تا اجرای واقعی و ثبت نتیجه روی سرور تکمیل علامت نخورده‌اند.

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
