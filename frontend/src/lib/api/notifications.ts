import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'

export interface Notification {
  id: string
  notification_type: string
  title: string
  body: string
  is_read: boolean
  read_at: string | null
  action_url: string | null
  sender: import('@/types/auth').User | null
  metadata: Record<string, unknown>
  created_at: string
}

export const notificationsApi = {
  list: (unread_only?: boolean) =>
    apiClient.get<ApiResponse<{ notifications: Notification[]; unread_count: number }>>(
      '/notifications/',
      { params: { unread_only } }
    ),

  getUnreadCount: () =>
    apiClient.get<ApiResponse<{ unread_count: number }>>('/notifications/unread-count/'),

  markRead: (id: string) =>
    apiClient.post<ApiResponse<null>>(`/notifications/${id}/read/`),

  markAllRead: () =>
    apiClient.post<ApiResponse<null>>('/notifications/mark-all-read/'),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/notifications/${id}/`),

  getSettings: () =>
    apiClient.get<ApiResponse<Record<string, boolean>>>('/notifications/settings/'),

  updateSettings: (data: Record<string, boolean>) =>
    apiClient.patch<ApiResponse<Record<string, boolean>>>('/notifications/settings/', data),
}