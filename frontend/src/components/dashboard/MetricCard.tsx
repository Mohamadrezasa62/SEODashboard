'use client'

import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, formatCTR, formatPosition } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value?: number | null
  format?: 'number' | 'ctr' | 'position'
  icon: LucideIcon
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red'
  loading?: boolean
  trend?: number
}

const colorMap = {
  blue: 'bg-blue-500/10 text-blue-500',
  purple: 'bg-purple-500/10 text-purple-500',
  green: 'bg-green-500/10 text-green-500',
  orange: 'bg-orange-500/10 text-orange-500',
  red: 'bg-red-500/10 text-red-500',
}

export function MetricCard({
  title,
  value,
  format = 'number',
  icon: Icon,
  color = 'blue',
  loading = false,
  trend,
}: MetricCardProps) {
  const formattedValue = () => {
    if (value === undefined || value === null) return '—'
    if (format === 'ctr') return formatCTR(value)
    if (format === 'position') return formatPosition(value)
    return formatNumber(value)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tracking-tight">{formattedValue()}</p>
            )}
            {trend !== undefined && !loading && (
              <p className={cn(
                'text-xs flex items-center gap-1',
                trend >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
              </p>
            )}
          </div>
          <div className={cn('p-2.5 rounded-xl', colorMap[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}