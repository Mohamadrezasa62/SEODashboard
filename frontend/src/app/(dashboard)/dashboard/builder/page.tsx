'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Save, Trash2, Settings2, LayoutDashboard,
  Star, Share2, Loader2, GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AddWidgetDialog } from '@/components/dashboard/AddWidgetDialog'
import { DashboardWidget } from '@/components/dashboard/DashboardWidget'
import { CreateDashboardDialog } from '@/components/dashboard/CreateDashboardDialog'
import { dashboardApi, type Dashboard, type Widget } from '@/lib/api/dashboard'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function DashboardBuilderPage() {
  const queryClient = useQueryClient()
  const [selectedDashboardId, setSelectedDashboardId] = useState('')
  const [addWidgetOpen, setAddWidgetOpen] = useState(false)
  const [createDashboardOpen, setCreateDashboardOpen] = useState(false)
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null)

  const { data: dashboardsData, isLoading: dashboardsLoading } = useQuery({
    queryKey: ['dashboards'],
    queryFn: () => dashboardApi.list(),
  })

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', selectedDashboardId],
    queryFn: () => dashboardApi.get(selectedDashboardId),
    enabled: !!selectedDashboardId,
  })

  const setDefaultMutation = useMutation({
    mutationFn: dashboardApi.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
      toast.success('داشبورد پیش‌فرض تغییر یافت')
    },
  })

  const deleteDashboardMutation = useMutation({
    mutationFn: dashboardApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
      setSelectedDashboardId('')
      toast.success('داشبورد حذف شد')
    },
  })

  const deleteWidgetMutation = useMutation({
    mutationFn: dashboardApi.deleteWidget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', selectedDashboardId] })
      toast.success('ویجت حذف شد')
    },
  })

  const dashboards = dashboardsData?.data ?? []
  const dashboard = dashboardData?.data
  const widgets = dashboard?.widgets ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">داشبورد ساز</h1>
          <p className="text-muted-foreground text-sm mt-1">ساخت و مدیریت داشبوردهای سفارشی</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedDashboardId && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDefaultMutation.mutate(selectedDashboardId)}
              >
                <Star className="w-4 h-4 ml-2" />
                پیش‌فرض
              </Button>
              <Button
                size="sm"
                onClick={() => setAddWidgetOpen(true)}
              >
                <Plus className="w-4 h-4 ml-2" />
                ویجت
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setCreateDashboardOpen(true)}>
            <LayoutDashboard className="w-4 h-4 ml-2" />
            داشبورد جدید
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {dashboardsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32" />
          ))
        ) : (
          dashboards.map((d: Dashboard) => (
            <button
              key={d.id}
              onClick={() => setSelectedDashboardId(d.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors',
                selectedDashboardId === d.id
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50'
              )}
            >
              {d.name}
              {d.is_default && <Star className="w-3 h-3 fill-current" />}
              {d.is_shared && <Share2 className="w-3 h-3" />}
            </button>
          ))
        )}
      </div>

      {!selectedDashboardId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <LayoutDashboard className="w-14 h-14 mb-4 opacity-20" />
            <p className="text-base font-medium mb-2">یک داشبورد انتخاب کنید</p>
            <p className="text-sm">یا داشبورد جدیدی بسازید</p>
          </CardContent>
        </Card>
      ) : dashboardLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : widgets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Plus className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-base font-medium mb-2">داشبورد خالی است</p>
            <p className="text-sm mb-4">ویجت اضافه کنید تا داشبورد خود را بسازید</p>
            <Button onClick={() => setAddWidgetOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              اضافه کردن ویجت
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{widgets.length} ویجت</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => {
                if (confirm('آیا از حذف این داشبورد مطمئن هستید؟')) {
                  deleteDashboardMutation.mutate(selectedDashboardId)
                }
              }}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف داشبورد
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {widgets.map((widget: Widget) => (
              <DashboardWidget
                key={widget.id}
                widget={widget}
                onDelete={() => deleteWidgetMutation.mutate(widget.id)}
              />
            ))}
          </div>
        </div>
      )}

      <AddWidgetDialog
        open={addWidgetOpen}
        dashboardId={selectedDashboardId}
        onClose={() => setAddWidgetOpen(false)}
      />

      <CreateDashboardDialog
        open={createDashboardOpen}
        onClose={() => setCreateDashboardOpen(false)}
        onCreated={(id) => setSelectedDashboardId(id)}
      />
    </div>
  )
}