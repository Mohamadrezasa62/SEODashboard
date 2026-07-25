from apps.core.exceptions import NotFoundException, ConflictException, ServiceException, PermissionDeniedException
from apps.users.repositories import UserRepository, ActivityLogRepository
from .repositories import (
    PermissionRepository, RoleRepository, UserRoleRepository,
    FeatureFlagRepository, PluginRepository,
)


class PermissionService:
    def list_permissions(self, module=None):
        if module:
            return PermissionRepository.get_by_module(module)
        return PermissionRepository.get_all()

    def create_permission(self, codename, name, module, description=None):
        existing = PermissionRepository.get_by_codename(codename)
        if existing:
            raise ConflictException(f'Permission with codename "{codename}" already exists.')
        return PermissionRepository.create(codename, name, module, description)


class RoleService:
    def list_roles(self):
        return RoleRepository.get_all()

    def get_role(self, role_id):
        role = RoleRepository.get_by_id(role_id)
        if not role:
            raise NotFoundException('Role not found.')
        return role

    def create_role(self, name, slug, description=None):
        if RoleRepository.get_by_slug(slug):
            raise ConflictException(f'Role with slug "{slug}" already exists.')
        return RoleRepository.create(name, slug, description)

    def update_role_permissions(self, role_id, permission_ids, requesting_user):
        role = self.get_role(role_id)
        if role.is_system:
            raise ServiceException('Cannot modify permissions of a system role.')
        RoleRepository.set_permissions(role, permission_ids)
        ActivityLogRepository.log(
            user=requesting_user,
            action='permission_change',
            description=f'Updated permissions for role: {role.name}',
        )
        return role

    def delete_role(self, role_id, requesting_user):
        role = self.get_role(role_id)
        if role.is_system:
            raise ServiceException('Cannot delete a system role.')
        role.delete()
        ActivityLogRepository.log(
            user=requesting_user,
            action='delete',
            description=f'Deleted role: {role.name}',
        )


class UserRoleService:
    def assign_role_to_user(self, user_id, role_id, requesting_user):
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise NotFoundException('User not found.')

        role = RoleRepository.get_by_id(role_id)
        if not role:
            raise NotFoundException('Role not found.')

        obj, created = UserRoleRepository.assign_role(
            user=user, role=role, assigned_by=requesting_user
        )
        if not created:
            raise ConflictException('User already has this role.')

        ActivityLogRepository.log(
            user=requesting_user,
            action='permission_change',
            description=f'Assigned role {role.name} to {user.email}',
        )
        return obj

    def remove_role_from_user(self, user_id, role_id, requesting_user):
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise NotFoundException('User not found.')

        role = RoleRepository.get_by_id(role_id)
        if not role:
            raise NotFoundException('Role not found.')

        UserRoleRepository.remove_role(user, role)
        ActivityLogRepository.log(
            user=requesting_user,
            action='permission_change',
            description=f'Removed role {role.name} from {user.email}',
        )

    def get_user_permissions(self, user):
        return UserRoleRepository.get_user_permissions(user)

    def change_user_role(self, user_id, new_role, requesting_user):
        if requesting_user.role != 'developer':
            raise PermissionDeniedException('Only developers can change user roles.')

        user = UserRepository.get_by_id(user_id)
        if not user:
            raise NotFoundException('User not found.')

        valid_roles = ('developer', 'company_manager', 'employee')
        if new_role not in valid_roles:
            raise ServiceException(f'Invalid role. Must be one of: {", ".join(valid_roles)}')

        old_role = user.role
        user.role = new_role
        user.save(update_fields=['role'])

        ActivityLogRepository.log(
            user=requesting_user,
            action='permission_change',
            description=f'Changed role of {user.email} from {old_role} to {new_role}',
        )
        return user


class FeatureFlagService:
    def list_flags(self):
        return FeatureFlagRepository.get_all()

    def get_flag(self, slug):
        flag = FeatureFlagRepository.get_by_slug(slug)
        if not flag:
            raise NotFoundException(f'Feature flag "{slug}" not found.')
        return flag

    def create_flag(self, name, slug, description=None, allowed_roles=None):
        if FeatureFlagRepository.get_by_slug(slug):
            raise ConflictException(f'Feature flag "{slug}" already exists.')
        return FeatureFlagRepository.create(name, slug, description, allowed_roles)

    def toggle_flag(self, slug, enabled, requesting_user):
        flag = self.get_flag(slug)
        FeatureFlagRepository.toggle(flag, enabled)
        ActivityLogRepository.log(
            user=requesting_user,
            action='update',
            description=f'Feature flag "{slug}" set to {"enabled" if enabled else "disabled"}',
        )
        return flag

    def update_flag(self, slug, data, requesting_user):
        flag = self.get_flag(slug)
        for key, value in data.items():
            setattr(flag, key, value)
        flag.save()
        ActivityLogRepository.log(
            user=requesting_user,
            action='update',
            description=f'Updated feature flag: {slug}',
        )
        return flag

    def is_enabled_for_user(self, slug, user):
        return FeatureFlagRepository.is_enabled_for_role(slug, user.role)


class PluginService:
    def list_plugins(self):
        return PluginRepository.get_all()

    def get_plugin(self, slug):
        plugin = PluginRepository.get_by_slug(slug)
        if not plugin:
            raise NotFoundException(f'Plugin "{slug}" not found.')
        return plugin

    def toggle_plugin(self, slug, active, requesting_user):
        plugin = self.get_plugin(slug)
        PluginRepository.toggle(plugin, active)
        ActivityLogRepository.log(
            user=requesting_user,
            action='update',
            description=f'Plugin "{slug}" set to {"active" if active else "inactive"}',
        )
        return plugin

    def update_plugin_config(self, slug, config, requesting_user):
        plugin = self.get_plugin(slug)
        plugin.config = config
        plugin.save(update_fields=['config'])
        ActivityLogRepository.log(
            user=requesting_user,
            action='update',
            description=f'Updated config for plugin: {slug}',
        )
        return plugin