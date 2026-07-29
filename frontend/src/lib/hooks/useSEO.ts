'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { seoApi } from '@/lib/api/seo'
import { QUERY_KEYS } from '@/lib/constants'
import { getDateRange } from '@/lib/utils'
import type { SEOFilters } from '@/types/seo'
import toast from 'react-hot-toast'

export function useSEOSummary(projectId: string, days = 28) {
  const filters = getDateRange(days)
  return useQuery({
    queryKey: [...QUERY_KEYS.SEO_SUMMARY(projectId), days],
    queryFn: () => seoApi.getSummary(projectId, filters),
    enabled: !!projectId,
  })
}

export function useSEOKeywords(projectId: string, days = 28, limit = 100) {
  const filters = { ...getDateRange(days), limit }
  return useQuery({
    queryKey: [...QUERY_KEYS.SEO_KEYWORDS(projectId), days, limit],
    queryFn: () => seoApi.getTopKeywords(projectId, filters),
    enabled: !!projectId,
  })
}

export function useSEOPages(projectId: string, days = 28, limit = 100) {
  const filters = { ...getDateRange(days), limit }
  return useQuery({
    queryKey: [...QUERY_KEYS.SEO_PAGES(projectId), days, limit],
    queryFn: () => seoApi.getTopPages(projectId, filters),
    enabled: !!projectId,
  })
}

export function useSEOTrend(projectId: string, days = 28) {
  const filters = getDateRange(days)
  return useQuery({
    queryKey: [...QUERY_KEYS.SEO_TREND(projectId), days],
    queryFn: () => seoApi.getDailyTrend(projectId, filters),
    enabled: !!projectId,
  })
}

export function useSyncGSC(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => seoApi.syncGSC(projectId),
    onSuccess: () => {
      toast.success('همگام‌سازی در صف قرار گرفت')
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['seo', projectId] })
      }, 5000)
    },
    onError: () => toast.error('خطا در همگام‌سازی'),
  })
}