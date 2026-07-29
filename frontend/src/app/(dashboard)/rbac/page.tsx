'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shield, Plus, Trash2, ToggleLeft,
  ToggleRight, Key, Puzzle, ChevronDown, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { rbacApi, type Role, type FeatureFlag, type Plugin, type Permission } from '@/lib/api/rbac'
import { formatDateTime, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { CreateRoleDialog } from '@/components/rbac/CreateRoleDialog'
import { CreateFeatureFlagDialog } from '@/components/rbac/CreateFeatureFlagDialog'

const MODULE_LABELS: Record<string, string> = {
  users: 'کاربران',
  projects: 'پروژه‌ها',
  seo: 'SEO',
  kpi: 'KPI',
  feedback: 'فیدبک',
  reports: 'گزارشات',
  dashboard: 'داشبورد',
  ai: 'هوش مصنوعی',
  system: 'سیستم',
}

export default function RBACPage() {
  const queryClient = useQueryClient()
  const [createRoleOpen, setCreateRoleOpen] = useState(false)
  const [createFlagOpen, setCreateFlagOpen] = useState(false)
  const [expandedRole, setExpandedRole] = useState<string | null>(null)

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rbacApi.listRoles,
  })

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => rbacApi.listPermissions(),
  })

  const { data: flagsData, isLoading: flagsLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: rbacApi.listFeatureFlags,
  })

  const { data: pluginsData, isLoading: pluginsLoading } = useQuery({
    queryKey: ['plugins'],
    queryFn: rbacApi.listPlugins,
  })

  const deleteRoleMutation = useMutation({
    mutationFn: rbacApi.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('نقش حذف شد')
    },
    onError: () => toast.error('این نقش قابل حذف نیست'),
  })

  const toggleFlagMutation = useMutation({
    mutationFn: ({ slug, enabled }: { slug: string; enabled: boolean }) =>
      rbacApi.toggleFeatureFlag(slug, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  })

  const togglePluginMutation = useMutation({
    mutationFn: ({ slug, active }: { slug: string; active: boolean }) =>
      rbacApi.togglePlugin(slug, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] })
    },
  })

  const roles = (rolesData?.data ?? []) as Role[]
  const permissions = (permissionsData?.data ?? []) as Permission[]
  const flags = (flagsData?.data ?? []) as FeatureFlag[]
  const plugins = (pluginsData?.data ?? []) as Plugin[]

  const permsByModule = permissions.reduce((acc: Record<string, Permission[]>, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">مدیریت دسترسی‌ها</h1>
        <p className="text-muted-foreground text-sm mt-1">Role-Based Access Control</p>
      </div>

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 ml-2" />
            نقش‌ها ({roles.length})
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Key className="w-4 h-4 ml-2" />
            مجوزها ({permissions.length})
          </TabsTrigger>
          <TabsTrigger value="features">
            <ToggleRight className="w-4 h-4 ml-2" />
            Feature Flags ({flags.length})
          </TabsTrigger>
          <TabsTrigger value="plugins">
            <Puzzle className="w-4 h-4 ml-2" />
            پلاگین‌ها ({plugins.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreateRoleOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              نقش جدید
            </Button>
          </div>

          {rolesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : (
            roles.map((role: Role) => (
              <Card key={role.id} className={cn(role.is_system && 'border-primary/20')}>
                <CardContent className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{role.name}</p>
                          {role.is_system && (
                            <Badge variant="secondary" className="text-xs text-primary">
                              سیستمی
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {role.permissions_count} مجوز
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!role.is_system && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('حذف این نقش؟')) {
                              deleteRoleMutation.mutate(role.id)
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {expandedRole === role.id ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {expandedRole === role.id && role.permissions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <div className="flex flex-wrap gap-1.5">
                        {role.permissions.map((perm) => (
                          <Badge key={perm.id} variant="secondary" className="text-xs">
                            {perm.codename}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="permissions" className="mt-4 space-y-4">
          {Object.entries(permsByModule).map(([module, perms]) => (
            <Card key={module}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">
                  {MODULE_LABELS[module] || module}
                  <span className="text-muted-foreground font-normal mr-2">({perms.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {perms.map((perm: Permission) => (
                    <div
                      key={perm.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                    >
                      <Key className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium" dir="ltr">{perm.codename}</p>
                        <p className="text-xs text-muted-foreground">{perm.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="features" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreateFlagOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              Feature Flag جدید
            </Button>
          </div>

          {flagsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : flags.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                هنوز Feature Flag‌ای تعریف نشده
              </CardContent>
            </Card>
          ) : (
            flags.map((flag: FeatureFlag) => (
              <Card key={flag.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{flag.name}</p>
                        <Badge variant="secondary" className="text-xs" dir="ltr">
                          {flag.slug}
                        </Badge>
                      </div>
                      {flag.description && (
                        <p className="text-xs text-muted-foreground">{flag.description}</p>
                      )}
                      {flag.allowed_roles.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {flag.allowed_roles.map((role) => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Switch
                      checked={flag.is_enabled}
                      onCheckedChange={(v) =>
                        toggleFlagMutation.mutate({ slug: flag.slug, enabled: v })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="plugins" className="mt-4 space-y-3">
          {pluginsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : plugins.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                پلاگینی موجود نیست
              </CardContent>
            </Card>
          ) : (
            plugins.map((plugin: Plugin) => (
              <Card key={plugin.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Puzzle className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium text-sm">{plugin.name}</p>
                        <Badge variant="secondary" className="text-xs" dir="ltr">
                          v{plugin.version}
                        </Badge>
                      </div>
                      {plugin.description && (
                        <p className="text-xs text-muted-foreground">{plugin.description}</p>
                      )}
                    </div>
                    <Switch
                      checked={plugin.is_active}
                      onCheckedChange={(v) =>
                        togglePluginMutation.mutate({ slug: plugin.slug, active: v })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <CreateRoleDialog
        open={createRoleOpen}
        onClose={() => setCreateRoleOpen(false)}
      />
      <CreateFeatureFlagDialog
        open={createFlagOpen}
        onClose={() => setCreateFlagOpen(false)}
      />
    </div>
  )
}