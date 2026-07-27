'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import type { DeviceBreakdown } from '@/types/seo'
import { formatNumber } from '@/lib/utils'

const COLORS = ['hsl(var(--primary))', '#a78bfa', '#34d399']
const DEVICE_LABELS: Record<string, string> = {
  web: 'دسکتاپ',
  mobile: 'موبایل',
  tablet: 'تبلت',
}

interface Props {
  data: DeviceBreakdown[]
  loading?: boolean
}

export function DeviceChart({ data, loading }: Props) {
  if (loading) return <Skeleton className="w-full h-64" />

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        داده‌ای موجود نیست
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: DEVICE_LABELS[d.device] || d.device,
    value: d.total_clicks,
    impressions: d.total_impressions,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={4}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [formatNumber(value), name]}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
        />
        <Legend formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}