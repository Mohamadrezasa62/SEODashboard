import logging
import time
from django.utils.deprecation import MiddlewareMixin
from apps.core.utils import get_client_ip, get_user_agent

logger = logging.getLogger('apps')


class RequestLoggingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._start_time = time.time()

    def process_response(self, request, response):
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

    def process_request(self, request):
        if request.method in self.AUDITED_METHODS and request.user.is_authenticated:
            request._audit_user = request.user
            request._audit_ip = get_client_ip(request)
            request._audit_user_agent = get_user_agent(request)