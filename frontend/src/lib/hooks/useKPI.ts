'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kpiApi } from '@/lib/api/kpi'
import { QUERY_KEYS } from '@/lib/constants'
import toast from 'react-hot-toast'

export function useKPIs(projectId: string, activeOnly = true) {
  return useQuery({
    queryKey: [...QUERY_KEYS.KPIS(projectId), activeOnly],
    queryFn: () => kpiApi.list(projectId, activeOnly),
    enabled: !!projectId,
  })
}

export function useKPIAlerts(projectId: string) {
  return useQuery({
    queryKey: ['kpi-alerts', projectId],
    queryFn: () => kpiApi.getAlerts(projectId),
    enabled: !!projectId,
    refetchInterval: 60000,
  })
}

export function useCreateKPI(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      kpi_type: string
      period: string
      target_value: number
      alert_threshold_pct?: number
    }) => kpiApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.KPIS(projectId) })
      toast.success('KPI ایجاد شد')
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'خطا در ایجاد KPI'),
  })
}

export function useDeleteKPI(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: kpiApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.KPIS(projectId) })
      toast.success('KPI حذف شد')
    },
  })
}

export function useRecordKPIValue(kpiId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { date: string; value: number; note?: string }) =>
      kpiApi.recordValue(kpiId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-records', kpiId] })
      toast.success('مقدار ثبت شد')
    },
    onError: () => toast.error('خطا در ثبت مقدار'),
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: kpiApi.resolveAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-alerts'] })
      toast.success('هشدار حل‌شده علامت‌گذاری شد')
    },
  })
}