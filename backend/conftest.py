import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')


def pytest_configure(config):
    django.setup()