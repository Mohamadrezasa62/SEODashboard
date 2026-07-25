from django.contrib import admin
from .models import Permission, Role, RolePermission, UserRole, FeatureFlag, Plugin


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('codename', 'name', 'module', 'created_at')
    list_filter = ('module',)
    search_fields = ('codename', 'name')


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_system', 'created_at')
    list_filter = ('is_system',)
    search_fields = ('name', 'slug')
    filter_horizontal = ()


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'assigned_by', 'created_at')
    list_filter = ('role',)
    search_fields = ('user__email',)


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_enabled', 'created_at')
    list_filter = ('is_enabled',)
    search_fields = ('name', 'slug')


@admin.register(Plugin)
class PluginAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'version', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug')