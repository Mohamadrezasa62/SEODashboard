import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'

export interface Report {
  id: string
  name: string
  format: 'pdf' | 'excel' | 'csv'
  status: 'pending' | 'generating' | 'ready' | 'failed'
  config: Record<string, unknown>
  date_from: string | null
  date_to: string | null
  file_url: string | null
  file_size: number | null
  generated_at: string | null
  error_message: string | null
  created_by: import('@/types/auth').User
  created_at: string
}

export interface ScheduledReport {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  format: 'pdf' | 'excel' | 'csv'
  config: Record<string, unknown>
  recipients: string[]
  is_active: boolean
  next_run_at: string | null
  last_run_at: string | null
  created_by: import('@/types/auth').User
  created_at: string
}

export const reportsApi = {
  list: (projectId: string) =>
    apiClient.get<ApiResponse<Report[]>>(`/reports/projects/${projectId}/`),

  get: (reportId: string) =>
    apiClient.get<ApiResponse<Report>>(`/reports/${reportId}/`),

  create: (projectId: string, data: {
    name: string
    format: string
    config?: Record<string, unknown>
    date_from?: string
    date_to?: string
  }) => apiClient.post<ApiResponse<Report>>(`/reports/projects/${projectId}/`, data),

  delete: (reportId: string) =>
    apiClient.delete<ApiResponse<null>>(`/reports/${reportId}/`),

  listScheduled: (projectId: string) =>
    apiClient.get<ApiResponse<ScheduledReport[]>>(`/reports/projects/${projectId}/scheduled/`),

  createScheduled: (projectId: string, data: {
    name: string
    frequency: string
    format: string
    config?: Record<string, unknown>
    recipients: string[]
  }) => apiClient.post<ApiResponse<ScheduledReport>>(
    `/reports/projects/${projectId}/scheduled/`,
    data
  ),

  toggleScheduled: (scheduledId: string, active: boolean) =>
    apiClient.patch<ApiResponse<ScheduledReport>>(
      `/reports/scheduled/${scheduledId}/`,
      { active }
    ),

  deleteScheduled: (scheduledId: string) =>
    apiClient.delete<ApiResponse<null>>(`/reports/scheduled/${scheduledId}/`),
}