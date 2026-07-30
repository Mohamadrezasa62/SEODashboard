'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api/users'
import toast from 'react-hot-toast'

export function useUsers(params?: { role?: string; search?: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.list(params),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('کاربر ایجاد شد')
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'خطا در ایجاد کاربر'),
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('کاربر غیرفعال شد')
    },
    onError: () => toast.error('خطا در غیرفعال‌سازی'),
  })
}

export function useChangeUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersApi.changeRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('نقش کاربر تغییر یافت')
    },
    onError: () => toast.error('خطا در تغییر نقش'),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('پروفایل بروزرسانی شد')
    },
    onError: () => toast.error('خطا در بروزرسانی'),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => toast.success('رمز عبور تغییر یافت'),
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'خطا در تغییر رمز عبور'),
  })
}