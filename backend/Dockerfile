# FROM python:3.12-slim

# ENV PYTHONDONTWRITEBYTECODE=1
# ENV PYTHONUNBUFFERED=1
# ENV DJANGO_SETTINGS_MODULE=config.settings.production

# WORKDIR /app

# RUN apt-get update && apt-get install -y \
#     default-libmysqlclient-dev \
#     gcc \
#     pkg-config \
#     netcat-openbsd \
#     && rm -rf /var/lib/apt/lists/*

# COPY requirements/ requirements/
# RUN pip install --no-cache-dir -r requirements/production.txt

# COPY . .

# RUN mkdir -p logs media staticfiles backups

# COPY scripts/entrypoint.sh /entrypoint.sh
# RUN chmod +x /entrypoint.sh

# EXPOSE 8000

# ENTRYPOINT ["/entrypoint.sh"]

##
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

FROM base AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    gcc \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements/ requirements/
RUN pip install --user --no-cache-dir -r requirements/production.txt

FROM base AS runner

ENV DJANGO_SETTINGS_MODULE=config.settings.production

RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    netcat-openbsd \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

COPY . .

RUN mkdir -p logs media staticfiles backups

COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN addgroup --system --gid 1001 django && \
    adduser --system --uid 1001 --gid 1001 django && \
    chown -R django:django /app

USER django

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]