'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowRight, Loader2, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/api/auth'

const schema = z.object({
  email: z.string().email('ایمیل معتبر وارد کنید'),
})

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: { email: string }) => authApi.requestPasswordReset(data.email),
    onSuccess: () => setSent(true),
    onError: () => toast.error('خطا در ارسال ایمیل'),
  })

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <BarChart3 className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-xl font-bold">ایمیل ارسال شد</h2>
            <p className="text-muted-foreground text-sm">
              اگر این ایمیل در سیستم وجود داشته باشد، لینک بازیابی رمز عبور ارسال می‌شود.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowRight className="w-4 h-4 ml-2" />
                بازگشت به ورود
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>بازیابی رمز عبور</CardTitle>
            <CardDescription>ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d as { email: string }))} className="space-y-4">
              <div className="space-y-2">
                <Label>ایمیل</Label>
                <Input type="email" placeholder="example@email.com" dir="ltr" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message as string}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ارسال لینک بازیابی'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm text-primary hover:underline">
                بازگشت به ورود
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}