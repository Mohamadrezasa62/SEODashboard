from rest_framework.permissions import BasePermission
from .repositories import UserRoleRepository, FeatureFlagRepository


class HasPermission(BasePermission):
    def __init__(self, codename):
        self.codename = codename

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return UserRoleRepository.user_has_permission(request.user, self.codename)


class FeatureEnabled(BasePermission):
    def __init__(self, slug):
        self.slug = slug

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return FeatureFlagRepository.is_enabled_for_role(self.slug, request.user.role)


def require_permission(codename):
    class DynamicPermission(BasePermission):
        def has_permission(self, request, view):
            if not request.user.is_authenticated:
                return False
            return UserRoleRepository.user_has_permission(request.user, codename)
    return DynamicPermission


def require_feature(slug):
    class DynamicFeaturePermission(BasePermission):
        def has_permission(self, request, view):
            if not request.user.is_authenticated:
                return False
            return FeatureFlagRepository.is_enabled_for_role(slug, request.user.role)
    return DynamicFeaturePermission