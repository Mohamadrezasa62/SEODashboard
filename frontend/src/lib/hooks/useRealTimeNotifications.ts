'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const POLL_INTERVAL = 30 * 1000 // 30 seconds
const INITIAL_DELAY = 5 * 1000  // 5 seconds

export function useRealTimeNotifications() {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const lastCountRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    const poll = async () => {
      try {
        const data = queryClient.getQueryData<any>(QUERY_KEYS.UNREAD_COUNT)
        const currentCount = data?.data?.unread_count ?? 0

        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT })

        const freshData = queryClient.getQueryData<any>(QUERY_KEYS.UNREAD_COUNT)
        const freshCount = freshData?.data?.unread_count ?? 0

        if (lastCountRef.current !== null && freshCount > lastCountRef.current) {
          const newCount = freshCount - lastCountRef.current
          
          // استفاده از API متنی toast بدون کدهای JSX
          toast(`${newCount} اعلان جدید دارید`, {
            duration: 4000,
            icon: '🔔', // استفاده از ایموجی به جای آیکون Lucide
          })

          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS })
        }

        lastCountRef.current = freshCount
      } catch {}
    }

    const timeout = setTimeout(() => {
      poll()
      intervalRef.current = setInterval(poll, POLL_INTERVAL)
    }, INITIAL_DELAY)

    return () => {
      clearTimeout(timeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isAuthenticated, queryClient])
}