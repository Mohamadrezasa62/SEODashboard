'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiApi } from '@/lib/api/ai'
import toast from 'react-hot-toast'

export function useAIProviders() {
  return useQuery({
    queryKey: ['ai-providers'],
    queryFn: aiApi.listProviders,
  })
}

export function useAIUsageStats(projectId?: string) {
  return useQuery({
    queryKey: ['ai-usage', projectId],
    queryFn: () => aiApi.getUsageStats(projectId),
  })
}

export function useCreateAIProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: aiApi.createProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] })
      toast.success('پرووایدر اضافه شد')
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'خطا در افزودن پرووایدر'),
  })
}

export function useDeleteAIProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: aiApi.deleteProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] })
      toast.success('پرووایدر حذف شد')
    },
  })
}

export function useSetDefaultAIProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: aiApi.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] })
      toast.success('پرووایدر پیش‌فرض تغییر یافت')
    },
  })
}

export function useSEOSuggestion(projectId: string) {
  return useMutation({
    mutationFn: ({ keyword, context }: { keyword: string; context?: string }) =>
      aiApi.getSuggestion(projectId, keyword, context),
    onError: () => toast.error('خطا در دریافت پیشنهاد AI'),
  })
}