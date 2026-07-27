'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TrendChart } from '@/components/charts/TrendChart'
import { KeywordsTable } from '@/components/seo/KeywordsTable'
import { PagesTable } from '@/components/seo/PagesTable'
import { DeviceChart } from '@/components/charts/DeviceChart'
import { projectsApi } from '@/lib/api/projects'
import { seoApi } from '@/lib/api/seo'
import { QUERY_KEYS, DATE_RANGES } from '@/lib/constants'
import { getDateRange } from '@/lib/utils'
import { MousePointerClick, Eye, TrendingUp, Search } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function SEOPage() {
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [dateRange, setDateRange] = useState(28)

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: QUERY_KEYS.PROJECTS,
    queryFn: () => projectsApi.list({ status: 'active' }),
    onSuccess: (data) => {
      if (data.data?.length && !selectedProjectId) {
        setSelectedProjectId(data.data[0].id)
      }
    },
  })

  const projects = projectsData?.data ?? []
  const filters = selectedProjectId ? getDateRange(dateRange) : undefined

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: [...QUERY_KEYS.SEO_SUMMARY(selectedProjectId), dateRange],
    queryFn: () => seoApi.getSummary(selectedProjectId, filters),
    enabled: !!selectedProjectId,
  })

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: [...QUERY_KEYS.SEO_TREND(selectedProjectId), dateRange],
    queryFn: () => seoApi.getDailyTrend(selectedProjectId, filters),
    enabled: !!selectedProjectId,
  })

  const { data: keywordsData, isLoading: keywordsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.SEO_KEYWORDS(selectedProjectId), dateRange],
    queryFn: () => seoApi.getTopKeywords(selectedProjectId, { ...filters, limit: 100 }),
    enabled: !!selectedProjectId,
  })

  const { data: pagesData, isLoading: pagesLoading } = useQuery({
    queryKey: [...QUERY_KEYS.SEO_PAGES(selectedProjectId), dateRange],
    queryFn: () => seoApi.getTopPages(selectedProjectId, { ...filters, limit: 100 }),
    enabled: !!selectedProjectId,
  })

  const { data: deviceData, isLoading: deviceLoading } = useQuery({
    queryKey: ['seo', selectedProjectId, 'devices', dateRange],
    queryFn: () => seoApi.getDeviceBreakdown(selectedProjectId, filters),
    enabled: !!selectedProjectId,
  })

  const syncMutation = useMutation({
    mutationFn: () => seoApi.syncGSC(selectedProjectId),
    onSuccess: () => {
      toast.success('همگام‌سازی در صف قرار گرفت')
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['seo', selectedProjectId] })
      }, 3000)
    },
    onError: () => toast.error('خطا در همگام‌سازی'),
  })

  const summary = summaryData?.data
  const trend = trendData?.data ?? []
  const keywords = keywordsData?.data ?? []
  const pages = pagesData?.data ?? []
  const devices = deviceData?.data ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">SEO Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">آنالیز عملکرد موتور جستجو</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="انتخاب پروژه" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(dateRange)} onValueChange={(v) => setDateRange(Number(v))}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={!selectedProjectId || syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="mr-2">همگام‌سازی</span>
          </Button>
        </div>
      </div>

      {!selectedProjectId ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
            <p>یک پروژه انتخاب کنید</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="کل کلیک‌ها" value={summary?.total_clicks} icon={MousePointerClick} color="blue" loading={summaryLoading} />
            <MetricCard title="کل نمایش‌ها" value={summary?.total_impressions} icon={Eye} color="purple" loading={summaryLoading} />
            <MetricCard title="میانگین CTR" value={summary?.avg_ctr} format="ctr" icon={TrendingUp} color="green" loading={summaryLoading} />
            <MetricCard title="میانگین رتبه" value={summary?.avg_position} format="position" icon={Search} color="orange" loading={summaryLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">روند زمانی</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart data={trend} loading={trendLoading} height={280} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">بر اساس دستگاه</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceChart data={devices} loading={deviceLoading} />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="keywords">
            <TabsList>
              <TabsTrigger value="keywords">کلیدواژه‌ها ({keywords.length})</TabsTrigger>
              <TabsTrigger value="pages">صفحات ({pages.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="keywords" className="mt-4">
              <KeywordsTable data={keywords} loading={keywordsLoading} />
            </TabsContent>
            <TabsContent value="pages" className="mt-4">
              <PagesTable data={pages} loading={pagesLoading} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}