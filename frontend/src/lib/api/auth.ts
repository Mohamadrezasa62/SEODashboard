import { apiClient } from './client'
import type { ApiResponse, LoginResponse, LoginRequest, RegisterRequest } from '@/types'
import type { User } from '@/types/auth'
import Cookies from 'js-cookie'

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login/', data)
    if (response.data) {
      Cookies.set('access_token', response.data.tokens.access, { expires: 1 })
      Cookies.set('refresh_token', response.data.tokens.refresh, { expires: 7 })
    }
    return response
  },

  register: async (data: RegisterRequest) => {
    return apiClient.post<ApiResponse<User>>('/auth/register/', data)
  },

  logout: async () => {
    const refreshToken = Cookies.get('refresh_token')
    try {
      await apiClient.post('/auth/logout/', { refresh: refreshToken })
    } finally {
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
    }
  },

  getMe: async () => {
    return apiClient.get<ApiResponse<User>>('/users/me/')
  },

  verifyEmail: async (token: string) => {
    return apiClient.post<ApiResponse<null>>('/auth/verify-email/', { token })
  },

  resendVerification: async (email: string) => {
    return apiClient.post<ApiResponse<null>>('/auth/resend-verification/', { email })
  },

  requestPasswordReset: async (email: string) => {
    return apiClient.post<ApiResponse<null>>('/auth/password-reset/', { email })
  },

  confirmPasswordReset: async (token: string, new_password: string, confirm_password: string) => {
    return apiClient.post<ApiResponse<null>>('/auth/password-reset/confirm/', {
      token,
      new_password,
      confirm_password,
    })
  },

  googleLogin: async (code: string) => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/google/', { code })
    if (response.data) {
      Cookies.set('access_token', response.data.tokens.access, { expires: 1 })
      Cookies.set('refresh_token', response.data.tokens.refresh, { expires: 7 })
    }
    return response
  },
}