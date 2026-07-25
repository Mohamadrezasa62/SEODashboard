from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.core.mixins import ResponseMixin
from apps.core.permissions import IsDeveloper, IsCompanyManager
from .serializers import (
    UserSerializer, UserListSerializer,
    UpdateProfileSerializer, ChangePasswordSerializer, CreateUserSerializer,
)
from .services import UserService


class MeView(ResponseMixin, APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return self.success_response(data=serializer.data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = UserService()
        avatar = request.FILES.get('avatar')
        user = service.update_profile(request.user, serializer.validated_data, avatar=avatar)
        return self.success_response(
            data=UserSerializer(user).data,
            message='Profile updated successfully.',
        )


class ChangePasswordView(ResponseMixin, APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = UserService()
        service.change_password(
            request.user,
            serializer.validated_data['old_password'],
            serializer.validated_data['new_password'],
        )
        return self.success_response(message='Password changed successfully.')


class UserListView(ResponseMixin, APIView):
    permission_classes = [IsCompanyManager]

    def get(self, request):
        service = UserService()
        role = request.query_params.get('role')
        search = request.query_params.get('search')
        users = service.list_users(role=role, search=search)
        serializer = UserListSerializer(users, many=True)
        return self.success_response(data=serializer.data)


class UserCreateView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from .repositories import UserRepository
        user = UserRepository.create_user(**serializer.validated_data)
        return self.success_response(
            data=UserSerializer(user).data,
            message='User created successfully.',
            status_code=status.HTTP_201_CREATED,
        )


class UserDetailView(ResponseMixin, APIView):
    permission_classes = [IsCompanyManager]

    def get(self, request, user_id):
        service = UserService()
        user = service.get_user_by_id(user_id)
        serializer = UserSerializer(user)
        return self.success_response(data=serializer.data)

    def delete(self, request, user_id):
        service = UserService()
        user = service.get_user_by_id(user_id)
        service.deactivate_user(user, request.user)
        return self.success_response(message='User deactivated successfully.')