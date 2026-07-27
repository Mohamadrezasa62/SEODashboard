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
import { usersApi } from '@/lib/api/users'
import { cn } from '@/lib/utils'

const schema = z.object({
  first_name: z.string().min(2, 'نام الزامی است'),
  last_name: z.string().min(2, 'نام خانوادگی الزامی است'),
  email: z.string().email('ایمیل معتبر وارد کنید'),
  role: z.enum(['developer', 'company_manager', 'employee']),
  password: z.string().min(8, 'رمز عبور حداقل ۸ کاراکتر'),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateUserDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'employee' },
  })

  const mutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('کاربر ایجاد شد')
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در ایجاد کاربر')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ایجاد کاربر جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>نام</Label>
              <Input
                placeholder="علی"
                {...register('first_name')}
                className={cn(errors.first_name && 'border-destructive')}
              />
              {errors.first_name && (
                <p className="text-xs text-destructive">{errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>نام خانوادگی</Label>
              <Input
                placeholder="محمدی"
                {...register('last_name')}
                className={cn(errors.last_name && 'border-destructive')}
              />
              {errors.last_name && (
                <p className="text-xs text-destructive">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>ایمیل</Label>
            <Input
              type="email"
              placeholder="example@email.com"
              dir="ltr"
              {...register('email')}
              className={cn(errors.email && 'border-destructive')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>نقش</Label>
            <Select
              defaultValue="employee"
              onValueChange={(v) => setValue('role', v as any)}
            >
              <SelectTrigger className={cn(errors.role && 'border-destructive')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="developer">توسعه‌دهنده</SelectItem>
                <SelectItem value="company_manager">مدیر شرکت</SelectItem>
                <SelectItem value="employee">کارمند</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>رمز عبور</Label>
            <Input
              type="password"
              placeholder="حداقل ۸ کاراکتر"
              dir="ltr"
              {...register('password')}
              className={cn(errors.password && 'border-destructive')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'ایجاد کاربر'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}