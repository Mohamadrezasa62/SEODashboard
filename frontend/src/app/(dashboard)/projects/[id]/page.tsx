'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight, Globe, Users, Settings, RefreshCw,
  CheckCircle, XCircle, Loader2, UserPlus, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { projectsApi } from '@/lib/api/projects'
import { seoApi } from '@/lib/api/seo'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TrendChart } from '@/components/charts/TrendChart'
import { AddMemberDialog } from '@/components/projects/AddMemberDialog'
import { QUERY_KEYS, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import { formatDate, getInitials, getDateRange, cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import { MousePointerClick, Eye, TrendingUp, Search } from 'lucide-react'
import type { ProjectMember } from '@/types/project'

const MEMBER_ROLE_LABELS: Record<string, string> = {
  manager: 'مدیر',
  analyst: 'آنالیست',
  viewer: 'مشاهده‌گر',
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, canManage } = useAuth()
  const queryClient = useQueryClient()
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const dateRange = getDateRange(28)

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: QUERY_KEYS.PROJECT(id),
    queryFn: () => projectsApi.get(id),
  })

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: QUERY_KEYS.PROJECT_MEMBERS(id),
    queryFn: () => projectsApi.getMembers(id),
  })

  const { data: summaryData } = useQuery({
    queryKey: [...QUERY_KEYS.SEO_SUMMARY(id), dateRange],
    queryFn: () => seoApi.getSummary(id, dateRange),
    enabled: !!id,
  })

  const { data: trendData } = useQuery({
    queryKey: [...QUERY_KEYS.SEO_TREND(id), dateRange],
    queryFn: () => seoApi.getDailyTrend(id, dateRange),
    enabled: !!id,
  })

  const syncMutation = useMutation({
    mutationFn: () => seoApi.syncGSC(id),
    onSuccess: () => toast.success('همگام‌سازی در صف قرار گرفت'),
    onError: () => toast.error('خطا در همگام‌سازی'),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECT_MEMBERS(id) })
      toast.success('عضو حذف شد')
    },
  })

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      projectsApi.updateMember(id, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECT_MEMBERS(id) })
      toast.success('نقش بروزرسانی شد')
    },
  })

  const project = projectData?.data
  const members = (membersData?.data ?? []) as ProjectMember[]
  const summary = summaryData?.data
  const trend = (trendData?.data ?? []) as any[]

  if (projectLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground" dir="ltr">{project.domain}</span>
            <Badge variant="secondary" className={cn('text-xs', STATUS_COLORS[project.status])}>
              {STATUS_LABELS[project.status]}
            </Badge>
          </div>
        </div>
        <div className="mr-auto flex items-center gap-2">
          {project.project_settings?.gsc_connected ? (
            <Badge variant="secondary" className="text-green-500 gap-1">
              <CheckCircle className="w-3 h-3" />
              GSC متصل
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground gap-1">
              <XCircle className="w-3 h-3" />
              GSC متصل نیست
            </Badge>
          )}
          {project.project_settings?.gsc_connected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="mr-2">همگام‌سازی</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="کل کلیک‌ها" value={summary?.total_clicks} icon={MousePointerClick} color="blue" />
        <MetricCard title="کل نمایش‌ها" value={summary?.total_impressions} icon={Eye} color="purple" />
        <MetricCard title="میانگین CTR" value={summary?.avg_ctr} format="ctr" icon={TrendingUp} color="green" />
        <MetricCard title="میانگین رتبه" value={summary?.avg_position} format="position" icon={Search} color="orange" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="members">اعضا ({members.length})</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">روند ۲۸ روز گذشته</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={trend} height={280} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-4 space-y-3">
          {canManage && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAddMemberOpen(true)}>
                <UserPlus className="w-4 h-4 ml-2" />
                افزودن عضو
              </Button>
            </div>
          )}

          {membersLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : (
            <Card>
              <div className="divide-y divide-border">
                {members.map((member: ProjectMember) => (
                  <div key={member.id} className="flex items-center gap-4 p-4">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(member.user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{member.user.full_name}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{member.user.email}</p>
                    </div>
                    {canManage ? (
                      <Select
                        value={member.role}
                        onValueChange={(role) =>
                          updateMemberRoleMutation.mutate({ userId: member.user.id, role })
                        }
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">مدیر</SelectItem>
                          <SelectItem value="analyst">آنالیست</SelectItem>
                          <SelectItem value="viewer">مشاهده‌گر</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {MEMBER_ROLE_LABELS[member.role]}
                      </Badge>
                    )}
                    {canManage && member.user.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeMemberMutation.mutate(member.user.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">اطلاعات پروژه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">دامنه</p>
                  <p dir="ltr">{project.domain}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">مالک</p>
                  <p>{project.owner?.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">تاریخ ایجاد</p>
                  <p>{formatDate(project.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">آخرین همگام‌سازی</p>
                  <p>{formatDate(project.project_settings?.last_sync_at) || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">وضعیت GSC</p>
                  <p className={project.project_settings?.gsc_connected ? 'text-green-500' : 'text-muted-foreground'}>
                    {project.project_settings?.gsc_connected ? 'متصل' : 'متصل نیست'}
                  </p>
                </div>
                {project.project_settings?.gsc_site_url && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">GSC Site URL</p>
                    <p dir="ltr" className="text-xs truncate">{project.project_settings.gsc_site_url}</p>
                  </div>
                )}
              </div>

              {project.description && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">توضیحات</p>
                  <p className="text-sm">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddMemberDialog
        open={addMemberOpen}
        projectId={id}
        onClose={() => setAddMemberOpen(false)}
      />
    </div>
  )
}