import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'

export interface BackupRecord {
  id: string
  name: string
  backup_type: 'manual' | 'scheduled'
  status: 'pending' | 'running' | 'success' | 'failed'
  file_path: string | null
  file_size: number | null
  file_size_mb: number | null
  checksum: string | null
  started_at: string | null
  finished_at: string | null
  duration_seconds: number | null
  error_message: string | null
  initiated_by: import('@/types/auth').User | null
  created_at: string
}

export const backupApi = {
  list: () =>
    apiClient.get<ApiResponse<BackupRecord[]>>('/backup/'),

  get: (id: string) =>
    apiClient.get<ApiResponse<BackupRecord>>(`/backup/${id}/`),

  create: () =>
    apiClient.post<ApiResponse<BackupRecord>>('/backup/'),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/backup/${id}/`),
}