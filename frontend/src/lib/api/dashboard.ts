import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'

export interface Dashboard {
  id: string
  name: string
  owner_email: string
  project: string | null
  is_default: boolean
  is_shared: boolean
  layout: WidgetPosition[]
  widgets: Widget[]
  widgets_count: number
  created_at: string
  updated_at: string
}

export interface Widget {
  id: string
  name: string
  widget_type: string
  data_source: string
  position_x: number
  position_y: number
  width: number
  height: number
  config: Record<string, unknown>
  filters: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface WidgetPosition {
  id: string
  position_x: number
  position_y: number
  width: number
  height: number
}

export const dashboardApi = {
  list: (projectId?: string) =>
    apiClient.get<ApiResponse<Dashboard[]>>('/dashboard/', {
      params: projectId ? { project_id: projectId } : undefined,
    }),

  get: (dashboardId: string) =>
    apiClient.get<ApiResponse<Dashboard>>(`/dashboard/${dashboardId}/`),

  create: (data: {
    name: string
    project_id?: string
    is_default?: boolean
    is_shared?: boolean
    layout?: WidgetPosition[]
  }) => apiClient.post<ApiResponse<Dashboard>>('/dashboard/', data),

  update: (dashboardId: string, data: Partial<{
    name: string
    is_default: boolean
    is_shared: boolean
    layout: WidgetPosition[]
  }>) => apiClient.patch<ApiResponse<Dashboard>>(`/dashboard/${dashboardId}/`, data),

  delete: (dashboardId: string) =>
    apiClient.delete<ApiResponse<null>>(`/dashboard/${dashboardId}/`),

  setDefault: (dashboardId: string) =>
    apiClient.post<ApiResponse<Dashboard>>(`/dashboard/${dashboardId}/set-default/`),

  updateLayout: (dashboardId: string, widgets: WidgetPosition[]) =>
    apiClient.put<ApiResponse<null>>(`/dashboard/${dashboardId}/layout/`, { widgets }),

  getWidgets: (dashboardId: string) =>
    apiClient.get<ApiResponse<Widget[]>>(`/dashboard/${dashboardId}/widgets/`),

  addWidget: (dashboardId: string, data: {
    name: string
    widget_type: string
    data_source: string
    config?: Record<string, unknown>
    filters?: Record<string, unknown>
    position_x?: number
    position_y?: number
    width?: number
    height?: number
  }) => apiClient.post<ApiResponse<Widget>>(`/dashboard/${dashboardId}/widgets/`, data),

  updateWidget: (widgetId: string, data: Partial<Widget>) =>
    apiClient.patch<ApiResponse<Widget>>(`/dashboard/widgets/${widgetId}/`, data),

  deleteWidget: (widgetId: string) =>
    apiClient.delete<ApiResponse<null>>(`/dashboard/widgets/${widgetId}/`),
}
