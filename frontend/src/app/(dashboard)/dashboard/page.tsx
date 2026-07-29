'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Loader2, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TrendChart } from '@/components/charts/TrendChart'
import { DeviceChart } from '@/components/charts/DeviceChart'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAuthStore } from '@/store/authStore'
import { projectsApi } from '@/lib/api/projects'
import { seoApi } from '@/lib/api/seo'
import { QUERY_KEYS, DATE_RANGES } from '@/lib/constants'
import { getDateRange } from '@/lib/utils'
import { MousePointerClick, Eye, TrendingUp, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [days, setDays] = useState(28)

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: QUERY_KEYS.PROJECTS,
    queryFn: () => projectsApi.list({ status: 'active' }),
  })

  const projects = projectsData?.data ?? []

  const firstProject = projects[0]
  const activeProjectId = selectedProjectId || firstProject?.id || ''

  const filters = getDateRange(days)

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: [...QUERY_KEYS.SEO_SUMMARY(activeProjectId), days],
    queryFn: () => seoApi.getSummary(activeProjectId, filters),
    enabled: !!activeProjectId,
  })

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: [...QUERY_KEYS.SEO_TREND(activeProjectId), days],
    queryFn: () => seoApi.getDailyTrend(activeProjectId, filters),
    enabled: !!activeProjectId,
  })

  const { data: deviceData, isLoading: deviceLoading } = useQuery({
    queryKey: ['seo', activeProjectId, 'devices', days],
    queryFn: () => seoApi.getDeviceBreakdown(activeProjectId, filters),
    enabled: !!activeProjectId,
  })

  const summary = summaryData?.data
  const trend = (trendData?.data ?? []) as any[]
  const devices = (deviceData?.data ?? []) as any[]

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="داشبورد"
        description={`خوش آمدید، ${user?.full_name || ''}`}
        actions={
          projects.length > 0 ? (
            <div className="flex items-center gap-3">
              <Select
                value={activeProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="انتخاب پروژه" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((r) => (
                    <SelectItem key={r.value} value={String(r.value)}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : undefined
        }
      />

      {projects.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={FolderOpen}
              title="هنوز پروژه‌ای ندارید"
              description="از منوی پروژه‌ها، اولین پروژه خود را ایجاد کنید"
              action={{
                label: 'ایجاد پروژه',
                onClick: () => router.push('/projects'),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="کل کلیک‌ها"
              value={summary?.total_clicks}
              icon={MousePointerClick}
              color="blue"
              loading={summaryLoading}
            />
            <MetricCard
              title="کل نمایش‌ها"
              value={summary?.total_impressions}
              icon={Eye}
              color="purple"
              loading={summaryLoading}
            />
            <MetricCard
              title="میانگین CTR"
              value={summary?.avg_ctr}
              format="ctr"
              icon={TrendingUp}
              color="green"
              loading={summaryLoading}
            />
            <MetricCard
              title="میانگین رتبه"
              value={summary?.avg_position}
              format="position"
              icon={Search}
              color="orange"
              loading={summaryLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  روند {DATE_RANGES.find((r) => r.value === days)?.label || ''}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart data={trend} loading={trendLoading} height={280} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">توزیع دستگاه‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceChart data={devices} loading={deviceLoading} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}