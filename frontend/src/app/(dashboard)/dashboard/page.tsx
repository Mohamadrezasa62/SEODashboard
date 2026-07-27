'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart3, Search, MousePointerClick, TrendingUp, Eye, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TrendChart } from '@/components/charts/TrendChart'
import { useAuthStore } from '@/store/authStore'
import { projectsApi } from '@/lib/api/projects'
import { seoApi } from '@/lib/api/seo'
import { QUERY_KEYS } from '@/lib/constants'
import { getDateRange } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const dateRange = getDateRange(28)

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: QUERY_KEYS.PROJECTS,
    queryFn: () => projectsApi.list(),
  })

  const projects = projectsData?.data ?? []
  const firstProject = projects[0]

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: [...QUERY_KEYS.SEO_SUMMARY(firstProject?.id ?? ''), dateRange],
    queryFn: () => seoApi.getSummary(firstProject.id, dateRange),
    enabled: !!firstProject?.id,
  })

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: [...QUERY_KEYS.SEO_TREND(firstProject?.id ?? ''), dateRange],
    queryFn: () => seoApi.getDailyTrend(firstProject.id, dateRange),
    enabled: !!firstProject?.id,
  })

  const summary = summaryData?.data
  const trend = trendData?.data ?? []

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">داشبورد</h1>
        <p className="text-muted-foreground text-sm mt-1">
          خوش آمدید، {user?.full_name}
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">هنوز پروژه‌ای ندارید</p>
            <p className="text-sm mt-2">از منوی پروژه‌ها، اولین پروژه خود را ایجاد کنید</p>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">روند ۲۸ روز گذشته</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={trend} loading={trendLoading} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}