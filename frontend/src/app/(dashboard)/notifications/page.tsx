'use client'

import { Bell, CheckCheck, Trash2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications, type Notification } from '@/lib/hooks/useNotifications'
import { formatDateTime, cn } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/notifications'
import { QUERY_KEYS } from '@/lib/constants'
import toast from 'react-hot-toast'

const TYPE_LABELS: Record<string, string> = {
  mention: 'منشن',
  comment: 'کامنت',
  feedback_status: 'وضعیت فیدبک',
  project_invite: 'دعوت به پروژه',
  kpi_alert: 'هشدار KPI',
  seo_alert: 'هشدار SEO',
  system: 'سیستم',
  report_ready: 'گزارش آماده',
}

const TYPE_COLORS: Record<string, string> = {
  mention: 'bg-blue-500/10 text-blue-500',
  comment: 'bg-purple-500/10 text-purple-500',
  kpi_alert: 'bg-orange-500/10 text-orange-500',
  seo_alert: 'bg-yellow-500/10 text-yellow-500',
  report_ready: 'bg-green-500/10 text-green-500',
  system: 'bg-gray-500/10 text-gray-500',
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications()

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS })
      toast.success('اعلان حذف شد')
    },
  })

  const unread = notifications.filter((n: Notification) => !n.is_read)
  const read = notifications.filter((n: Notification) => n.is_read)

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">اعلان‌ها</h1>
          {unreadCount > 0 && (
            <p className="text-muted-foreground text-sm mt-1">{unreadCount} اعلان خوانده‌نشده</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead()}>
            <CheckCheck className="w-4 h-4 ml-2" />
            خواندن همه
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">همه ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">
            خوانده‌نشده
            {unreadCount > 0 && (
              <Badge variant="destructive" className="mr-1.5 h-4 min-w-4 text-xs px-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            onMarkRead={markRead}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="unread" className="mt-4">
          <NotificationList
            notifications={unread}
            isLoading={isLoading}
            onMarkRead={markRead}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationList({
  notifications,
  isLoading,
  onMarkRead,
  onDelete,
}: {
  notifications: Notification[]
  isLoading: boolean
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bell className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">اعلانی وجود ندارد</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((notif) => (
        <Card
          key={notif.id}
          className={cn(
            'transition-colors',
            !notif.is_read && 'border-primary/20 bg-primary/3'
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-2 h-2 rounded-full mt-2 shrink-0',
                notif.is_read ? 'bg-muted' : 'bg-primary'
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', TYPE_COLORS[notif.notification_type] || 'bg-muted text-muted-foreground')}
                      >
                        {TYPE_LABELS[notif.notification_type] || notif.notification_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-snug">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {notif.body}
                    </p>
                    {notif.sender && (
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        از: {notif.sender.full_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => onMarkRead(notif.id)}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(notif.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}