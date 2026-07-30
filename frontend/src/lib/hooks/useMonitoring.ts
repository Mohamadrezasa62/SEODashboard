'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monitoringApi } from '@/lib/api/monitoring'
import { schedulerApi } from '@/lib/api/scheduler'
import toast from 'react-hot-toast'

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: monitoringApi.health,
    refetchInterval: 30000,
  })
}

export function useSystemStats() {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: monitoringApi.systemStats,
    refetchInterval: 60000,
  })
}

export function useAuditLogs(params?: {
  user_id?: string
  model_name?: string
  action?: string
}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => monitoringApi.auditLogs(params),
  })
}

export function useTaskLogs(params?: {
  status?: string
  task_name?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ['task-logs', params],
    queryFn: () => schedulerApi.listTaskLogs(params),
    refetchInterval: 10000,
  })
}

export function useTaskStats() {
  return useQuery({
    queryKey: ['task-stats'],
    queryFn: schedulerApi.getTaskStats,
    refetchInterval: 30000,
  })
}

export function usePeriodicTasks() {
  return useQuery({
    queryKey: ['periodic-tasks'],
    queryFn: schedulerApi.listPeriodicTasks,
  })
}

export function useTogglePeriodicTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      schedulerApi.togglePeriodicTask(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodic-tasks'] })
      toast.success('وضعیت task تغییر یافت')
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  })
}