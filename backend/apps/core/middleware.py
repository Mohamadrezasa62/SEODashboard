import logging
import time
import json
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from apps.core.utils import get_client_ip, get_user_agent

logger = logging.getLogger('apps')


class RequestLoggingMiddleware(MiddlewareMixin):
    EXCLUDED_PATHS = ('/api/v1/monitoring/health/', '/static/', '/media/')

    def process_request(self, request):
        request._start_time = time.time()

    def process_response(self, request, response):
        if any(request.path.startswith(p) for p in self.EXCLUDED_PATHS):
            return response

        duration = time.time() - getattr(request, '_start_time', time.time())
        logger.info(
            'method=%s path=%s status=%s duration=%.3fs ip=%s',
            request.method,
            request.path,
            response.status_code,
            duration,
            get_client_ip(request),
        )
        return response


class AuditMiddleware(MiddlewareMixin):
    AUDITED_METHODS = ('POST', 'PUT', 'PATCH', 'DELETE')
    EXCLUDED_PATHS = ('/api/v1/auth/token/refresh/', '/api/v1/monitoring/')

    def process_request(self, request):
        if (
            request.method in self.AUDITED_METHODS
            and request.user.is_authenticated
            and not any(request.path.startswith(p) for p in self.EXCLUDED_PATHS)
        ):
            request._audit_user = request.user
            request._audit_ip = get_client_ip(request)
            request._audit_user_agent = get_user_agent(request)


class SecurityHeadersMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
        return response


class HealthCheckMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.path == '/health/':
            return JsonResponse({'status': 'ok'})


class CORSDebugMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if hasattr(request, 'user') and request.user.is_authenticated:
            response['X-User-Role'] = getattr(request.user, 'role', 'unknown')
        return response