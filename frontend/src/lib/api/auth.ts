import { apiClient } from './client'
import type { ApiResponse, LoginResponse, LoginRequest, RegisterRequest } from '@/types'
import type { User } from '@/types/auth'
import Cookies from 'js-cookie'

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login/',
      data
    )

    if (response.data) {
      Cookies.set('access_token', response.data.tokens.access, {
        expires: 1,
      })

      Cookies.set('refresh_token', response.data.tokens.refresh, {
        expires: 7,
      })
    }

    return response
  },

  register: async (data: RegisterRequest) => {
    return apiClient.post<ApiResponse<User>>(
      '/users/create/',
      data
    )
  },

  logout: async () => {
    const refreshToken = Cookies.get('refresh_token')

    try {
      await apiClient.post('/auth/logout/', {
        refresh: refreshToken,
      })
    } finally {
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
    }
  },

  getMe: async () => {
    return apiClient.get<ApiResponse<User>>('/users/me/')
  },

  changePassword: async (
    old_password: string,
    new_password: string
  ) => {
    return apiClient.post<ApiResponse<null>>(
      '/users/me/change-password/',
      {
        old_password,
        new_password,
      }
    )
  },
}