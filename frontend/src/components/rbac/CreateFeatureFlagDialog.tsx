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
import { Checkbox } from '@/components/ui/checkbox'
import { rbacApi } from '@/lib/api/rbac'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const schema = z.object({
  name: z.string().min(2, 'نام الزامی است'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const ROLES = [
  { value: 'developer', label: 'توسعه‌دهنده' },
  { value: 'company_manager', label: 'مدیر شرکت' },
  { value: 'employee', label: 'کارمند' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateFeatureFlagDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const [allowedRoles, setAllowedRoles] = useState<string[]>([])
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      rbacApi.createFeatureFlag({ ...data, allowed_roles: allowedRoles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
      toast.success('Feature Flag ایجاد شد')
      reset()
      setAllowedRoles([])
      onClose()
    },
    onError: () => toast.error('خطا در ایجاد Feature Flag'),
  })

  const toggleRole = (role: string) => {
    setAllowedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feature Flag جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>نام</Label>
            <Input
              placeholder="مثال: AI Features"
              {...register('name')}
              className={cn(errors.name && 'border-destructive')}
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input placeholder="ai-features" dir="ltr" {...register('slug')} />
          </div>
          <div className="space-y-2">
            <Label>توضیحات (اختیاری)</Label>
            <Input placeholder="توضیح کوتاه" {...register('description')} />
          </div>
          <div className="space-y-2">
            <Label>نقش‌های مجاز (خالی = همه)</Label>
            <div className="space-y-2">
              {ROLES.map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={value}
                    checked={allowedRoles.includes(value)}
                    onCheckedChange={() => toggleRole(value)}
                  />
                  <label htmlFor={value} className="text-sm cursor-pointer">{label}</label>
                </div>
              ))}
            </div>
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