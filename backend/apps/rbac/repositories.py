from .models import Permission, Role, RolePermission, UserRole, FeatureFlag, Plugin
from apps.users.models import User


class PermissionRepository:
    @staticmethod
    def get_all():
        return Permission.objects.all().order_by('module', 'codename')

    @staticmethod
    def get_by_codename(codename):
        try:
            return Permission.objects.get(codename=codename)
        except Permission.DoesNotExist:
            return None

    @staticmethod
    def get_by_module(module):
        return Permission.objects.filter(module=module)

    @staticmethod
    def create(codename, name, module, description=None):
        return Permission.objects.create(
            codename=codename,
            name=name,
            module=module,
            description=description,
        )

    @staticmethod
    def bulk_create(permissions_data):
        objs = [Permission(**data) for data in permissions_data]
        return Permission.objects.bulk_create(objs, ignore_conflicts=True)


class RoleRepository:
    @staticmethod
    def get_all():
        return Role.objects.all().prefetch_related('permissions').order_by('name')

    @staticmethod
    def get_by_slug(slug):
        try:
            return Role.objects.get(slug=slug)
        except Role.DoesNotExist:
            return None

    @staticmethod
    def get_by_id(role_id):
        try:
            return Role.objects.get(id=role_id)
        except Role.DoesNotExist:
            return None

    @staticmethod
    def create(name, slug, description=None, is_system=False):
        return Role.objects.create(
            name=name,
            slug=slug,
            description=description,
            is_system=is_system,
        )

    @staticmethod
    def add_permission(role, permission):
        RolePermission.objects.get_or_create(role=role, permission=permission)

    @staticmethod
    def remove_permission(role, permission):
        RolePermission.objects.filter(role=role, permission=permission).delete()

    @staticmethod
    def set_permissions(role, permission_ids):
        RolePermission.objects.filter(role=role).delete()
        objs = [RolePermission(role=role, permission_id=pid) for pid in permission_ids]
        RolePermission.objects.bulk_create(objs, ignore_conflicts=True)


class UserRoleRepository:
    @staticmethod
    def get_user_roles(user):
        return UserRole.objects.filter(user=user).select_related('role')

    @staticmethod
    def assign_role(user, role, assigned_by=None):
        obj, created = UserRole.objects.get_or_create(
            user=user,
            role=role,
            defaults={'assigned_by': assigned_by},
        )
        return obj, created

    @staticmethod
    def remove_role(user, role):
        UserRole.objects.filter(user=user, role=role).delete()

    @staticmethod
    def get_user_permissions(user):
        return Permission.objects.filter(
            roles__user_roles__user=user
        ).distinct()

    @staticmethod
    def user_has_permission(user, codename):
        if user.role == 'developer':
            return True
        return Permission.objects.filter(
            codename=codename,
            roles__user_roles__user=user,
        ).exists()


class FeatureFlagRepository:
    @staticmethod
    def get_all():
        return FeatureFlag.objects.all().order_by('name')

    @staticmethod
    def get_by_slug(slug):
        try:
            return FeatureFlag.objects.get(slug=slug)
        except FeatureFlag.DoesNotExist:
            return None

    @staticmethod
    def is_enabled_for_role(slug, role):
        try:
            flag = FeatureFlag.objects.get(slug=slug, is_enabled=True)
            if not flag.allowed_roles:
                return True
            return role in flag.allowed_roles
        except FeatureFlag.DoesNotExist:
            return False

    @staticmethod
    def create(name, slug, description=None, allowed_roles=None):
        return FeatureFlag.objects.create(
            name=name,
            slug=slug,
            description=description,
            allowed_roles=allowed_roles or [],
        )

    @staticmethod
    def toggle(flag, enabled):
        flag.is_enabled = enabled
        flag.save(update_fields=['is_enabled'])
        return flag


class PluginRepository:
    @staticmethod
    def get_all():
        return Plugin.objects.all().order_by('name')

    @staticmethod
    def get_by_slug(slug):
        try:
            return Plugin.objects.get(slug=slug)
        except Plugin.DoesNotExist:
            return None

    @staticmethod
    def get_active():
        return Plugin.objects.filter(is_active=True)

    @staticmethod
    def toggle(plugin, active):
        plugin.is_active = active
        plugin.save(update_fields=['is_active'])
        return plugin