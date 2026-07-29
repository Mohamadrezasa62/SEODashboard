'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
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
import { aiApi } from '@/lib/api/ai'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'نام الزامی است'),
  provider: z.enum(['openai', 'anthropic', 'gemini']),
  model: z.string().min(1, 'مدل الزامی است'),
  api_key: z.string().min(10, 'API Key الزامی است'),
})

type FormData = z.infer<typeof schema>

const MODEL_OPTIONS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
}

interface Props {
  open: boolean
  onClose: () => void
}

export function AddProviderDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const [showKey, setShowKey] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: aiApi.createProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] })
      toast.success('پرووایدر اضافه شد')
      reset()
      setSelectedProvider('')
      onClose()
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'خطا در افزودن پرووایدر'),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>افزودن پرووایدر AI</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>نام</Label>
            <Input
              placeholder="مثال: OpenAI Production"
              {...register('name')}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>پرووایدر</Label>
              <Select
                onValueChange={(v) => {
                  setValue('provider', v as any)
                  setSelectedProvider(v)
                  setValue('model', MODEL_OPTIONS[v]?.[0] || '')
                }}
              >
                <SelectTrigger className={cn(errors.provider && 'border-destructive')}>
                  <SelectValue placeholder="انتخاب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>مدل</Label>
              <Select
                onValueChange={(v) => setValue('model', v)}
                disabled={!selectedProvider}
              >
                <SelectTrigger className={cn(errors.model && 'border-destructive')}>
                  <SelectValue placeholder="انتخاب مدل" />
                </SelectTrigger>
                <SelectContent>
                  {(MODEL_OPTIONS[selectedProvider] || []).map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder="sk-..."
                dir="ltr"
                {...register('api_key')}
                className={cn(errors.api_key && 'border-destructive', 'pl-10')}
              />
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.api_key && <p className="text-xs text-destructive">{errors.api_key.message}</p>}
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