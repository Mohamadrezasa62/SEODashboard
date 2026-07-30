'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/dashboard'
import toast from 'react-hot-toast'

export function useDashboards(projectId?: string) {
  return useQuery({
    queryKey: ['dashboards', projectId],
    queryFn: () => dashboardApi.list(projectId),
  })
}

export function useDashboard(dashboardId: string) {
  return useQuery({
    queryKey: ['dashboard', dashboardId],
    queryFn: () => dashboardApi.get(dashboardId),
    enabled: !!dashboardId,
  })
}

export function useCreateDashboard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dashboardApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
      toast.success('داشبورد ایجاد شد')
      return res
    },
    onError: () => toast.error('خطا در ایجاد داشبورد'),
  })
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dashboardApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
      toast.success('داشبورد حذف شد')
    },
  })
}

export function useSetDefaultDashboard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dashboardApi.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
      toast.success('داشبورد پیش‌فرض تغییر یافت')
    },
  })
}

export function useAddWidget(dashboardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof dashboardApi.addWidget>[1]) =>
      dashboardApi.addWidget(dashboardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] })
      toast.success('ویجت اضافه شد')
    },
    onError: () => toast.error('خطا در افزودن ویجت'),
  })
}

export function useDeleteWidget(dashboardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dashboardApi.deleteWidget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] })
      toast.success('ویجت حذف شد')
    },
  })
}

export function useUpdateLayout(dashboardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (widgets: Parameters<typeof dashboardApi.updateLayout>[1]) =>
      dashboardApi.updateLayout(dashboardId, widgets),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] })
    },
    onError: () => toast.error('خطا در ذخیره layout'),
  })
}