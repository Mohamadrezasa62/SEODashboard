import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type {
  SEOSummary, TopKeyword, TopPage,
  DailyTrend, DeviceBreakdown, CountryBreakdown, SEOFilters,
} from '@/types/seo'

export const seoApi = {
  getSummary: (projectId: string, filters?: SEOFilters) =>
    apiClient.get<ApiResponse<SEOSummary>>(`/seo/${projectId}/summary/`, { params: filters }),

  getTopKeywords: (projectId: string, filters?: SEOFilters) =>
    apiClient.get<ApiResponse<TopKeyword[]>>(`/seo/${projectId}/keywords/`, { params: filters }),

  getTopPages: (projectId: string, filters?: SEOFilters) =>
    apiClient.get<ApiResponse<TopPage[]>>(`/seo/${projectId}/pages/`, { params: filters }),

  getDailyTrend: (projectId: string, filters?: SEOFilters) =>
    apiClient.get<ApiResponse<DailyTrend[]>>(`/seo/${projectId}/trend/`, { params: filters }),

  getDeviceBreakdown: (projectId: string, filters?: SEOFilters) =>
    apiClient.get<ApiResponse<DeviceBreakdown[]>>(`/seo/${projectId}/devices/`, { params: filters }),

  getCountryBreakdown: (projectId: string, filters?: SEOFilters) =>
    apiClient.get<ApiResponse<CountryBreakdown[]>>(`/seo/${projectId}/countries/`, { params: filters }),

  syncGSC: (projectId: string, data?: { start_date?: string; end_date?: string }) =>
    apiClient.post<ApiResponse<null>>(`/gsc/${projectId}/sync/`, data),

  getSyncLogs: (projectId: string) =>
    apiClient.get<ApiResponse<unknown[]>>(`/gsc/${projectId}/sync/logs/`),
}