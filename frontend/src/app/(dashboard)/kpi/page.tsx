'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Target, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateKPIDialog } from '@/components/kpi/CreateKPIDialog'
import { projectsApi } from '@/lib/api/projects'
import { kpiApi, type KPI, type KPIAlert } from '@/lib/api/kpi'
import { QUERY_KEYS } from '@/lib/constants'
import { formatNumber, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useAuth } from '@/lib/hooks/useAuth'

const KPI_TYPE_LABELS: Record<string, string> = {
  clicks: 'کلیک',
  impressions: 'نمایش',
  ctr: 'CTR',
  position: 'رتبه',
  keywords: 'کلیدواژه',
  pages: 'صفحه',
  custom: 'سفارشی',
}

const PERIOD_LABELS: Record<string, string> = {
  daily: 'روزانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
  quarterly: 'فصلی',
}

export default function KPIPage() {
  const { canManage } = useAuth()
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const { data: projectsData } = useQuery({
    queryKey: QUERY_KEYS.PROJECTS,
    queryFn: () => projectsApi.list(),
    onSuccess: (d: any) => {
      if (d.data?.length && !selectedProjectId) setSelectedProjectId(d.data[0].id)
    },
  })

  const { data: kpisData, isLoading: kpisLoading } = useQuery({
    queryKey: [...QUERY_KEYS.KPIS(selectedProjectId)],
    queryFn: () => kpiApi.list(selectedProjectId),
    enabled: !!selectedProjectId,
  })

  const { data: alertsData } = useQuery({
    queryKey: ['kpi-alerts', selectedProjectId],
    queryFn: () => kpiApi.getAlerts(selectedProjectId),
    enabled: !!selectedProjectId,
  })

  const deleteMutation = useMutation({
    mutationFn: kpiApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.KPIS(selectedProjectId) })
      toast.success('KPI حذف شد')
    },
  })

  const resolveAlertMutation = useMutation({
    mutationFn: kpiApi.resolveAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-alerts', selectedProjectId] })
      toast.success('هشدار حل‌شده علامت‌گذاری شد')
    },
  })

  const projects = projectsData?.data ?? []
  const kpis = kpisData?.data ?? []
  const alerts = alertsData?.data ?? []
  const unresolvedAlerts = alerts.filter((a: KPIAlert) => !a.is_resolved)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KPI</h1>
          <p className="text-muted-foreground text-sm mt-1">شاخص‌های کلیدی عملکرد</p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} disabled={!selectedProjectId}>
            <Plus className="w-4 h-4 ml-2" />
            KPI جدید
          </Button>
        )}
      </div>

      <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="انتخاب پروژه" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((p: any) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {unresolvedAlerts.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-500">
              <AlertTriangle className="w-4 h-4" />
              هشدارهای فعال ({unresolvedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unresolvedAlerts.map((alert: KPIAlert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between gap-3 p-3 bg-card rounded-lg border border-border"
              >
                <div>
                  <p className="text-xs font-medium">{alert.kpi_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs shrink-0 text-green-500"
                  onClick={() => resolveAlertMutation.mutate(alert.id)}
                >
                  <CheckCircle className="w-3 h-3 ml-1" />
                  حل‌شد
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!selectedProjectId ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            یک پروژه انتخاب کنید
          </CardContent>
        </Card>
      ) : kpisLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : kpis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Target className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">هنوز KPI‌ای تعریف نشده</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi: KPI) => (
            <KPICard
              key={kpi.id}
              kpi={kpi}
              canManage={canManage}
              onDelete={() => {
                if (confirm('آیا از حذف این KPI مطمئن هستید؟')) {
                  deleteMutation.mutate(kpi.id)
                }
              }}
            />
          ))}
        </div>
      )}

      <CreateKPIDialog
        open={createOpen}
        projectId={selectedProjectId}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  )
}

function KPICard({
  kpi,
  canManage,
  onDelete,
}: {
  kpi: KPI
  canManage: boolean
  onDelete: () => void
}) {
  const pct = Math.min(Math.max(kpi.achievement_pct, 0), 100)
  const color = pct >= 90 ? 'text-green-500' : pct >= 60 ? 'text-yellow-500' : 'text-red-500'
  const progressColor = pct >= 90 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm">{kpi.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {KPI_TYPE_LABELS[kpi.kpi_type] || kpi.kpi_type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {PERIOD_LABELS[kpi.period] || kpi.period}
              </Badge>
            </div>
          </div>
          <div className={cn('text-2xl font-bold', color)}>
            {pct.toFixed(0)}%
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>فعلی: {formatNumber(kpi.current_value)}</span>
            <span>هدف: {formatNumber(kpi.target_value)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', progressColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>آخرین ثبت: {formatDate(kpi.latest_record_date)}</span>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-destructive px-2"
              onClick={onDelete}
            >
              حذف
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}