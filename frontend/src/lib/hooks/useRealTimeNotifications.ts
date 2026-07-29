'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Bell } from 'lucide-react'

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
          toast.custom(
            (t) => (
              <div className={`
                flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg
                bg-card border border-border text-card-foreground
                ${t.visible ? 'animate-fade-in' : 'opacity-0'}
              `}>
                <Bell className="w-4 h-4 text-primary" />
                <p className="text-sm">
                  {newCount} اعلان جدید دارید
                </p>
              </div>
            ),
            { duration: 4000 }
          )
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