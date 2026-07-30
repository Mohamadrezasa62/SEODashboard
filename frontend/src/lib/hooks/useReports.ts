'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api/reports'
import toast from 'react-hot-toast'

export function useReports(projectId: string) {
  return useQuery({
    queryKey: ['reports', projectId],
    queryFn: () => reportsApi.list(projectId),
    enabled: !!projectId,
    refetchInterval: (data) => {
      const hasGenerating = (data?.data as any[])?.some(
        (r: any) => r.status === 'generating' || r.status === 'pending'
      )
      return hasGenerating ? 5000 : false
    },
  })
}

export function useCreateReport(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      format: string
      config?: Record<string, unknown>
      date_from?: string
      date_to?: string
    }) => reportsApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', projectId] })
      toast.success('گزارش در صف ساخت قرار گرفت')
    },
    onError: () => toast.error('خطا در ایجاد گزارش'),
  })
}

export function useDeleteReport(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reportsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', projectId] })
      toast.success('گزارش حذف شد')
    },
  })
}

export function useScheduledReports(projectId: string) {
  return useQuery({
    queryKey: ['scheduled-reports', projectId],
    queryFn: () => reportsApi.listScheduled(projectId),
    enabled: !!projectId,
  })
}