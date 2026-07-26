'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api/auth'
import { QUERY_KEYS } from '@/lib/constants'
import Cookies from 'js-cookie'

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout } = useAuthStore()

  const hasToken = !!Cookies.get('access_token')

  const { data, isError } = useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: () => authApi.getMe(),
    enabled: hasToken && !user,
    retry: false,
  })

  useEffect(() => {
    if (data?.data) {
      setUser(data.data)
    }
    if (isError) {
      setLoading(false)
    }
  }, [data, isError, setUser, setLoading])

  useEffect(() => {
    if (!hasToken) {
      setLoading(false)
    }
  }, [hasToken, setLoading])

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    isDeveloper: user?.role === 'developer',
    isCompanyManager: user?.role === 'company_manager',
    isEmployee: user?.role === 'employee',
    canManage: user?.role !== 'employee',
  }
}