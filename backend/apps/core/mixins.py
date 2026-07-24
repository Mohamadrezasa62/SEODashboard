from rest_framework.response import Response
from rest_framework import status


class ResponseMixin:
    def success_response(self, data=None, message='', status_code=status.HTTP_200_OK):
        return Response({
            'success': True,
            'message': message,
            'data': data,
        }, status=status_code)

    def error_response(self, message='', errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        return Response({
            'success': False,
            'message': message,
            'errors': errors,
        }, status=status_code)


class SerializerByActionMixin:
    serializer_classes = {}

    def get_serializer_class(self):
        return self.serializer_classes.get(self.action, super().get_serializer_class())