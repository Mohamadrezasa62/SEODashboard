'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backupApi } from '@/lib/api/backup'
import toast from 'react-hot-toast'

export function useBackups() {
  return useQuery({
    queryKey: ['backups'],
    queryFn: backupApi.list,
    refetchInterval: (data) => {
      const hasRunning = (data?.data as any[])?.some(
        (b: any) => b.status === 'running' || b.status === 'pending'
      )
      return hasRunning ? 5000 : false
    },
  })
}

export function useCreateBackup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notes?: string) => backupApi.create(notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('پشتیبان‌گیری شروع شد')
    },
    onError: () => toast.error('خطا در شروع پشتیبان‌گیری'),
  })
}

export function useDeleteBackup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: backupApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('پشتیبان حذف شد')
    },
    onError: () => toast.error('خطا در حذف'),
  })
}

export function useVerifyBackup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: backupApi.verify,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('تأیید صحت در صف قرار گرفت')
    },
    onError: () => toast.error('خطا در تأیید صحت'),
  })
}

export function useRestoreBackup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      backupApi.restore(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      queryClient.invalidateQueries({ queryKey: ['restores'] })
      toast.success('بازیابی با موفقیت انجام شد')
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'خطا در بازیابی'),
  })
}

export function useRestores() {
  return useQuery({
    queryKey: ['restores'],
    queryFn: backupApi.listRestores,
  })
}