'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, User, Bell, Lock, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { usersApi } from '@/lib/api/users'
import { notificationsApi } from '@/lib/api/notifications'
import { useAuth } from '@/lib/hooks/useAuth'
import { QUERY_KEYS } from '@/lib/constants'
import { getInitials, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useTheme } from 'next-themes'

const profileSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  phone: z.string().optional(),
  bio: z.string().optional(),
})

const passwordSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(8),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'رمز عبور و تکرار آن یکسان نیستند',
  path: ['confirm_password'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } =
    useForm<ProfileForm>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
      },
    })

  const { register: regPass, handleSubmit: handlePass, reset: resetPass, formState: { errors: passErrors } } =
    useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const { data: notifSettingsData } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: notificationsApi.getSettings,
  })

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => {
      const form = new FormData()
      Object.entries(data).forEach(([k, v]) => v && form.append(k, v))
      return usersApi.updateProfile(form)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME })
      toast.success('پروفایل بروزرسانی شد')
    },
    onError: () => toast.error('خطا در بروزرسانی'),
  })

  const passwordMutation = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => {
      resetPass()
      toast.success('رمز عبور تغییر یافت')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در تغییر رمز عبور')
    },
  })

  const notifMutation = useMutation({
    mutationFn: (data: Record<string, boolean>) => notificationsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
      toast.success('تنظیمات ذخیره شد')
    },
  })

  const notifSettings = notifSettingsData?.data || {}

  const handleNotifToggle = (key: string, value: boolean) => {
    notifMutation.mutate({ [key]: value })
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">تنظیمات</h1>
        <p className="text-muted-foreground text-sm mt-1">مدیریت حساب و تنظیمات</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="text-xs">
            <User className="w-3.5 h-3.5 ml-1" />
            پروفایل
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs">
            <Lock className="w-3.5 h-3.5 ml-1" />
            امنیت
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            <Bell className="w-3.5 h-3.5 ml-1" />
            اعلان‌ها
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs">
            <Palette className="w-3.5 h-3.5 ml-1" />
            ظاهر
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">اطلاعات پروفایل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {user ? getInitials(user.full_name) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{user?.full_name}</p>
                  <p className="text-sm text-muted-foreground" dir="ltr">{user?.email}</p>
                </div>
              </div>
              <form
                onSubmit={handleProfile((d) => profileMutation.mutate(d))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>نام</Label>
                    <Input
                      {...regProfile('first_name')}
                      className={cn(profileErrors.first_name && 'border-destructive')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نام خانوادگی</Label>
                    <Input
                      {...regProfile('last_name')}
                      className={cn(profileErrors.last_name && 'border-destructive')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>شماره تلفن</Label>
                  <Input
                    placeholder="09xxxxxxxxx"
                    dir="ltr"
                    {...regProfile('phone')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>بیوگرافی</Label>
                  <Input placeholder="معرفی کوتاه" {...regProfile('bio')} />
                </div>
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : null}
                  ذخیره
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تغییر رمز عبور</CardTitle>
              <CardDescription className="text-xs">برای تغییر رمز عبور، رمز فعلی را وارد کنید</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handlePass((d) => passwordMutation.mutate(d))}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>رمز عبور فعلی</Label>
                  <Input
                    type="password"
                    dir="ltr"
                    {...regPass('old_password')}
                    className={cn(passErrors.old_password && 'border-destructive')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>رمز عبور جدید</Label>
                  <Input
                    type="password"
                    dir="ltr"
                    placeholder="حداقل ۸ کاراکتر"
                    {...regPass('new_password')}
                    className={cn(passErrors.new_password && 'border-destructive')}
                  />
                  {passErrors.new_password && (
                    <p className="text-xs text-destructive">{passErrors.new_password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>تکرار رمز عبور جدید</Label>
                  <Input
                    type="password"
                    dir="ltr"
                    {...regPass('confirm_password')}
                    className={cn(passErrors.confirm_password && 'border-destructive')}
                  />
                  {passErrors.confirm_password && (
                    <p className="text-xs text-destructive">{passErrors.confirm_password.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                  تغییر رمز عبور
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تنظیمات اعلان</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'mention_in_app', label: 'منشن‌ها (درون‌برنامه)' },
                { key: 'mention_email', label: 'منشن‌ها (ایمیل)' },
                { key: 'comment_in_app', label: 'کامنت‌ها (درون‌برنامه)' },
                { key: 'comment_email', label: 'کامنت‌ها (ایمیل)' },
                { key: 'kpi_alert_in_app', label: 'هشدار KPI (درون‌برنامه)' },
                { key: 'kpi_alert_email', label: 'هشدار KPI (ایمیل)' },
                { key: 'report_in_app', label: 'گزارش آماده (درون‌برنامه)' },
                { key: 'report_email', label: 'گزارش آماده (ایمیل)' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="cursor-pointer">{label}</Label>
                  <Switch
                    checked={!!notifSettings[key]}
                    onCheckedChange={(v) => handleNotifToggle(key, v)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ظاهر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-3 block">پوسته</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'روشن' },
                    { value: 'dark', label: 'تیره' },
                    { value: 'system', label: 'سیستم' },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={cn(
                        'p-3 rounded-lg border text-sm font-medium transition-colors',
                        theme === t.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}