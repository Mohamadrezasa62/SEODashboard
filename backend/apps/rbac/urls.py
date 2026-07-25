from django.urls import path
from .views import (
    PermissionListView,
    RoleListView, RoleDetailView, RolePermissionsView,
    AssignRoleView, RemoveRoleView, ChangeUserRoleView, UserPermissionsView,
    FeatureFlagListView, FeatureFlagDetailView, FeatureFlagToggleView, FeatureFlagCheckView,
    PluginListView, PluginDetailView, PluginToggleView, PluginConfigView,
)

urlpatterns = [
    # Permissions
    path('permissions/', PermissionListView.as_view(), name='permission-list'),

    # Roles
    path('roles/', RoleListView.as_view(), name='role-list'),
    path('roles/<uuid:role_id>/', RoleDetailView.as_view(), name='role-detail'),
    path('roles/<uuid:role_id>/permissions/', RolePermissionsView.as_view(), name='role-permissions'),

    # User Role Assignment
    path('assign/', AssignRoleView.as_view(), name='role-assign'),
    path('users/<uuid:user_id>/roles/<uuid:role_id>/', RemoveRoleView.as_view(), name='role-remove'),
    path('users/<uuid:user_id>/role/', ChangeUserRoleView.as_view(), name='user-role-change'),
    path('my-permissions/', UserPermissionsView.as_view(), name='my-permissions'),

    # Feature Flags
    path('features/', FeatureFlagListView.as_view(), name='feature-list'),
    path('features/<slug:slug>/', FeatureFlagDetailView.as_view(), name='feature-detail'),
    path('features/<slug:slug>/toggle/', FeatureFlagToggleView.as_view(), name='feature-toggle'),
    path('features/<slug:slug>/check/', FeatureFlagCheckView.as_view(), name='feature-check'),

    # Plugins
    path('plugins/', PluginListView.as_view(), name='plugin-list'),
    path('plugins/<slug:slug>/', PluginDetailView.as_view(), name='plugin-detail'),
    path('plugins/<slug:slug>/toggle/', PluginToggleView.as_view(), name='plugin-toggle'),
    path('plugins/<slug:slug>/config/', PluginConfigView.as_view(), name='plugin-config'),
]