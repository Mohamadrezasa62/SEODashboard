import hashlib
import json
from functools import wraps
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 60 * 5  # 5 minutes


def make_cache_key(*args, **kwargs):
    key_data = json.dumps({'args': args, 'kwargs': kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode()).hexdigest()


def cache_response(timeout=DEFAULT_TIMEOUT, key_prefix=''):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = f'{key_prefix}:{make_cache_key(*args, **kwargs)}'
            cached = cache.get(cache_key)
            if cached is not None:
                return cached
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator


def invalidate_cache_prefix(prefix):
    try:
        keys = cache.keys(f'{prefix}:*')
        if keys:
            cache.delete_many(keys)
    except Exception as e:
        logger.warning('Cache invalidation failed: %s', e)


class SEODataCache:
    PREFIX = 'seo'
    TIMEOUT = 60 * 15  # 15 minutes

    @classmethod
    def get_key(cls, project_id, data_type, **filters):
        filter_str = json.dumps(filters, sort_keys=True, default=str)
        key_hash = hashlib.md5(f'{project_id}:{data_type}:{filter_str}'.encode()).hexdigest()
        return f'{cls.PREFIX}:{key_hash}'

    @classmethod
    def get(cls, project_id, data_type, **filters):
        key = cls.get_key(project_id, data_type, **filters)
        return cache.get(key)

    @classmethod
    def set(cls, data, project_id, data_type, **filters):
        key = cls.get_key(project_id, data_type, **filters)
        cache.set(key, data, cls.TIMEOUT)

    @classmethod
    def invalidate_project(cls, project_id):
        try:
            pattern = f'{cls.PREFIX}:*'
            keys = cache.keys(pattern)
            if keys:
                cache.delete_many(keys)
        except Exception:
            pass


class DashboardCache:
    PREFIX = 'dashboard'
    TIMEOUT = 60 * 10  # 10 minutes

    @classmethod
    def get_key(cls, user_id, dashboard_id=None):
        if dashboard_id:
            return f'{cls.PREFIX}:user:{user_id}:dash:{dashboard_id}'
        return f'{cls.PREFIX}:user:{user_id}:list'

    @classmethod
    def get(cls, user_id, dashboard_id=None):
        return cache.get(cls.get_key(user_id, dashboard_id))

    @classmethod
    def set(cls, data, user_id, dashboard_id=None):
        cache.set(cls.get_key(user_id, dashboard_id), data, cls.TIMEOUT)

    @classmethod
    def invalidate_user(cls, user_id):
        keys = [
            cls.get_key(user_id),
            f'{cls.PREFIX}:user:{user_id}:*',
        ]
        cache.delete_many(keys)