'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, FileText, Download, Trash2,
  Clock, CheckCircle, XCircle, Loader2,
  Calendar, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateReportDialog } from '@/components/reports/CreateReportDialog'
import { CreateScheduledReportDialog } from '@/components/reports/CreateScheduledReportDialog'
import { projectsApi } from '@/lib/api/projects'
import { reportsApi, type Report, type ScheduledReport } from '@/lib/api/reports'
import { QUERY_KEYS } from '@/lib/constants'
import { formatDateTime, formatDate, formatFileSize, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useAuth } from '@/lib/hooks/useAuth'

const FORMAT_COLORS: Record<string, string> = {
  pdf: 'text-red-500 bg-red-500/10',
  excel: 'text-green-500 bg-green-500/10',
  csv: 'text-blue-500 bg-blue-500/10',
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'در صف' },
  generating: { icon: Loader2, color: 'text-blue-500', label: 'در حال ساخت' },
  ready: { icon: CheckCircle, color: 'text-green-500', label: 'آماده' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'خطا' },
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'روزانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
}

export default function ReportsPage() {
  const { canManage } = useAuth()
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createScheduledOpen, setCreateScheduledOpen] = useState(false)

  const { data: projectsData } = useQuery({
    queryKey: QUERY_KEYS.PROJECTS,
    queryFn: () => projectsApi.list(),
  })

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', selectedProjectId],
    queryFn: () => reportsApi.list(selectedProjectId),
    enabled: !!selectedProjectId,
    refetchInterval: (data) => {
      const hasGenerating = data?.data?.some(
        (r: Report) => r.status === 'generating' || r.status === 'pending'
      )
      return hasGenerating ? 5000 : false
    },
  })

  const { data: scheduledData, isLoading: scheduledLoading } = useQuery({
    queryKey: ['scheduled-reports', selectedProjectId],
    queryFn: () => reportsApi.listScheduled(selectedProjectId),
    enabled: !!selectedProjectId,
  })

  const deleteMutation = useMutation({
    mutationFn: reportsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', selectedProjectId] })
      toast.success('گزارش حذف شد')
    },
  })

  const toggleScheduledMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      reportsApi.toggleScheduled(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports', selectedProjectId] })
      toast.success('وضعیت تغییر یافت')
    },
  })

  const deleteScheduledMutation = useMutation({
    mutationFn: reportsApi.deleteScheduled,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports', selectedProjectId] })
      toast.success('گزارش زمان‌بندی‌شده حذف شد')
    },
  })

  const projects = projectsData?.data ?? []
  const reports = reportsData?.data ?? []
  const scheduled = scheduledData?.data ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">گزارشات</h1>
          <p className="text-muted-foreground text-sm mt-1">ساخت و مدیریت گزارشات SEO</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateScheduledOpen(true)}
              disabled={!selectedProjectId}
            >
              <Calendar className="w-4 h-4 ml-2" />
              زمان‌بندی
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)} disabled={!selectedProjectId}>
            <Plus className="w-4 h-4 ml-2" />
            گزارش جدید
          </Button>
        </div>
      </div>

      <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder="انتخاب پروژه" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((p: any) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedProjectId ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            یک پروژه انتخاب کنید
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="reports">
          <TabsList>
            <TabsTrigger value="reports">گزارشات ({reports.length})</TabsTrigger>
            <TabsTrigger value="scheduled">زمان‌بندی‌شده ({scheduled.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="mt-4">
            {reportsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">هنوز گزارشی وجود ندارد</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reports.map((report: Report) => {
                  const statusConfig = STATUS_CONFIG[report.status]
                  const StatusIcon = statusConfig.icon
                  return (
                    <Card key={report.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'p-2.5 rounded-lg',
                            FORMAT_COLORS[report.format] || 'bg-muted text-muted-foreground'
                          )}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{report.name}</p>
                              <Badge variant="secondary" className={cn('text-xs', FORMAT_COLORS[report.format])}>
                                {report.format.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className={cn('flex items-center gap-1', statusConfig.color)}>
                                <StatusIcon className={cn(
                                  'w-3 h-3',
                                  report.status === 'generating' && 'animate-spin'
                                )} />
                                {statusConfig.label}
                              </span>
                              {report.file_size && (
                                <span>{formatFileSize(report.file_size)}</span>
                              )}
                              {report.generated_at && (
                                <span>{formatDateTime(report.generated_at)}</span>
                              )}
                              {report.date_from && report.date_to && (
                                <span>
                                  {formatDate(report.date_from)} — {formatDate(report.date_to)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {report.status === 'ready' && report.file_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => window.open(report.file_url!, '_blank')}
                              >
                                <Download className="w-3.5 h-3.5 ml-1" />
                                دانلود
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                if (confirm('آیا از حذف این گزارش مطمئن هستید؟')) {
                                  deleteMutation.mutate(report.id)
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        {report.error_message && (
                          <p className="mt-2 text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                            {report.error_message}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="mt-4">
            {scheduledLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : scheduled.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Calendar className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">هنوز گزارش زمان‌بندی‌شده‌ای وجود ندارد</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {scheduled.map((s: ScheduledReport) => (
                  <Card key={s.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'p-2.5 rounded-lg',
                          FORMAT_COLORS[s.format] || 'bg-muted'
                        )}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{s.name}</p>
                            <Badge variant="secondary" className={cn('text-xs', FORMAT_COLORS[s.format])}>
                              {s.format.toUpperCase()}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={cn('text-xs', s.is_active ? 'text-green-500' : 'text-muted-foreground')}
                            >
                              {s.is_active ? 'فعال' : 'غیرفعال'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{FREQ_LABELS[s.frequency]}</span>
                            {s.next_run_at && <span>اجرای بعدی: {formatDateTime(s.next_run_at)}</span>}
                            <span>{s.recipients.length} گیرنده</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => toggleScheduledMutation.mutate({
                              id: s.id,
                              active: !s.is_active,
                            })}
                          >
                            {s.is_active ? 'غیرفعال' : 'فعال'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              if (confirm('حذف گزارش زمان‌بندی‌شده؟')) {
                                deleteScheduledMutation.mutate(s.id)
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <CreateReportDialog
        open={createOpen}
        projectId={selectedProjectId}
        onClose={() => setCreateOpen(false)}
      />
      <CreateScheduledReportDialog
        open={createScheduledOpen}
        projectId={selectedProjectId}
        onClose={() => setCreateScheduledOpen(false)}
      />
    </div>
  )
}