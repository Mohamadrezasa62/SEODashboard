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
import { rbacApi } from '@/lib/api/rbac'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'نام الزامی است'),
  slug: z.string().min(2, 'Slug الزامی است').regex(/^[a-z0-9-]+$/, 'فقط حروف کوچک، اعداد و خط تیره'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateRoleDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: rbacApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('نقش ایجاد شد')
      reset()
      onClose()
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'خطا در ایجاد نقش'),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>نقش جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>نام نقش</Label>
            <Input
              placeholder="مثال: SEO Analyst"
              {...register('name')}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              placeholder="seo-analyst"
              dir="ltr"
              {...register('slug')}
              className={cn(errors.slug && 'border-destructive')}
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>توضیحات (اختیاری)</Label>
            <Input placeholder="توضیح کوتاه" {...register('description')} />
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