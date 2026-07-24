import uuid
import hashlib
from django.utils import timezone


def generate_unique_token():
    return hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def get_user_agent(request):
    return request.META.get('HTTP_USER_AGENT', '')


def make_aware_datetime(dt):
    if timezone.is_naive(dt):
        return timezone.make_aware(dt)
    return dt