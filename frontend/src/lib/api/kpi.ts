import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'

export interface KPI {
  id: string
  name: string
  kpi_type: string
  period: string
  target_value: number
  current_value: number
  achievement_pct: number
  is_active: boolean
  alert_threshold_pct: number
  created_by: import('@/types/auth').User
  latest_record_date: string | null
  created_at: string
  updated_at: string
}

export interface KPIRecord {
  id: string
  date: string
  value: number
  note: string | null
  created_at: string
}

export interface KPIAlert {
  id: string
  kpi_name: string
  project_id: string
  alert_type: string
  message: string
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
}

export const kpiApi = {
  list: (projectId: string, activeOnly = true) =>
    apiClient.get<ApiResponse<KPI[]>>(`/kpi/projects/${projectId}/kpis/`, {
      params: { active_only: activeOnly },
    }),

  get: (kpiId: string) =>
    apiClient.get<ApiResponse<KPI>>(`/kpi/kpis/${kpiId}/`),

  create: (projectId: string, data: {
    name: string
    kpi_type: string
    period: string
    target_value: number
    alert_threshold_pct?: number
  }) => apiClient.post<ApiResponse<KPI>>(`/kpi/projects/${projectId}/kpis/`, data),

  update: (kpiId: string, data: Partial<{
    name: string
    target_value: number
    alert_threshold_pct: number
    is_active: boolean
  }>) => apiClient.patch<ApiResponse<KPI>>(`/kpi/kpis/${kpiId}/`, data),

  delete: (kpiId: string) =>
    apiClient.delete<ApiResponse<null>>(`/kpi/kpis/${kpiId}/`),

  getRecords: (kpiId: string, params?: { date_from?: string; date_to?: string }) =>
    apiClient.get<ApiResponse<KPIRecord[]>>(`/kpi/kpis/${kpiId}/records/`, { params }),

  recordValue: (kpiId: string, data: { date: string; value: number; note?: string }) =>
    apiClient.post<ApiResponse<KPIRecord>>(`/kpi/kpis/${kpiId}/records/`, data),

  getAlerts: (projectId: string) =>
    apiClient.get<ApiResponse<KPIAlert[]>>(`/kpi/projects/${projectId}/kpi-alerts/`),

  resolveAlert: (alertId: string) =>
    apiClient.post<ApiResponse<KPIAlert>>(`/kpi/kpi-alerts/${alertId}/resolve/`),
}