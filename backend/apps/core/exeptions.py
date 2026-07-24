import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    if isinstance(exc, DjangoValidationError):
        exc = DRFValidationError(detail=exc.messages)

    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'success': False,
            'message': _get_error_message(response.data),
            'errors': response.data,
        }
        response.data = error_data
    else:
        logger.exception('Unhandled exception', exc_info=exc)
        response = Response({
            'success': False,
            'message': 'Internal server error.',
            'errors': None,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response


def _get_error_message(data):
    if isinstance(data, dict):
        if 'detail' in data:
            return str(data['detail'])
        first_key = next(iter(data))
        first_val = data[first_key]
        if isinstance(first_val, list):
            return str(first_val[0])
        return str(first_val)
    if isinstance(data, list):
        return str(data[0])
    return str(data)


class ServiceException(Exception):
    def __init__(self, message, code=None):
        self.message = message
        self.code = code
        super().__init__(message)


class PermissionDeniedException(ServiceException):
    pass


class NotFoundException(ServiceException):
    pass


class ConflictException(ServiceException):
    pass