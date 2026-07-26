'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/notifications'
import { QUERY_KEYS } from '@/lib/constants'
import toast from 'react-hot-toast'

export function useNotifications() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS,
    queryFn: () => notificationsApi.list(),
    refetchInterval: 30000,
  })

  const { data: unreadData } = useQuery({
    queryKey: QUERY_KEYS.UNREAD_COUNT,
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 15000,
  })

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT })
      toast.success('همه اعلان‌ها خوانده شدند')
    },
  })

  return {
    notifications: data?.data?.notifications ?? [],
    unreadCount: unreadData?.data?.unread_count ?? 0,
    isLoading,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
  }
}