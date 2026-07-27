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
import { kpiApi } from '@/lib/api/kpi'
import { QUERY_KEYS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'نام الزامی است'),
  kpi_type: z.string().min(1, 'نوع الزامی است'),
  period: z.string().min(1, 'دوره الزامی است'),
  target_value: z.coerce.number().positive('مقدار هدف باید مثبت باشد'),
  alert_threshold_pct: z.coerce.number().min(0).max(100).default(20),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  projectId: string
  onClose: () => void
}

export function CreateKPIDialog({ open, projectId, onClose }: Props) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { alert_threshold_pct: 20 },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => kpiApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.KPIS(projectId) })
      toast.success('KPI ایجاد شد')
      reset()
      onClose()
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'خطا در ایجاد KPI'),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>KPI جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>نام KPI</Label>
            <Input
              placeholder="مثال: کلیک ماهانه"
              {...register('name')}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>نوع</Label>
              <Select onValueChange={(v) => setValue('kpi_type', v)}>
                <SelectTrigger className={cn(errors.kpi_type && 'border-destructive')}>
                  <SelectValue placeholder="انتخاب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clicks">کلیک</SelectItem>
                  <SelectItem value="impressions">نمایش</SelectItem>
                  <SelectItem value="ctr">CTR</SelectItem>
                  <SelectItem value="position">رتبه</SelectItem>
                  <SelectItem value="keywords">کلیدواژه</SelectItem>
                  <SelectItem value="pages">صفحه</SelectItem>
                  <SelectItem value="custom">سفارشی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>دوره</Label>
              <Select onValueChange={(v) => setValue('period', v)}>
                <SelectTrigger className={cn(errors.period && 'border-destructive')}>
                  <SelectValue placeholder="انتخاب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">روزانه</SelectItem>
                  <SelectItem value="weekly">هفتگی</SelectItem>
                  <SelectItem value="monthly">ماهانه</SelectItem>
                  <SelectItem value="quarterly">فصلی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>مقدار هدف</Label>
              <Input
                type="number"
                placeholder="مثال: 10000"
                dir="ltr"
                {...register('target_value')}
                className={cn(errors.target_value && 'border-destructive')}
              />
              {errors.target_value && (
                <p className="text-xs text-destructive">{errors.target_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>آستانه هشدار (%)</Label>
              <Input
                type="number"
                placeholder="20"
                dir="ltr"
                {...register('alert_threshold_pct')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ایجاد KPI'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}