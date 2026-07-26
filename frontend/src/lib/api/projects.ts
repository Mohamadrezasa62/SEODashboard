import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { Project, ProjectDetail, ProjectMember } from '@/types/project'

export const projectsApi = {
  list: async (params?: { search?: string; status?: string }) => {
    return apiClient.get<ApiResponse<Project[]>>('/projects/', { params })
  },

  get: async (id: string) => {
    return apiClient.get<ApiResponse<ProjectDetail>>(`/projects/${id}/`)
  },

  create: async (data: { name: string; domain: string; description?: string }) => {
    return apiClient.post<ApiResponse<ProjectDetail>>('/projects/', data)
  },

  update: async (id: string, data: Partial<{ name: string; domain: string; description: string; status: string }>) => {
    return apiClient.patch<ApiResponse<ProjectDetail>>(`/projects/${id}/`, data)
  },

  delete: async (id: string) => {
    return apiClient.delete<ApiResponse<null>>(`/projects/${id}/`)
  },

  archive: async (id: string) => {
    return apiClient.post<ApiResponse<ProjectDetail>>(`/projects/${id}/archive/`)
  },

  getMembers: async (id: string) => {
    return apiClient.get<ApiResponse<ProjectMember[]>>(`/projects/${id}/members/`)
  },

  addMember: async (id: string, data: { user_id: string; role: string }) => {
    return apiClient.post<ApiResponse<ProjectMember>>(`/projects/${id}/members/`, data)
  },

  updateMember: async (projectId: string, userId: string, role: string) => {
    return apiClient.patch<ApiResponse<ProjectMember>>(
      `/projects/${projectId}/members/${userId}/`,
      { role }
    )
  },

  removeMember: async (projectId: string, userId: string) => {
    return apiClient.delete<ApiResponse<null>>(`/projects/${projectId}/members/${userId}/`)
  },
}