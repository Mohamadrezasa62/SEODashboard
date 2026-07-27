import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { User } from '@/types/auth'

export const usersApi = {
  list: (params?: { role?: string; search?: string }) =>
    apiClient.get<ApiResponse<User[]>>('/users/', { params }),

  get: (id: string) =>
    apiClient.get<ApiResponse<User>>(`/users/${id}/`),

  create: (data: {
    email: string
    first_name: string
    last_name: string
    role: string
    password: string
  }) => apiClient.post<ApiResponse<User>>('/users/create/', data),

  updateProfile: (data: FormData) =>
    apiClient.uploadFile<ApiResponse<User>>('/users/me/', data),

  changePassword: (data: {
    old_password: string
    new_password: string
    confirm_password: string
  }) => apiClient.post<ApiResponse<null>>('/users/me/change-password/', data),

  deactivate: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/users/${id}/`),

  changeRole: (id: string, role: string) =>
    apiClient.patch<ApiResponse<User>>(`/rbac/users/${id}/role/`, { role }),
}