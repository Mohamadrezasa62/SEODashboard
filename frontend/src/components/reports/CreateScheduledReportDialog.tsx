'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Loader2, Plus, X } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { reportsApi } from '@/lib/api/reports'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2),
  format: z.enum(['pdf', 'excel', 'csv']),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  projectId: string
  onClose: () => void
}

export function CreateScheduledReportDialog({ open, projectId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [recipients, setRecipients] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState('')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { format: 'excel', frequency: 'weekly' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      reportsApi.createScheduled(projectId, { ...data, recipients }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports', projectId] })
      toast.success('گزارش زمان‌بندی‌شده ایجاد شد')
      reset()
      setRecipients([])
      onClose()
    },
    onError: () => toast.error('خطا در ایجاد گزارش زمان‌بندی‌شده'),
  })

  const addEmail = () => {
    const email = emailInput.trim()
    if (!email || !email.includes('@')) return
    if (!recipients.includes(email)) {
      setRecipients([...recipients, email])
    }
    setEmailInput('')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>گزارش زمان‌بندی‌شده</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>نام</Label>
            <Input placeholder="مثال: گزارش هفتگی" {...register('name')} className={cn(errors.name && 'border-destructive')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>فرمت</Label>
              <Select defaultValue="excel" onValueChange={(v) => setValue('format', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تناوب</Label>
              <Select defaultValue="weekly" onValueChange={(v) => setValue('frequency', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">روزانه</SelectItem>
                  <SelectItem value="weekly">هفتگی</SelectItem>
                  <SelectItem value="monthly">ماهانه</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>گیرندگان ایمیل</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@example.com"
                dir="ltr"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addEmail}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipients.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1 text-xs">
                    {email}
                    <button
                      type="button"
                      onClick={() => setRecipients(recipients.filter((e) => e !== email))}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>انصراف</Button>
            <Button type="submit" disabled={mutation.isPending || recipients.length === 0}>
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ایجاد'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}