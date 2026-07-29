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
import { Switch } from '@/components/ui/switch'
import { dashboardApi } from '@/lib/api/dashboard'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'نام الزامی است'),
  is_default: z.boolean().default(false),
  is_shared: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}

export function CreateDashboardDialog({ open, onClose, onCreated }: Props) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_default: false, is_shared: false },
  })

  const mutation = useMutation({
    mutationFn: dashboardApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
      toast.success('داشبورد ایجاد شد')
      reset()
      onCreated(res.data.id)
      onClose()
    },
    onError: () => toast.error('خطا در ایجاد داشبورد'),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>داشبورد جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>نام داشبورد</Label>
            <Input
              placeholder="مثال: داشبورد SEO اصلی"
              {...register('name')}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <Label>داشبورد پیش‌فرض</Label>
            <Switch
              checked={watch('is_default')}
              onCheckedChange={(v) => setValue('is_default', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>اشتراک‌گذاری با تیم</Label>
            <Switch
              checked={watch('is_shared')}
              onCheckedChange={(v) => setValue('is_shared', v)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>انصراف</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ایجاد'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}