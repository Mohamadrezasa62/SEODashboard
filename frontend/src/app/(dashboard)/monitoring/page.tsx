// 'use client'

// import { useState } from 'react'
// import { useQuery } from '@tanstack/react-query'
// import {
//   Activity, CheckCircle, XCircle, AlertTriangle,
//   Users, FolderOpen, Database, MessageSquare,
//   Search, Filter,
// } from 'lucide-react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { Input } from '@/components/ui/input'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { Skeleton } from '@/components/ui/skeleton'
// import {
//   Select, SelectContent, SelectItem,
//   SelectTrigger, SelectValue,
// } from '@/components/ui/select'
// import { monitoringApi, type AuditLog, type SystemStats, type HealthCheck } from '@/lib/api/monitoring'
// import { formatDateTime, formatNumber, cn } from '@/lib/utils'
// import { ROLE_LABELS } from '@/lib/constants'

// const ACTION_COLORS: Record<string, string> = {
//   create: 'text-green-500 bg-green-500/10',
//   update: 'text-blue-500 bg-blue-500/10',
//   delete: 'text-red-500 bg-red-500/10',
//   login: 'text-purple-500 bg-purple-500/10',
//   logout: 'text-gray-500 bg-gray-500/10',
//   export: 'text-orange-500 bg-orange-500/10',
//   permission_change: 'text-yellow-500 bg-yellow-500/10',
// }

// const ACTION_LABELS: Record<string, string> = {
//   create: 'ایجاد',
//   update: 'بروزرسانی',
//   delete: 'حذف',
//   login: 'ورود',
//   logout: 'خروج',
//   export: 'خروجی',
//   permission_change: 'تغییر دسترسی',
// }

// export default function MonitoringPage() {
//   const [actionFilter, setActionFilter] = useState('all')
//   const [search, setSearch] = useState('')

//   const { data: healthData, isLoading: healthLoading } = useQuery({
//     queryKey: ['health'],
//     queryFn: monitoringApi.health,
//     refetchInterval: 30000,
//   })

//   const { data: statsData, isLoading: statsLoading } = useQuery({
//     queryKey: ['system-stats'],
//     queryFn: monitoringApi.systemStats,
//     refetchInterval: 60000,
//   })

//   const { data: logsData, isLoading: logsLoading } = useQuery({
//     queryKey: ['audit-logs', actionFilter],
//     queryFn: () =>
//       monitoringApi.auditLogs({
//         action: actionFilter === 'all' ? undefined : actionFilter,
//       }),
//   })

//   const health = healthData?.data as HealthCheck | undefined
//   const stats = statsData?.data as SystemStats | undefined
//   const allLogs = (logsData?.data ?? []) as AuditLog[]
//   const logs = search
//     ? allLogs.filter(
//         (l) =>
//           l.model_name.toLowerCase().includes(search.toLowerCase()) ||
//           l.user?.email.toLowerCase().includes(search.toLowerCase()) ||
//           l.object_repr?.toLowerCase().includes(search.toLowerCase())
//       )
//     : allLogs

//   return (
//     <div className="space-y-6 animate-fade-in">
//       <div>
//         <h1 className="text-2xl font-bold">مانیتورینگ</h1>
//         <p className="text-muted-foreground text-sm mt-1">وضعیت سیستم و لاگ‌های سرویس</p>
//       </div>

//       <Tabs defaultValue="health">
//         <TabsList>
//           <TabsTrigger value="health">
//             <Activity className="w-4 h-4 ml-2" />
//             Health Check
//           </TabsTrigger>
//           <TabsTrigger value="stats">
//             <Database className="w-4 h-4 ml-2" />
//             آمار سیستم
//           </TabsTrigger>
//           <TabsTrigger value="audit">
//             <Filter className="w-4 h-4 ml-2" />
//             Audit Logs
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="health" className="mt-4 space-y-4">
//           {healthLoading ? (
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               {Array.from({ length: 3 }).map((_, i) => (
//                 <Skeleton key={i} className="h-28 w-full" />
//               ))}
//             </div>
//           ) : (
//             <>
//               <Card className={cn(
//                 'border-2',
//                 health?.status === 'ok' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
//               )}>
//                 <CardContent className="p-5">
//                   <div className="flex items-center gap-3">
//                     {health?.status === 'ok' ? (
//                       <CheckCircle className="w-8 h-8 text-green-500" />
//                     ) : (
//                       <AlertTriangle className="w-8 h-8 text-red-500" />
//                     )}
//                     <div>
//                       <p className="font-bold text-lg">
//                         {health?.status === 'ok' ? 'سیستم سالم' : 'مشکل در سیستم'}
//                       </p>
//                       <p className="text-sm text-muted-foreground">
//                         آخرین بررسی: همین الان
//                       </p>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {Object.entries(health?.services ?? {}).map(([service, status]) => (
//                   <Card key={service}>
//                     <CardContent className="p-4 flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <div className={cn(
//                           'w-10 h-10 rounded-lg flex items-center justify-center',
//                           status === 'ok' ? 'bg-green-500/10' : 'bg-red-500/10'
//                         )}>
//                           <Database className={cn(
//                             'w-5 h-5',
//                             status === 'ok' ? 'text-green-500' : 'text-red-500'
//                           )} />
//                         </div>
//                         <div>
//                           <p className="font-medium text-sm capitalize">{service}</p>
//                           <p className="text-xs text-muted-foreground">{status}</p>
//                         </div>
//                       </div>
//                       {status === 'ok' ? (
//                         <CheckCircle className="w-5 h-5 text-green-500" />
//                       ) : (
//                         <XCircle className="w-5 h-5 text-red-500" />
//                       )}
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             </>
//           )}
//         </TabsContent>

//         <TabsContent value="stats" className="mt-4 space-y-4">
//           {statsLoading ? (
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               {Array.from({ length: 4 }).map((_, i) => (
//                 <Skeleton key={i} className="h-28 w-full" />
//               ))}
//             </div>
//           ) : (
//             <>
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 <Card>
//                   <CardContent className="p-5">
//                     <div className="flex items-center gap-3">
//                       <div className="p-2 rounded-lg bg-blue-500/10">
//                         <Users className="w-5 h-5 text-blue-500" />
//                       </div>
//                       <div>
//                         <p className="text-xs text-muted-foreground">کاربران</p>
//                         <p className="text-2xl font-bold">{formatNumber(stats?.total_users)}</p>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//                 <Card>
//                   <CardContent className="p-5">
//                     <div className="flex items-center gap-3">
//                       <div className="p-2 rounded-lg bg-purple-500/10">
//                         <FolderOpen className="w-5 h-5 text-purple-500" />
//                       </div>
//                       <div>
//                         <p className="text-xs text-muted-foreground">پروژه‌ها</p>
//                         <p className="text-2xl font-bold">{formatNumber(stats?.total_projects)}</p>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//                 <Card>
//                   <CardContent className="p-5">
//                     <div className="flex items-center gap-3">
//                       <div className="p-2 rounded-lg bg-green-500/10">
//                         <Database className="w-5 h-5 text-green-500" />
//                       </div>
//                       <div>
//                         <p className="text-xs text-muted-foreground">داده‌های SEO</p>
//                         <p className="text-2xl font-bold">{formatNumber(stats?.total_data_points)}</p>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//                 <Card>
//                   <CardContent className="p-5">
//                     <div className="flex items-center gap-3">
//                       <div className="p-2 rounded-lg bg-orange-500/10">
//                         <MessageSquare className="w-5 h-5 text-orange-500" />
//                       </div>
//                       <div>
//                         <p className="text-xs text-muted-foreground">فیدبک باز</p>
//                         <p className="text-2xl font-bold">{formatNumber(stats?.open_feedback_threads)}</p>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>

//               {stats?.users_by_role && (
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="text-base">توزیع کاربران بر اساس نقش</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-3">
//                       {stats.users_by_role.map((item) => {
//                         const pct = stats.total_users > 0
//                           ? Math.round((item.count / stats.total_users) * 100)
//                           : 0
//                         return (
//                           <div key={item.role} className="space-y-1">
//                             <div className="flex items-center justify-between text-sm">
//                               <span>{ROLE_LABELS[item.role] || item.role}</span>
//                               <span className="text-muted-foreground">{item.count} ({pct}%)</span>
//                             </div>
//                             <div className="h-2 bg-muted rounded-full overflow-hidden">
//                               <div
//                                 className="h-full bg-primary rounded-full"
//                                 style={{ width: `${pct}%` }}
//                               />
//                             </div>
//                           </div>
//                         )
//                       })}
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}
//             </>
//           )}
//         </TabsContent>

//         <TabsContent value="audit" className="mt-4 space-y-4">
//           <div className="flex gap-3 flex-wrap">
//             <div className="relative flex-1 min-w-48">
//               <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//               <Input
//                 placeholder="جستجو در لاگ‌ها..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="pr-9"
//               />
//             </div>
//             <Select value={actionFilter} onValueChange={setActionFilter}>
//               <SelectTrigger className="w-44">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">همه اقدامات</SelectItem>
//                 <SelectItem value="create">ایجاد</SelectItem>
//                 <SelectItem value="update">بروزرسانی</SelectItem>
//                 <SelectItem value="delete">حذف</SelectItem>
//                 <SelectItem value="login">ورود</SelectItem>
//                 <SelectItem value="logout">خروج</SelectItem>
//                 <SelectItem value="permission_change">تغییر دسترسی</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {logsLoading ? (
//             <div className="space-y-2">
//               {Array.from({ length: 8 }).map((_, i) => (
//                 <Skeleton key={i} className="h-16 w-full" />
//               ))}
//             </div>
//           ) : logs.length === 0 ? (
//             <Card>
//               <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
//                 لاگی یافت نشد
//               </CardContent>
//             </Card>
//           ) : (
//             <Card>
//               <div className="overflow-x-auto">
//                 <table className="w-full text-sm">
//                   <thead className="border-b border-border">
//                     <tr>
//                       <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">کاربر</th>
//                       <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">اقدام</th>
//                       <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">مدل</th>
//                       <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">شی</th>
//                       <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">IP</th>
//                       <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">زمان</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-border">
//                     {logs.map((log: AuditLog) => (
//                       <tr key={log.id} className="hover:bg-muted/30 transition-colors">
//                         <td className="px-4 py-3">
//                           <span className="text-xs">
//                             {log.user?.email || '—'}
//                           </span>
//                         </td>
//                         <td className="px-4 py-3">
//                           <Badge
//                             variant="secondary"
//                             className={cn('text-xs', ACTION_COLORS[log.action] || 'bg-muted')}
//                           >
//                             {ACTION_LABELS[log.action] || log.action}
//                           </Badge>
//                         </td>
//                         <td className="px-4 py-3">
//                           <span className="text-xs text-muted-foreground">{log.model_name}</span>
//                         </td>
//                         <td className="px-4 py-3">
//                           <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
//                             {log.object_repr || log.object_id || '—'}
//                           </span>
//                         </td>
//                         <td className="px-4 py-3">
//                           <span className="text-xs text-muted-foreground" dir="ltr">
//                             {log.ip_address || '—'}
//                           </span>
//                         </td>
//                         <td className="px-4 py-3">
//                           <span className="text-xs text-muted-foreground">
//                             {formatDateTime(log.created_at)}
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </Card>
//           )}
//         </TabsContent>
//       </Tabs>
//     </div>
//   )
// }
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Activity, CheckCircle, XCircle, AlertTriangle,
  Users, FolderOpen, Database, MessageSquare,
  Search, Clock, Play, RotateCcw, Calendar,
  TrendingUp, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { monitoringApi, type AuditLog, type SystemStats, type HealthCheck } from '@/lib/api/monitoring'
import { schedulerApi, type TaskLog, type TaskStats, type PeriodicTask } from '@/lib/api/scheduler'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatDateTime, formatNumber, cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'

const ACTION_COLORS: Record<string, string> = {
  create: 'text-green-500 bg-green-500/10',
  update: 'text-blue-500 bg-blue-500/10',
  delete: 'text-red-500 bg-red-500/10',
  login: 'text-purple-500 bg-purple-500/10',
  logout: 'text-gray-500 bg-gray-500/10',
  export: 'text-orange-500 bg-orange-500/10',
  permission_change: 'text-yellow-500 bg-yellow-500/10',
}

const ACTION_LABELS: Record<string, string> = {
  create: 'ایجاد',
  update: 'بروزرسانی',
  delete: 'حذف',
  login: 'ورود',
  logout: 'خروج',
  export: 'خروجی',
  permission_change: 'تغییر دسترسی',
}

const TASK_STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  pending: { color: 'text-yellow-500 bg-yellow-500/10', label: 'در انتظار', icon: Clock },
  running: { color: 'text-blue-500 bg-blue-500/10', label: 'در حال اجرا', icon: Loader2 },
  success: { color: 'text-green-500 bg-green-500/10', label: 'موفق', icon: CheckCircle },
  failed: { color: 'text-red-500 bg-red-500/10', label: 'خطا', icon: XCircle },
  retrying: { color: 'text-orange-500 bg-orange-500/10', label: 'تلاش مجدد', icon: RotateCcw },
  revoked: { color: 'text-gray-500 bg-gray-500/10', label: 'لغو شده', icon: XCircle },
}

export default function MonitoringPage() {
  const queryClient = useQueryClient()
  const [actionFilter, setActionFilter] = useState('all')
  const [auditSearch, setAuditSearch] = useState('')
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')
  const [taskSearch, setTaskSearch] = useState('')

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: monitoringApi.health,
    refetchInterval: 30000,
  })

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['system-stats'],
    queryFn: monitoringApi.systemStats,
    refetchInterval: 60000,
  })

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter],
    queryFn: () => monitoringApi.auditLogs({
      action: actionFilter === 'all' ? undefined : actionFilter,
    }),
  })

  const { data: taskLogsData, isLoading: taskLogsLoading } = useQuery({
    queryKey: ['task-logs', taskStatusFilter, taskSearch],
    queryFn: () => schedulerApi.listTaskLogs({
      status: taskStatusFilter === 'all' ? undefined : taskStatusFilter,
      task_name: taskSearch || undefined,
      limit: 100,
    }),
    refetchInterval: 10000,
  })

  const { data: taskStatsData } = useQuery({
    queryKey: ['task-stats'],
    queryFn: schedulerApi.getTaskStats,
    refetchInterval: 30000,
  })

  const { data: periodicTasksData, isLoading: periodicLoading } = useQuery({
    queryKey: ['periodic-tasks'],
    queryFn: schedulerApi.listPeriodicTasks,
  })

  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      schedulerApi.togglePeriodicTask(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodic-tasks'] })
      toast.success('وضعیت task تغییر یافت')
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  })

  const health = healthData?.data as HealthCheck | undefined
  const stats = statsData?.data as SystemStats | undefined
  const allLogs = (logsData?.data ?? []) as AuditLog[]
  const taskLogs = (taskLogsData?.data ?? []) as TaskLog[]
  const taskStats = taskStatsData?.data as TaskStats | undefined
  const periodicTasks = (periodicTasksData?.data ?? []) as PeriodicTask[]

  const filteredLogs = auditSearch
    ? allLogs.filter(
        (l) =>
          l.model_name.toLowerCase().includes(auditSearch.toLowerCase()) ||
          l.user?.email.toLowerCase().includes(auditSearch.toLowerCase()) ||
          l.object_repr?.toLowerCase().includes(auditSearch.toLowerCase())
      )
    : allLogs

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="مانیتورینگ"
        description="وضعیت سیستم، تسک‌ها، و لاگ‌ها"
      />

      <Tabs defaultValue="health">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="health">
            <Activity className="w-4 h-4 ml-2" />
            Health
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Play className="w-4 h-4 ml-2" />
            تسک‌ها
          </TabsTrigger>
          <TabsTrigger value="scheduler">
            <Calendar className="w-4 h-4 ml-2" />
            Scheduler
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="w-4 h-4 ml-2" />
            آمار سیستم
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Search className="w-4 h-4 ml-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* ===== HEALTH TAB ===== */}
        <TabsContent value="health" className="mt-4 space-y-4">
          {healthLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <>
              <Card className={cn(
                'border-2',
                health?.status === 'ok'
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-red-500/30 bg-red-500/5'
              )}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    {health?.status === 'ok' ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    )}
                    <div>
                      <p className="font-bold text-lg">
                        {health?.status === 'ok' ? 'سیستم سالم' : 'مشکل در سیستم'}
                      </p>
                      <p className="text-sm text-muted-foreground">آخرین بررسی: همین الان</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(health?.services ?? {}).map(([service, status]) => (
                  <Card key={service}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          status === 'ok' ? 'bg-green-500/10' : 'bg-red-500/10'
                        )}>
                          <Database className={cn(
                            'w-5 h-5',
                            status === 'ok' ? 'text-green-500' : 'text-red-500'
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-sm capitalize">{service}</p>
                          <p className="text-xs text-muted-foreground">{status}</p>
                        </div>
                      </div>
                      {status === 'ok' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ===== TASKS TAB ===== */}
        <TabsContent value="tasks" className="mt-4 space-y-4">
          {taskStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">کل تسک‌ها</p>
                  <p className="text-2xl font-bold">{formatNumber(taskStats.overall.total)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">موفق</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatNumber(taskStats.overall.success)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">خطا</p>
                  <p className="text-2xl font-bold text-red-500">
                    {formatNumber(taskStats.overall.failed)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">در حال اجرا</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {formatNumber(taskStats.overall.running)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجوی نام تسک..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="running">در حال اجرا</SelectItem>
                <SelectItem value="success">موفق</SelectItem>
                <SelectItem value="failed">خطا</SelectItem>
                <SelectItem value="retrying">تلاش مجدد</SelectItem>
                <SelectItem value="revoked">لغو شده</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {taskLogsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : taskLogs.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                تسکی یافت نشد
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">نام تسک</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">وضعیت</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">مدت</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">تلاش</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">زمان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {taskLogs.map((log: TaskLog) => {
                      const config = TASK_STATUS_CONFIG[log.status] || TASK_STATUS_CONFIG.pending
                      const StatusIcon = config.icon
                      return (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium">{log.task_short_name}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">
                              {log.task_id.slice(0, 16)}...
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className={cn('text-xs gap-1', config.color)}>
                              <StatusIcon className={cn(
                                'w-3 h-3',
                                log.status === 'running' && 'animate-spin'
                              )} />
                              {config.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-muted-foreground">
                              {log.duration_formatted || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-muted-foreground">{log.retries}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(log.created_at)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {taskStats?.by_task && taskStats.by_task.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">تسک‌های پرتکرار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {taskStats.by_task.map((item) => {
                  const successRate = item.count > 0
                    ? Math.round((item.success_count / item.count) * 100)
                    : 0
                  const taskShort = item.task_name.split('.').pop() || item.task_name
                  return (
                    <div key={item.task_name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-xs font-medium">{taskShort}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="text-green-500">{item.success_count} موفق</span>
                          <span className="text-red-500">{item.fail_count} خطا</span>
                          <span>{item.count} کل</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== SCHEDULER TAB ===== */}
        <TabsContent value="scheduler" className="mt-4 space-y-3">
          {periodicLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))
          ) : periodicTasks.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                هیچ periodic task‌ای تنظیم نشده
              </CardContent>
            </Card>
          ) : (
            periodicTasks.map((task: PeriodicTask) => (
              <Card key={task.id} className={cn(!task.enabled && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'p-2.5 rounded-lg',
                      task.enabled ? 'bg-green-500/10' : 'bg-muted'
                    )}>
                      <Calendar className={cn(
                        'w-5 h-5',
                        task.enabled ? 'text-green-500' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm">{task.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {task.enabled ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1" dir="ltr">
                        {task.task}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span dir="ltr">Cron: {task.schedule}</span>
                        <span>اجرا: {formatNumber(task.total_run_count)} بار</span>
                        {task.last_run_at && (
                          <span>آخرین: {formatDateTime(task.last_run_at)}</span>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={task.enabled}
                      onCheckedChange={(v) =>
                        toggleTaskMutation.mutate({ id: task.id, enabled: v })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ===== STATS TAB ===== */}
        <TabsContent value="stats" className="mt-4 space-y-4">
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">کاربران</p>
                        <p className="text-2xl font-bold">{formatNumber(stats?.total_users)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <FolderOpen className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">پروژه‌ها</p>
                        <p className="text-2xl font-bold">{formatNumber(stats?.total_projects)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Database className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">داده‌های SEO</p>
                        <p className="text-2xl font-bold">{formatNumber(stats?.total_data_points)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <MessageSquare className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">فیدبک باز</p>
                        <p className="text-2xl font-bold">
                          {formatNumber(stats?.open_feedback_threads)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {stats?.users_by_role && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">توزیع کاربران بر اساس نقش</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stats.users_by_role.map((item) => {
                      const pct = stats.total_users > 0
                        ? Math.round((item.count / stats.total_users) * 100)
                        : 0
                      return (
                        <div key={item.role} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{ROLE_LABELS[item.role] || item.role}</span>
                            <span className="text-muted-foreground">
                              {item.count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ===== AUDIT TAB ===== */}
        <TabsContent value="audit" className="mt-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در لاگ‌ها..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه اقدامات</SelectItem>
                <SelectItem value="create">ایجاد</SelectItem>
                <SelectItem value="update">بروزرسانی</SelectItem>
                <SelectItem value="delete">حذف</SelectItem>
                <SelectItem value="login">ورود</SelectItem>
                <SelectItem value="logout">خروج</SelectItem>
                <SelectItem value="permission_change">تغییر دسترسی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {logsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                لاگی یافت نشد
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">کاربر</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">اقدام</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">مدل</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">شی</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">IP</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">زمان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs.map((log: AuditLog) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-xs">{log.user?.email || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', ACTION_COLORS[log.action] || 'bg-muted')}
                          >
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">{log.model_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground truncate max-w-[160px] block">
                            {log.object_repr || log.object_id || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground" dir="ltr">
                            {log.ip_address || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(log.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}