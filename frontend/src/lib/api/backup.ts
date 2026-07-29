// import { apiClient } from './client'
// import type { ApiResponse } from '@/types/api'

// export interface BackupRecord {
//   id: string
//   name: string
//   backup_type: 'manual' | 'scheduled'
//   status: 'pending' | 'running' | 'success' | 'failed'
//   file_path: string | null
//   file_size: number | null
//   file_size_mb: number | null
//   checksum: string | null
//   started_at: string | null
//   finished_at: string | null
//   duration_seconds: number | null
//   error_message: string | null
//   initiated_by: import('@/types/auth').User | null
//   created_at: string
// }

// export const backupApi = {
//   list: () =>
//     apiClient.get<ApiResponse<BackupRecord[]>>('/backup/'),

//   get: (id: string) =>
//     apiClient.get<ApiResponse<BackupRecord>>(`/backup/${id}/`),

//   create: () =>
//     apiClient.post<ApiResponse<BackupRecord>>('/backup/'),

//   delete: (id: string) =>
//     apiClient.delete<ApiResponse<null>>(`/backup/${id}/`),
// }
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
  is_verified: boolean
  started_at: string | null
  finished_at: string | null
  duration_seconds: number | null
  error_message: string | null
  notes: string | null
  initiated_by: import('@/types/auth').User | null
  restore_count: number
  created_at: string
}

export interface RestoreRecord {
  id: string
  backup: string
  backup_name: string
  status: 'pending' | 'running' | 'success' | 'failed'
  initiated_by: import('@/types/auth').User | null
  started_at: string | null
  finished_at: string | null
  duration_seconds: number | null
  error_message: string | null
  notes: string | null
  created_at: string
}

export const backupApi = {
  list: () =>
    apiClient.get<ApiResponse<BackupRecord[]>>('/backup/'),

  get: (id: string) =>
    apiClient.get<ApiResponse<BackupRecord>>(`/backup/${id}/`),

  create: (notes?: string) =>
    apiClient.post<ApiResponse<BackupRecord>>('/backup/', { notes }),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/backup/${id}/`),

  verify: (id: string) =>
    apiClient.post<ApiResponse<null>>(`/backup/${id}/verify/`),

  restore: (id: string, notes?: string) =>
    apiClient.post<ApiResponse<RestoreRecord>>(`/backup/${id}/restore/`, {
      confirm: true,
      notes,
    }),

  listRestores: () =>
    apiClient.get<ApiResponse<RestoreRecord[]>>('/backup/restores/'),
}