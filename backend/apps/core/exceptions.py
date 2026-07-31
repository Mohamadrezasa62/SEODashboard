import logging
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


class ServiceException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'A service error occurred.'
    default_code = 'service_error'

    def __init__(self, detail=None, code=None):
        if detail is not None:
            self.detail = self._validate_detail(detail)
        else:
            self.detail = self._validate_detail(self.default_detail)


class PermissionDeniedException(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'permission_denied'

    def __init__(self, detail=None, code=None):
        if detail is not None:
            self.detail = self._validate_detail(detail)
        else:
            self.detail = self._validate_detail(self.default_detail)


class NotFoundException(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'The requested resource was not found.'
    default_code = 'not_found'

    def __init__(self, detail=None, code=None):
        if detail is not None:
            self.detail = self._validate_detail(detail)
        else:
            self.detail = self._validate_detail(self.default_detail)


class ConflictException(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'A conflict occurred.'
    default_code = 'conflict'

    def __init__(self, detail=None, code=None):
        if detail is not None:
            self.detail = self._validate_detail(detail)
        else:
            self.detail = self._validate_detail(self.default_detail)


class ValidationException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid data provided.'
    default_code = 'validation_error'

    def __init__(self, detail=None, code=None):
        if detail is not None:
            self.detail = self._validate_detail(detail)
        else:
            self.detail = self._validate_detail(self.default_detail)


def custom_exception_handler(exc, context):
    from django.core.exceptions import ValidationError as DjangoValidationError
    from rest_framework.exceptions import ValidationError as DRFValidationError

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