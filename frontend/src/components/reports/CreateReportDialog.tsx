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
import { reportsApi } from '@/lib/api/reports'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'نام الزامی است'),
  format: z.enum(['pdf', 'excel', 'csv']),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  projectId: string
  onClose: () => void
}

export function CreateReportDialog({ open, projectId, onClose }: Props) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { format: 'excel' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => reportsApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', projectId] })
      toast.success('گزارش در صف ساخت قرار گرفت')
      reset()
      onClose()
    },
    onError: () => toast.error('خطا در ایجاد گزارش'),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>گزارش جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>نام گزارش</Label>
            <Input
              placeholder="مثال: گزارش ماهانه کلیدواژه‌ها"
              {...register('name')}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>فرمت</Label>
            <Select defaultValue="excel" onValueChange={(v) => setValue('format', v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>از تاریخ</Label>
              <Input type="date" dir="ltr" {...register('date_from')} />
            </div>
            <div className="space-y-2">
              <Label>تا تاریخ</Label>
              <Input type="date" dir="ltr" {...register('date_to')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>انصراف</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ساخت گزارش'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}