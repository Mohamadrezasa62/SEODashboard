import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'

export interface Permission {
  id: string
  codename: string
  name: string
  description: string | null
  module: string
  created_at: string
}

export interface Role {
  id: string
  name: string
  slug: string
  description: string | null
  is_system: boolean
  permissions: Permission[]
  permissions_count: number
  created_at: string
}

export interface FeatureFlag {
  id: string
  name: string
  slug: string
  description: string | null
  is_enabled: boolean
  allowed_roles: string[]
  metadata: Record<string, unknown>
  created_at: string
}

export interface Plugin {
  id: string
  name: string
  slug: string
  description: string | null
  version: string
  is_active: boolean
  config: Record<string, unknown>
  created_at: string
}

export const rbacApi = {
  listPermissions: (module?: string) =>
    apiClient.get<ApiResponse<Permission[]>>('/rbac/permissions/', {
      params: module ? { module } : undefined,
    }),

  listRoles: () =>
    apiClient.get<ApiResponse<Role[]>>('/rbac/roles/'),

  getRole: (roleId: string) =>
    apiClient.get<ApiResponse<Role>>(`/rbac/roles/${roleId}/`),

  createRole: (data: { name: string; slug: string; description?: string }) =>
    apiClient.post<ApiResponse<Role>>('/rbac/roles/', data),

  deleteRole: (roleId: string) =>
    apiClient.delete<ApiResponse<null>>(`/rbac/roles/${roleId}/`),

  updateRolePermissions: (roleId: string, permissionIds: string[]) =>
    apiClient.put<ApiResponse<Role>>(`/rbac/roles/${roleId}/permissions/`, {
      permission_ids: permissionIds,
    }),

  assignRole: (userId: string, roleId: string) =>
    apiClient.post<ApiResponse<unknown>>('/rbac/assign/', { user_id: userId, role_id: roleId }),

  changeUserRole: (userId: string, role: string) =>
    apiClient.patch<ApiResponse<unknown>>(`/rbac/users/${userId}/role/`, { role }),

  myPermissions: () =>
    apiClient.get<ApiResponse<{ role: string; permissions: Permission[] }>>('/rbac/my-permissions/'),

  listFeatureFlags: () =>
    apiClient.get<ApiResponse<FeatureFlag[]>>('/rbac/features/'),

  toggleFeatureFlag: (slug: string, enabled: boolean) =>
    apiClient.post<ApiResponse<FeatureFlag>>(`/rbac/features/${slug}/toggle/`, { enabled }),

  createFeatureFlag: (data: {
    name: string
    slug: string
    description?: string
    allowed_roles?: string[]
  }) => apiClient.post<ApiResponse<FeatureFlag>>('/rbac/features/', data),

  listPlugins: () =>
    apiClient.get<ApiResponse<Plugin[]>>('/rbac/plugins/'),

  togglePlugin: (slug: string, active: boolean) =>
    apiClient.post<ApiResponse<Plugin>>(`/rbac/plugins/${slug}/toggle/`, { active }),
}