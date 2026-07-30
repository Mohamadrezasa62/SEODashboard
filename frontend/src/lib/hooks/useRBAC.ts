'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rbacApi } from '@/lib/api/rbac'
import toast from 'react-hot-toast'

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: rbacApi.listRoles,
  })
}

export function usePermissions(module?: string) {
  return useQuery({
    queryKey: ['permissions', module],
    queryFn: () => rbacApi.listPermissions(module),
  })
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: rbacApi.listFeatureFlags,
  })
}

export function usePlugins() {
  return useQuery({
    queryKey: ['plugins'],
    queryFn: rbacApi.listPlugins,
  })
}

export function useMyPermissions() {
  return useQuery({
    queryKey: ['my-permissions'],
    queryFn: rbacApi.myPermissions,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rbacApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('نقش ایجاد شد')
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'خطا در ایجاد نقش'),
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rbacApi.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('نقش حذف شد')
    },
    onError: () => toast.error('این نقش قابل حذف نیست'),
  })
}

export function useToggleFeatureFlag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, enabled }: { slug: string; enabled: boolean }) =>
      rbacApi.toggleFeatureFlag(slug, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  })
}

export function useTogglePlugin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, active }: { slug: string; active: boolean }) =>
      rbacApi.togglePlugin(slug, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] })
    },
    onError: () => toast.error('خطا در تغییر وضعیت پلاگین'),
  })
}