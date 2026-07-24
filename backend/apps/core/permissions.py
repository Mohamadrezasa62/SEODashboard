from rest_framework.permissions import BasePermission


class IsDeveloper(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'role')
            and request.user.role == 'developer'
        )


class IsCompanyManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'role')
            and request.user.role in ('developer', 'company_manager')
        )


class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated


class IsDeveloperOrCompanyManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'role')
            and request.user.role in ('developer', 'company_manager')
        )