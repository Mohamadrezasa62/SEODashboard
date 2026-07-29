'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity, CheckCircle, XCircle, AlertTriangle,
  Users, FolderOpen, Database, MessageSquare,
  Search, Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { monitoringApi, type AuditLog, type SystemStats, type HealthCheck } from '@/lib/api/monitoring'
import { formatDateTime, formatNumber, cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'

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

export default function MonitoringPage() {
  const [actionFilter, setActionFilter] = useState('all')
  const [search, setSearch] = useState('')

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
    queryFn: () =>
      monitoringApi.auditLogs({
        action: actionFilter === 'all' ? undefined : actionFilter,
      }),
  })

  const health = healthData?.data as HealthCheck | undefined
  const stats = statsData?.data as SystemStats | undefined
  const allLogs = (logsData?.data ?? []) as AuditLog[]
  const logs = search
    ? allLogs.filter(
        (l) =>
          l.model_name.toLowerCase().includes(search.toLowerCase()) ||
          l.user?.email.toLowerCase().includes(search.toLowerCase()) ||
          l.object_repr?.toLowerCase().includes(search.toLowerCase())
      )
    : allLogs

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">مانیتورینگ</h1>
        <p className="text-muted-foreground text-sm mt-1">وضعیت سیستم و لاگ‌های سرویس</p>
      </div>

      <Tabs defaultValue="health">
        <TabsList>
          <TabsTrigger value="health">
            <Activity className="w-4 h-4 ml-2" />
            Health Check
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Database className="w-4 h-4 ml-2" />
            آمار سیستم
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Filter className="w-4 h-4 ml-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-4 space-y-4">
          {healthLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Card className={cn(
                'border-2',
                health?.status === 'ok' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
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
                      <p className="text-sm text-muted-foreground">
                        آخرین بررسی: همین الان
                      </p>
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
                        <p className="text-2xl font-bold">{formatNumber(stats?.open_feedback_threads)}</p>
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
                  <CardContent>
                    <div className="space-y-3">
                      {stats.users_by_role.map((item) => {
                        const pct = stats.total_users > 0
                          ? Math.round((item.count / stats.total_users) * 100)
                          : 0
                        return (
                          <div key={item.role} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{ROLE_LABELS[item.role] || item.role}</span>
                              <span className="text-muted-foreground">{item.count} ({pct}%)</span>
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
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در لاگ‌ها..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
          ) : logs.length === 0 ? (
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
                    {logs.map((log: AuditLog) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-xs">
                            {log.user?.email || '—'}
                          </span>
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
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
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