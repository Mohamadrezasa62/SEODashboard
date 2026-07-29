import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'

export interface TaskLog {
  id: string
  task_id: string
  task_name: string
  task_short_name: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'retrying' | 'revoked'
  args: unknown[]
  kwargs: Record<string, unknown>
  result: unknown
  error_message: string | null
  started_at: string | null
  finished_at: string | null
  duration_seconds: number | null
  duration_formatted: string | null
  retries: number
  worker: string | null
  created_at: string
}

export interface TaskStats {
  overall: {
    total: number
    success: number
    failed: number
    running: number
    avg_duration: number | null
  }
  last_24h: Array<{ status: string; count: number }>
  by_task: Array<{
    task_name: string
    count: number
    success_count: number
    fail_count: number
  }>
}

export interface PeriodicTask {
  id: number
  name: string
  task: string
  enabled: boolean
  schedule: string
  last_run_at: string | null
  total_run_count: number
  args: string
  kwargs: string
}

export const schedulerApi = {
  listTaskLogs: (params?: { status?: string; task_name?: string; limit?: number }) =>
    apiClient.get<ApiResponse<TaskLog[]>>('/monitoring/tasks/', { params }),

  getTaskLog: (taskId: string) =>
    apiClient.get<ApiResponse<TaskLog>>(`/monitoring/tasks/${taskId}/`),

  getTaskStats: () =>
    apiClient.get<ApiResponse<TaskStats>>('/monitoring/task-stats/'),

  listPeriodicTasks: () =>
    apiClient.get<ApiResponse<PeriodicTask[]>>('/monitoring/periodic-tasks/'),

  togglePeriodicTask: (taskId: number, enabled: boolean) =>
    apiClient.patch<ApiResponse<{ id: number; enabled: boolean }>>(
      `/monitoring/periodic-tasks/${taskId}/`,
      { enabled }
    ),
}