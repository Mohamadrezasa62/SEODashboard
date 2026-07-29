// 'use client'

// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import {
//   Database, Plus, Trash2, CheckCircle,
//   XCircle, Clock, Loader2, Shield,
// } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { Skeleton } from '@/components/ui/skeleton'
// import { backupApi, type BackupRecord } from '@/lib/api/backup'
// import { formatDateTime, formatFileSize, cn } from '@/lib/utils'
// import toast from 'react-hot-toast'

// const STATUS_CONFIG: Record<string, {
//   icon: React.ElementType
//   color: string
//   label: string
// }> = {
//   pending: { icon: Clock, color: 'text-yellow-500', label: 'در انتظار' },
//   running: { icon: Loader2, color: 'text-blue-500', label: 'در حال اجرا' },
//   success: { icon: CheckCircle, color: 'text-green-500', label: 'موفق' },
//   failed: { icon: XCircle, color: 'text-red-500', label: 'خطا' },
// }

// const TYPE_LABELS: Record<string, string> = {
//   manual: 'دستی',
//   scheduled: 'زمان‌بندی',
// }

// export default function BackupPage() {
//   const queryClient = useQueryClient()

//   const { data, isLoading } = useQuery({
//     queryKey: ['backups'],
//     queryFn: backupApi.list,
//     refetchInterval: (data) => {
//       const hasRunning = (data?.data as BackupRecord[] | undefined)?.some(
//         (b) => b.status === 'running' || b.status === 'pending'
//       )
//       return hasRunning ? 5000 : false
//     },
//   })

//   const createMutation = useMutation({
//     mutationFn: backupApi.create,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['backups'] })
//       toast.success('پشتیبان‌گیری شروع شد')
//     },
//     onError: () => toast.error('خطا در شروع پشتیبان‌گیری'),
//   })

//   const deleteMutation = useMutation({
//     mutationFn: backupApi.delete,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['backups'] })
//       toast.success('پشتیبان حذف شد')
//     },
//     onError: () => toast.error('خطا در حذف'),
//   })

//   const backups = (data?.data ?? []) as BackupRecord[]
//   const successCount = backups.filter((b) => b.status === 'success').length
//   const totalSize = backups
//     .filter((b) => b.file_size)
//     .reduce((acc, b) => acc + (b.file_size || 0), 0)

//   return (
//     <div className="space-y-6 animate-fade-in">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">پشتیبان‌گیری</h1>
//           <p className="text-muted-foreground text-sm mt-1">مدیریت پشتیبان‌های دیتابیس</p>
//         </div>
//         <Button
//           onClick={() => createMutation.mutate()}
//           disabled={createMutation.isPending}
//         >
//           {createMutation.isPending ? (
//             <Loader2 className="w-4 h-4 ml-2 animate-spin" />
//           ) : (
//             <Plus className="w-4 h-4 ml-2" />
//           )}
//           پشتیبان جدید
//         </Button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <Card>
//           <CardContent className="p-5 flex items-center gap-3">
//             <div className="p-2.5 rounded-lg bg-blue-500/10">
//               <Database className="w-5 h-5 text-blue-500" />
//             </div>
//             <div>
//               <p className="text-xs text-muted-foreground">کل پشتیبان‌ها</p>
//               <p className="text-2xl font-bold">{backups.length}</p>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-5 flex items-center gap-3">
//             <div className="p-2.5 rounded-lg bg-green-500/10">
//               <CheckCircle className="w-5 h-5 text-green-500" />
//             </div>
//             <div>
//               <p className="text-xs text-muted-foreground">موفق</p>
//               <p className="text-2xl font-bold">{successCount}</p>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-5 flex items-center gap-3">
//             <div className="p-2.5 rounded-lg bg-purple-500/10">
//               <Shield className="w-5 h-5 text-purple-500" />
//             </div>
//             <div>
//               <p className="text-xs text-muted-foreground">حجم کل</p>
//               <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {isLoading ? (
//         <div className="space-y-3">
//           {Array.from({ length: 5 }).map((_, i) => (
//             <Skeleton key={i} className="h-20 w-full" />
//           ))}
//         </div>
//       ) : backups.length === 0 ? (
//         <Card>
//           <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
//             <Database className="w-12 h-12 mb-4 opacity-20" />
//             <p className="text-sm">هنوز پشتیبانی گرفته نشده</p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-3">
//           {backups.map((backup: BackupRecord) => {
//             const statusConfig = STATUS_CONFIG[backup.status]
//             const StatusIcon = statusConfig.icon
//             return (
//               <Card key={backup.id} className="hover:shadow-sm transition-shadow">
//                 <CardContent className="p-4">
//                   <div className="flex items-center gap-4">
//                     <div className={cn(
//                       'p-2.5 rounded-lg',
//                       backup.status === 'success' ? 'bg-green-500/10' :
//                       backup.status === 'failed' ? 'bg-red-500/10' :
//                       'bg-blue-500/10'
//                     )}>
//                       <Database className={cn('w-5 h-5', statusConfig.color)} />
//                     </div>

//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-2 mb-1">
//                         <p className="font-medium text-sm">{backup.name}</p>
//                         <Badge variant="secondary" className="text-xs">
//                           {TYPE_LABELS[backup.backup_type]}
//                         </Badge>
//                         <span className={cn('flex items-center gap-1 text-xs', statusConfig.color)}>
//                           <StatusIcon className={cn(
//                             'w-3 h-3',
//                             backup.status === 'running' && 'animate-spin'
//                           )} />
//                           {statusConfig.label}
//                         </span>
//                       </div>
//                       <div className="flex items-center gap-3 text-xs text-muted-foreground">
//                         {backup.file_size_mb && (
//                           <span>{backup.file_size_mb} MB</span>
//                         )}
//                         {backup.duration_seconds && (
//                           <span>{backup.duration_seconds} ثانیه</span>
//                         )}
//                         {backup.initiated_by && (
//                           <span>توسط: {backup.initiated_by.full_name}</span>
//                         )}
//                         <span>{formatDateTime(backup.created_at)}</span>
//                       </div>
//                       {backup.error_message && (
//                         <p className="mt-1 text-xs text-destructive">
//                           {backup.error_message}
//                         </p>
//                       )}
//                       {backup.checksum && (
//                         <p className="mt-1 text-xs text-muted-foreground font-mono truncate" dir="ltr">
//                           SHA256: {backup.checksum.slice(0, 16)}...
//                         </p>
//                       )}
//                     </div>

//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
//                       onClick={() => {
//                         if (confirm('آیا از حذف این پشتیبان مطمئن هستید؟')) {
//                           deleteMutation.mutate(backup.id)
//                         }
//                       }}
//                     >
//                       <Trash2 className="w-3.5 h-3.5" />
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             )
//           })}
//         </div>
//       )}
//     </div>
//   )
// }
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Database, Plus, Trash2, CheckCircle,
  XCircle, Clock, Loader2, Shield,
  RotateCcw, History, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { backupApi, type BackupRecord, type RestoreRecord } from '@/lib/api/backup'
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
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null)
  const [restoreNotes, setRestoreNotes] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

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

  const { data: restoresData, isLoading: restoresLoading } = useQuery({
    queryKey: ['restores'],
    queryFn: backupApi.listRestores,
    refetchInterval: (data) => {
      const hasRunning = (data?.data as RestoreRecord[] | undefined)?.some(
        (r) => r.status === 'running' || r.status === 'pending'
      )
      return hasRunning ? 5000 : false
    },
  })

  const createMutation = useMutation({
    mutationFn: () => backupApi.create(notes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('پشتیبان‌گیری شروع شد')
      setNotes('')
    },
    onError: () => toast.error('خطا در شروع پشتیبان‌گیری'),
  })

  const deleteMutation = useMutation({
    mutationFn: backupApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('پشتیبان حذف شد')
      setDeleteTarget(null)
    },
    onError: () => toast.error('خطا در حذف'),
  })

  const verifyMutation = useMutation({
    mutationFn: backupApi.verify,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('تأیید صحت در صف قرار گرفت')
    },
    onError: () => toast.error('خطا در تأیید صحت'),
  })

  const restoreMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      backupApi.restore(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      queryClient.invalidateQueries({ queryKey: ['restores'] })
      toast.success('بازیابی با موفقیت انجام شد')
      setRestoreTarget(null)
      setRestoreNotes('')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در بازیابی')
    },
  })

  const backups = (data?.data ?? []) as BackupRecord[]
  const restores = (restoresData?.data ?? []) as RestoreRecord[]

  const successCount = backups.filter((b) => b.status === 'success').length
  const totalSize = backups
    .filter((b) => b.file_size)
    .reduce((acc, b) => acc + (b.file_size || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="پشتیبان‌گیری"
        description="مدیریت پشتیبان‌ها و بازیابی دیتابیس"
        actions={
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
        }
      />

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

      <Tabs defaultValue="backups">
        <TabsList>
          <TabsTrigger value="backups">
            <Database className="w-4 h-4 ml-2" />
            پشتیبان‌ها ({backups.length})
          </TabsTrigger>
          <TabsTrigger value="restores">
            <History className="w-4 h-4 ml-2" />
            بازیابی‌ها ({restores.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
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
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'p-2.5 rounded-lg shrink-0',
                          backup.status === 'success' ? 'bg-green-500/10' :
                          backup.status === 'failed' ? 'bg-red-500/10' : 'bg-blue-500/10'
                        )}>
                          <Database className={cn('w-5 h-5', statusConfig.color)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                            {backup.is_verified && (
                              <span className="flex items-center gap-1 text-xs text-green-500">
                                <Shield className="w-3 h-3" />
                                تأیید شده
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {backup.file_size_mb && (
                              <span>{backup.file_size_mb} MB</span>
                            )}
                            {backup.duration_seconds && (
                              <span>{backup.duration_seconds}s</span>
                            )}
                            {backup.initiated_by && (
                              <span>توسط: {backup.initiated_by.full_name}</span>
                            )}
                            <span>{formatDateTime(backup.created_at)}</span>
                          </div>

                          {backup.notes && (
                            <p className="mt-1 text-xs text-muted-foreground italic">
                              {backup.notes}
                            </p>
                          )}

                          {backup.error_message && (
                            <p className="mt-1 text-xs text-destructive">
                              {backup.error_message}
                            </p>
                          )}

                          {backup.checksum && (
                            <p className="mt-1 text-xs text-muted-foreground font-mono" dir="ltr">
                              SHA256: {backup.checksum.slice(0, 20)}...
                            </p>
                          )}

                          {backup.restore_count > 0 && (
                            <p className="mt-1 text-xs text-blue-500">
                              {backup.restore_count} بار بازیابی شده
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          {backup.status === 'success' && (
                            <>
                              {!backup.is_verified && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => verifyMutation.mutate(backup.id)}
                                  disabled={verifyMutation.isPending}
                                >
                                  <Shield className="w-3 h-3 ml-1" />
                                  تأیید
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-orange-500 border-orange-500/30"
                                onClick={() => setRestoreTarget(backup)}
                              >
                                <RotateCcw className="w-3 h-3 ml-1" />
                                بازیابی
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => setDeleteTarget(backup.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="restores" className="mt-4">
          {restoresLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : restores.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <History className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">هیچ بازیابی‌ای انجام نشده</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {restores.map((restore: RestoreRecord) => {
                const statusConfig = STATUS_CONFIG[restore.status]
                const StatusIcon = statusConfig.icon
                return (
                  <Card key={restore.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'p-2.5 rounded-lg shrink-0',
                          restore.status === 'success' ? 'bg-green-500/10' :
                          restore.status === 'failed' ? 'bg-red-500/10' : 'bg-blue-500/10'
                        )}>
                          <RotateCcw className={cn('w-5 h-5', statusConfig.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              بازیابی از: {restore.backup_name}
                            </p>
                            <span className={cn('flex items-center gap-1 text-xs', statusConfig.color)}>
                              <StatusIcon className={cn(
                                'w-3 h-3',
                                restore.status === 'running' && 'animate-spin'
                              )} />
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {restore.initiated_by && (
                              <span>توسط: {restore.initiated_by.full_name}</span>
                            )}
                            {restore.duration_seconds && (
                              <span>{restore.duration_seconds}s</span>
                            )}
                            <span>{formatDateTime(restore.created_at)}</span>
                          </div>
                          {restore.notes && (
                            <p className="mt-1 text-xs text-muted-foreground italic">
                              {restore.notes}
                            </p>
                          )}
                          {restore.error_message && (
                            <p className="mt-1 text-xs text-destructive">
                              {restore.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Restore Confirm Dialog */}
      {restoreTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-500">
                <AlertTriangle className="w-5 h-5" />
                تأیید بازیابی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                آیا از بازیابی پشتیبان <span className="font-semibold text-foreground">{restoreTarget.name}</span> مطمئن هستید؟
                این عملیات دیتابیس فعلی را با محتوای پشتیبان جایگزین می‌کند.
              </p>
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-xs text-destructive font-medium">
                  هشدار: این عملیات برگشت‌ناپذیر است. قبل از بازیابی، یک پشتیبان جدید بگیرید.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">یادداشت (اختیاری)</Label>
                <Textarea
                  placeholder="دلیل بازیابی..."
                  value={restoreNotes}
                  onChange={(e) => setRestoreNotes(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setRestoreTarget(null)
                    setRestoreNotes('')
                  }}
                >
                  انصراف
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() =>
                    restoreMutation.mutate({
                      id: restoreTarget.id,
                      notes: restoreNotes || undefined,
                    })
                  }
                  disabled={restoreMutation.isPending}
                >
                  {restoreMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <RotateCcw className="w-4 h-4 ml-2" />
                  )}
                  بازیابی
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف پشتیبان"
        description="آیا از حذف این پشتیبان مطمئن هستید؟ فایل از دیسک حذف خواهد شد."
        confirmLabel="حذف"
        cancelLabel="انصراف"
        destructive
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}