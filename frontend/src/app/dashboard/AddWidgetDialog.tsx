'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { dashboardApi } from '@/lib/api/dashboard'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'نام الزامی است'),
  widget_type: z.string().min(1, 'نوع الزامی است'),
  data_source: z.string().min(1, 'منبع داده الزامی است'),
  width: z.coerce.number().min(1).max(12).default(6),
  height: z.coerce.number().min(1).max(20).default(4),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  dashboardId: string
  onClose: () => void
}

export function AddWidgetDialog({ open, dashboardId, onClose }: Props) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { width: 6, height: 4 },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => dashboardApi.addWidget(dashboardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardId] })
      toast.success('ویجت اضافه شد')
      reset()
      onClose()
    },
    onError: () => toast.error('خطا در اضافه کردن ویجت'),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>افزودن ویجت</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>نام ویجت</Label>
            <Input
              placeholder="مثال: نمودار کلیک‌ها"
              {...register('name')}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>نوع ویجت</Label>
            <Select onValueChange={(v) => setValue('widget_type', v)}>
              <SelectTrigger className={cn(errors.widget_type && 'border-destructive')}>
                <SelectValue placeholder="انتخاب نوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line_chart">نمودار خطی</SelectItem>
                <SelectItem value="bar_chart">نمودار میله‌ای</SelectItem>
                <SelectItem value="pie_chart">نمودار دایره‌ای</SelectItem>
                <SelectItem value="metric_card">کارت متریک</SelectItem>
                <SelectItem value="table">جدول</SelectItem>
                <SelectItem value="kpi_gauge">گیج KPI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>منبع داده</Label>
            <Select onValueChange={(v) => setValue('data_source', v)}>
              <SelectTrigger className={cn(errors.data_source && 'border-destructive')}>
                <SelectValue placeholder="انتخاب منبع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seo_clicks">کلیک‌های SEO</SelectItem>
                <SelectItem value="seo_impressions">نمایش‌های SEO</SelectItem>
                <SelectItem value="seo_ctr">CTR</SelectItem>
                <SelectItem value="seo_position">رتبه</SelectItem>
                <SelectItem value="seo_keywords">کلیدواژه‌ها</SelectItem>
                <SelectItem value="seo_pages">صفحات</SelectItem>
                <SelectItem value="kpi_summary">خلاصه KPI</SelectItem>
                <SelectItem value="feedback_summary">خلاصه فیدبک</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>عرض (۱-۱۲)</Label>
              <Input type="number" min={1} max={12} dir="ltr" {...register('width')} />
            </div>
            <div className="space-y-2">
              <Label>ارتفاع (۱-۲۰)</Label>
              <Input type="number" min={1} max={20} dir="ltr" {...register('height')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>انصراف</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'افزودن'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}