import django
import os
import pytest

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')


def pytest_configure(config):
    django.setup()


@pytest.fixture(autouse=True)
def disable_throttling(settings):
    """
    در زمان تست، throttling کاملاً غیرفعال می‌شود
    تا خطاهای 429 ایجاد نشود.
    """
    drf_settings = getattr(settings, 'REST_FRAMEWORK', {}).copy()
    drf_settings['DEFAULT_THROTTLE_CLASSES'] = []
    drf_settings['DEFAULT_THROTTLE_RATES'] = {}
    settings.REST_FRAMEWORK = drf_settings


@pytest.fixture(autouse=True)
def reset_cache(settings):
    """
    Cache را قبل از هر تست reset می‌کند
    تا throttle counters از تست قبلی باقی نماند.
    """
    from django.core.cache import cache
    cache.clear()
    yield
    cache.clear()