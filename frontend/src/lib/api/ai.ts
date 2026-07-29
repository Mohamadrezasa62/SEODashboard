import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'

export interface AIProvider {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'gemini'
  model: string
  is_active: boolean
  is_default: boolean
  config: Record<string, unknown>
  created_at: string
}

export interface AITemplate {
  id: string
  name: string
  slug: string
  description: string | null
  system_prompt: string
  user_prompt_template: string
  provider: string | null
  is_active: boolean
  created_at: string
}

export interface AIUsageStats {
  total_requests: number
  total_tokens: number
  total_cost: number | null
  avg_response_time: number | null
  successful: number
}

export const aiApi = {
  listProviders: () =>
    apiClient.get<ApiResponse<AIProvider[]>>('/ai/providers/'),

  createProvider: (data: {
    name: string
    provider: string
    model: string
    api_key: string
    config?: Record<string, unknown>
  }) => apiClient.post<ApiResponse<AIProvider>>('/ai/providers/', data),

  updateProvider: (providerId: string, data: Partial<{
    name: string
    model: string
    api_key: string
    is_active: boolean
    config: Record<string, unknown>
  }>) => apiClient.patch<ApiResponse<AIProvider>>(`/ai/providers/${providerId}/`, data),

  deleteProvider: (providerId: string) =>
    apiClient.delete<ApiResponse<null>>(`/ai/providers/${providerId}/`),

  setDefault: (providerId: string) =>
    apiClient.post<ApiResponse<AIProvider>>(`/ai/providers/${providerId}/set-default/`),

  listTemplates: () =>
    apiClient.get<ApiResponse<AITemplate[]>>('/ai/templates/'),

  createTemplate: (data: {
    name: string
    slug: string
    description?: string
    system_prompt: string
    user_prompt_template: string
    provider_id?: string
  }) => apiClient.post<ApiResponse<AITemplate>>('/ai/templates/', data),

  getSuggestion: (projectId: string, keyword: string, context?: string) =>
    apiClient.post<ApiResponse<{ suggestion: string }>>(
      `/ai/projects/${projectId}/suggest/`,
      { keyword, context }
    ),

  getUsageStats: (projectId?: string) =>
    apiClient.get<ApiResponse<AIUsageStats>>('/ai/usage/', {
      params: projectId ? { project_id: projectId } : undefined,
    }),
}