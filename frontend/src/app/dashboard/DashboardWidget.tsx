'use client'

import { useState } from 'react'
import {
  BarChart2, LineChart, PieChart, Table2,
  Hash, Gauge, Trash2, Settings2, GripVertical,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Widget } from '@/lib/api/dashboard'

const WIDGET_ICONS: Record<string, React.ElementType> = {
  line_chart: LineChart,
  bar_chart: BarChart2,
  pie_chart: PieChart,
  metric_card: Hash,
  table: Table2,
  heatmap: BarChart2,
  funnel: BarChart2,
  kpi_gauge: Gauge,
}

const WIDGET_TYPE_LABELS: Record<string, string> = {
  line_chart: 'نمودار خطی',
  bar_chart: 'نمودار میله‌ای',
  pie_chart: 'نمودار دایره‌ای',
  metric_card: 'کارت متریک',
  table: 'جدول',
  heatmap: 'نقشه حرارتی',
  funnel: 'قیف',
  kpi_gauge: 'گیج KPI',
}

interface Props {
  widget: Widget
  onDelete: () => void
}

export function DashboardWidget({ widget, onDelete }: Props) {
  const [showControls, setShowControls] = useState(false)
  const Icon = WIDGET_ICONS[widget.widget_type] || BarChart2

  return (
    <Card
      className="group hover:shadow-md transition-shadow"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{widget.name}</CardTitle>
          </div>
          {showControls && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
        <Badge variant="secondary" className="text-xs w-fit">
          {WIDGET_TYPE_LABELS[widget.widget_type] || widget.widget_type}
        </Badge>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="h-32 flex items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border">
          <div className="text-center text-muted-foreground">
            <Icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">منبع: {widget.data_source}</p>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          موقعیت: ({widget.position_x}, {widget.position_y}) — اندازه: {widget.width}×{widget.height}
        </div>
      </CardContent>
    </Card>
  )
}