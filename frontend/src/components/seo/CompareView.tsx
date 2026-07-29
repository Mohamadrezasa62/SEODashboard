'use client'

import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { seoApi } from '@/lib/api/seo'
import { formatNumber, formatCTR, formatPosition, cn } from '@/lib/utils'
import type { SEOSummary, DailyTrend } from '@/types/seo'

interface CompareRange {
  label: string
  date_from: string
  date_to: string
}

interface Props {
  projectId: string
  primary: CompareRange
  secondary: CompareRange
}

interface MetricDiff {
  label: string
  primaryValue: number | null
  secondaryValue: number | null
  format: 'number' | 'ctr' | 'position'
  higherIsBetter: boolean
}

function formatValue(value: number | null, format: string): string {
  if (value === null || value === undefined) return '—'
  if (format === 'ctr') return formatCTR(value)
  if (format === 'position') return formatPosition(value)
  return formatNumber(value)
}

function getDiffPct(primary: number | null, secondary: number | null): number | null {
  if (!primary || !secondary || secondary === 0) return null
  return ((primary - secondary) / secondary) * 100
}

function DiffBadge({
  diff,
  higherIsBetter,
}: {
  diff: number | null
  higherIsBetter: boolean
}) {
  if (diff === null) return null

  const isPositive = higherIsBetter ? diff > 0 : diff < 0
  const isNeutral = Math.abs(diff) < 0.1

  if (isNeutral) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" />
        {diff.toFixed(1)}%
      </span>
    )
  }

  return (
    <span className={cn(
      'flex items-center gap-1 text-xs font-medium',
      isPositive ? 'text-green-500' : 'text-red-500'
    )}>
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {Math.abs(diff).toFixed(1)}%
    </span>
  )
}

export function CompareView({ projectId, primary, secondary }: Props) {
  const { data: primarySummary, isLoading: primaryLoading } = useQuery({
    queryKey: ['seo', projectId, 'summary', 'primary', primary.date_from, primary.date_to],
    queryFn: () => seoApi.getSummary(projectId, {
      date_from: primary.date_from,
      date_to: primary.date_to,
    }),
    enabled: !!projectId,
  })

  const { data: secondarySummary, isLoading: secondaryLoading } = useQuery({
    queryKey: ['seo', projectId, 'summary', 'secondary', secondary.date_from, secondary.date_to],
    queryFn: () => seoApi.getSummary(projectId, {
      date_from: secondary.date_from,
      date_to: secondary.date_to,
    }),
    enabled: !!projectId,
  })

  const { data: primaryTrend, isLoading: primaryTrendLoading } = useQuery({
    queryKey: ['seo', projectId, 'trend', 'primary', primary.date_from, primary.date_to],
    queryFn: () => seoApi.getDailyTrend(projectId, {
      date_from: primary.date_from,
      date_to: primary.date_to,
    }),
    enabled: !!projectId,
  })

  const { data: secondaryTrend } = useQuery({
    queryKey: ['seo', projectId, 'trend', 'secondary', secondary.date_from, secondary.date_to],
    queryFn: () => seoApi.getDailyTrend(projectId, {
      date_from: secondary.date_from,
      date_to: secondary.date_to,
    }),
    enabled: !!projectId,
  })

  const p = primarySummary?.data as SEOSummary | undefined
  const s = secondarySummary?.data as SEOSummary | undefined
  const pTrend = (primaryTrend?.data ?? []) as DailyTrend[]
  const sTrend = (secondaryTrend?.data ?? []) as DailyTrend[]

  const metrics: MetricDiff[] = [
    {
      label: 'کل کلیک‌ها',
      primaryValue: p?.total_clicks ?? null,
      secondaryValue: s?.total_clicks ?? null,
      format: 'number',
      higherIsBetter: true,
    },
    {
      label: 'کل نمایش‌ها',
      primaryValue: p?.total_impressions ?? null,
      secondaryValue: s?.total_impressions ?? null,
      format: 'number',
      higherIsBetter: true,
    },
    {
      label: 'میانگین CTR',
      primaryValue: p?.avg_ctr ?? null,
      secondaryValue: s?.avg_ctr ?? null,
      format: 'ctr',
      higherIsBetter: true,
    },
    {
      label: 'میانگین رتبه',
      primaryValue: p?.avg_position ?? null,
      secondaryValue: s?.avg_position ?? null,
      format: 'position',
      higherIsBetter: false,
    },
    {
      label: 'کلیدواژه‌ها',
      primaryValue: p?.total_keywords ?? null,
      secondaryValue: s?.total_keywords ?? null,
      format: 'number',
      higherIsBetter: true,
    },
    {
      label: 'صفحات',
      primaryValue: p?.total_pages ?? null,
      secondaryValue: s?.total_pages ?? null,
      format: 'number',
      higherIsBetter: true,
    },
  ]

  const isLoading = primaryLoading || secondaryLoading

  const mergedTrend = pTrend.map((item, index) => ({
    date: item.date,
    [`کلیک (${primary.label})`]: item.total_clicks,
    [`کلیک (${secondary.label})`]: sTrend[index]?.total_clicks ?? null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="gap-2 text-primary">
          <div className="w-2 h-2 rounded-full bg-primary" />
          {primary.label}: {primary.date_from} — {primary.date_to}
        </Badge>
        <span className="text-muted-foreground text-sm">در مقابل</span>
        <Badge variant="secondary" className="gap-2 text-purple-500">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          {secondary.label}: {secondary.date_from} — {secondary.date_to}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const diff = getDiffPct(metric.primaryValue, metric.secondaryValue)
          return (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">{metric.label}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <p className="text-xl font-bold mb-1">
                      {formatValue(metric.primaryValue, metric.format)}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {formatValue(metric.secondaryValue, metric.format)}
                      </p>
                      <DiffBadge diff={diff} higherIsBetter={metric.higherIsBetter} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {mergedTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">مقایسه روند کلیک‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            {primaryTrendLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={mergedTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatNumber}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                  />
                  <Legend formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
                  <Line
                    type="monotone"
                    dataKey={`کلیک (${primary.label})`}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey={`کلیک (${secondary.label})`}
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}