from rest_framework import status
from rest_framework.views import APIView
from apps.core.mixins import ResponseMixin
from apps.core.permissions import IsDeveloper, IsCompanyManager
from .serializers import (
    PermissionSerializer, CreatePermissionSerializer,
    RoleSerializer, RoleListSerializer, CreateRoleSerializer, UpdateRolePermissionsSerializer,
    UserRoleSerializer, AssignRoleSerializer, ChangeUserRoleSerializer,
    FeatureFlagSerializer, CreateFeatureFlagSerializer, ToggleSerializer,
    PluginSerializer, PluginConfigSerializer, PluginToggleSerializer,
)
from .services import (
    PermissionService, RoleService, UserRoleService,
    FeatureFlagService, PluginService,
)
from .repositories import UserRoleRepository


class PermissionListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        module = request.query_params.get('module')
        service = PermissionService()
        permissions = service.list_permissions(module=module)
        serializer = PermissionSerializer(permissions, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request):
        serializer = CreatePermissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = PermissionService()
        permission = service.create_permission(**serializer.validated_data)
        return self.success_response(
            data=PermissionSerializer(permission).data,
            status_code=status.HTTP_201_CREATED,
        )


class RoleListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        service = RoleService()
        roles = service.list_roles()
        serializer = RoleListSerializer(roles, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request):
        serializer = CreateRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = RoleService()
        role = service.create_role(**serializer.validated_data)
        return self.success_response(
            data=RoleSerializer(role).data,
            status_code=status.HTTP_201_CREATED,
        )


class RoleDetailView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request, role_id):
        service = RoleService()
        role = service.get_role(role_id)
        return self.success_response(data=RoleSerializer(role).data)

    def delete(self, request, role_id):
        service = RoleService()
        service.delete_role(role_id, request.user)
        return self.success_response(message='Role deleted successfully.')


class RolePermissionsView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def put(self, request, role_id):
        serializer = UpdateRolePermissionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = RoleService()
        role = service.update_role_permissions(
            role_id=role_id,
            permission_ids=serializer.validated_data['permission_ids'],
            requesting_user=request.user,
        )
        return self.success_response(
            data=RoleSerializer(role).data,
            message='Role permissions updated successfully.',
        )


class AssignRoleView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def post(self, request):
        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = UserRoleService()
        user_role = service.assign_role_to_user(
            user_id=serializer.validated_data['user_id'],
            role_id=serializer.validated_data['role_id'],
            requesting_user=request.user,
        )
        return self.success_response(
            data=UserRoleSerializer(user_role).data,
            message='Role assigned successfully.',
            status_code=status.HTTP_201_CREATED,
        )


class RemoveRoleView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def delete(self, request, user_id, role_id):
        service = UserRoleService()
        service.remove_role_from_user(user_id, role_id, request.user)
        return self.success_response(message='Role removed successfully.')


class ChangeUserRoleView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def patch(self, request, user_id):
        serializer = ChangeUserRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = UserRoleService()
        user = service.change_user_role(
            user_id=user_id,
            new_role=serializer.validated_data['role'],
            requesting_user=request.user,
        )
        from apps.users.serializers import UserSerializer
        return self.success_response(
            data=UserSerializer(user).data,
            message='User role changed successfully.',
        )


class UserPermissionsView(ResponseMixin, APIView):
    def get(self, request):
        service = UserRoleService()
        permissions = service.get_user_permissions(request.user)
        serializer = PermissionSerializer(permissions, many=True)
        return self.success_response(data={
            'role': request.user.role,
            'permissions': serializer.data,
        })


class FeatureFlagListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        service = FeatureFlagService()
        flags = service.list_flags()
        serializer = FeatureFlagSerializer(flags, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request):
        serializer = CreateFeatureFlagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = FeatureFlagService()
        flag = service.create_flag(**serializer.validated_data)
        return self.success_response(
            data=FeatureFlagSerializer(flag).data,
            status_code=status.HTTP_201_CREATED,
        )


class FeatureFlagDetailView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request, slug):
        service = FeatureFlagService()
        flag = service.get_flag(slug)
        return self.success_response(data=FeatureFlagSerializer(flag).data)

    def patch(self, request, slug):
        service = FeatureFlagService()
        allowed_fields = ('name', 'description', 'allowed_roles', 'metadata')
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        flag = service.update_flag(slug, data, request.user)
        return self.success_response(data=FeatureFlagSerializer(flag).data)


class FeatureFlagToggleView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def post(self, request, slug):
        serializer = ToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = FeatureFlagService()
        flag = service.toggle_flag(slug, serializer.validated_data['enabled'], request.user)
        return self.success_response(
            data=FeatureFlagSerializer(flag).data,
            message=f'Feature flag {"enabled" if flag.is_enabled else "disabled"}.',
        )


class FeatureFlagCheckView(ResponseMixin, APIView):
    def get(self, request, slug):
        service = FeatureFlagService()
        is_enabled = service.is_enabled_for_user(slug, request.user)
        return self.success_response(data={'slug': slug, 'enabled': is_enabled})


class PluginListView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request):
        service = PluginService()
        plugins = service.list_plugins()
        serializer = PluginSerializer(plugins, many=True)
        return self.success_response(data=serializer.data)


class PluginDetailView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def get(self, request, slug):
        service = PluginService()
        plugin = service.get_plugin(slug)
        return self.success_response(data=PluginSerializer(plugin).data)


class PluginToggleView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def post(self, request, slug):
        serializer = PluginToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = PluginService()
        plugin = service.toggle_plugin(slug, serializer.validated_data['active'], request.user)
        return self.success_response(
            data=PluginSerializer(plugin).data,
            message=f'Plugin {"activated" if plugin.is_active else "deactivated"}.',
        )


class PluginConfigView(ResponseMixin, APIView):
    permission_classes = [IsDeveloper]

    def put(self, request, slug):
        serializer = PluginConfigSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = PluginService()
        plugin = service.update_plugin_config(slug, serializer.validated_data['config'], request.user)
        return self.success_response(
            data=PluginSerializer(plugin).data,
            message='Plugin config updated.',
        )