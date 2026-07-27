'use client'

import { useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  onClose: () => void
}

export function NotificationPanel({ onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={panelRef}
      className="absolute left-0 top-11 w-80 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <span className="font-semibold text-sm">اعلان‌ها</span>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => markAllRead()}
          >
            <CheckCheck className="w-3 h-3 ml-1" />
            خواندن همه
          </Button>
        )}
      </div>

      <ScrollArea className="h-80">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
            <Bell className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">اعلانی وجود ندارد</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  'flex gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors',
                  !notif.is_read && 'bg-primary/5'
                )}
                onClick={() => {
                  if (!notif.is_read) markRead(notif.id)
                  if (notif.action_url) {
                    onClose()
                  }
                }}
              >
                <div className={cn(
                  'w-2 h-2 rounded-full mt-1.5 shrink-0',
                  notif.is_read ? 'bg-muted' : 'bg-primary'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                    {notif.body}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {formatDateTime(notif.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={onClose}
        >
          مشاهده همه اعلان‌ها
        </Button>
      </div>
    </div>
  )
}