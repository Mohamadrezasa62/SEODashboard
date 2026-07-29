'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Database, Plus, Trash2, CheckCircle,
  XCircle, Clock, Loader2, Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { backupApi, type BackupRecord } from '@/lib/api/backup'
import { formatDateTime, formatFileSize, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string, {
  icon: React.ElementType
  color: string
  label: string
}> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'در انتظار' },
  running: { icon: Loader2, color: 'text-blue-500', label: 'در حال اجرا' },
  success: { icon: CheckCircle, color: 'text-green-500', label: 'موفق' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'خطا' },
}

const TYPE_LABELS: Record<string, string> = {
  manual: 'دستی',
  scheduled: 'زمان‌بندی',
}

export default function BackupPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: backupApi.list,
    refetchInterval: (data) => {
      const hasRunning = (data?.data as BackupRecord[] | undefined)?.some(
        (b) => b.status === 'running' || b.status === 'pending'
      )
      return hasRunning ? 5000 : false
    },
  })

  const createMutation = useMutation({
    mutationFn: backupApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('پشتیبان‌گیری شروع شد')
    },
    onError: () => toast.error('خطا در شروع پشتیبان‌گیری'),
  })

  const deleteMutation = useMutation({
    mutationFn: backupApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('پشتیبان حذف شد')
    },
    onError: () => toast.error('خطا در حذف'),
  })

  const backups = (data?.data ?? []) as BackupRecord[]
  const successCount = backups.filter((b) => b.status === 'success').length
  const totalSize = backups
    .filter((b) => b.file_size)
    .reduce((acc, b) => acc + (b.file_size || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">پشتیبان‌گیری</h1>
          <p className="text-muted-foreground text-sm mt-1">مدیریت پشتیبان‌های دیتابیس</p>
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 ml-2" />
          )}
          پشتیبان جدید
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10">
              <Database className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">کل پشتیبان‌ها</p>
              <p className="text-2xl font-bold">{backups.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">موفق</p>
              <p className="text-2xl font-bold">{successCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10">
              <Shield className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">حجم کل</p>
              <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : backups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Database className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">هنوز پشتیبانی گرفته نشده</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {backups.map((backup: BackupRecord) => {
            const statusConfig = STATUS_CONFIG[backup.status]
            const StatusIcon = statusConfig.icon
            return (
              <Card key={backup.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'p-2.5 rounded-lg',
                      backup.status === 'success' ? 'bg-green-500/10' :
                      backup.status === 'failed' ? 'bg-red-500/10' :
                      'bg-blue-500/10'
                    )}>
                      <Database className={cn('w-5 h-5', statusConfig.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{backup.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_LABELS[backup.backup_type]}
                        </Badge>
                        <span className={cn('flex items-center gap-1 text-xs', statusConfig.color)}>
                          <StatusIcon className={cn(
                            'w-3 h-3',
                            backup.status === 'running' && 'animate-spin'
                          )} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {backup.file_size_mb && (
                          <span>{backup.file_size_mb} MB</span>
                        )}
                        {backup.duration_seconds && (
                          <span>{backup.duration_seconds} ثانیه</span>
                        )}
                        {backup.initiated_by && (
                          <span>توسط: {backup.initiated_by.full_name}</span>
                        )}
                        <span>{formatDateTime(backup.created_at)}</span>
                      </div>
                      {backup.error_message && (
                        <p className="mt-1 text-xs text-destructive">
                          {backup.error_message}
                        </p>
                      )}
                      {backup.checksum && (
                        <p className="mt-1 text-xs text-muted-foreground font-mono truncate" dir="ltr">
                          SHA256: {backup.checksum.slice(0, 16)}...
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => {
                        if (confirm('آیا از حذف این پشتیبان مطمئن هستید؟')) {
                          deleteMutation.mutate(backup.id)
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}