import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'

export interface AuditLog {
  id: string
  user: import('@/types/auth').User | null
  action: string
  model_name: string
  object_id: string | null
  object_repr: string | null
  changes: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

export interface SystemStats {
  total_users: number
  total_projects: number
  total_data_points: number
  open_feedback_threads: number
  users_by_role: Array<{ role: string; count: number }>
}

export interface HealthCheck {
  status: string
  services: Record<string, string>
}

export const monitoringApi = {
  health: () =>
    apiClient.get<ApiResponse<HealthCheck>>('/monitoring/health/'),

  auditLogs: (params?: {
    user_id?: string
    model_name?: string
    action?: string
  }) => apiClient.get<ApiResponse<AuditLog[]>>('/monitoring/audit-logs/', { params }),

  systemStats: () =>
    apiClient.get<ApiResponse<SystemStats>>('/monitoring/stats/'),
}