'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, MoreVertical, UserCheck, UserX, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateUserDialog } from '@/components/users/CreateUserDialog'
import { usersApi } from '@/lib/api/users'
import { useAuth } from '@/lib/hooks/useAuth'
import { ROLE_LABELS, ROLES } from '@/lib/constants'
import { formatDate, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { User } from '@/types/auth'

export default function UsersPage() {
  const { isDeveloper, isCompanyManager } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter],
    queryFn: () =>
      usersApi.list({
        search: search || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
      }),
  })

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersApi.changeRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('نقش کاربر تغییر یافت')
    },
    onError: () => toast.error('خطا در تغییر نقش'),
  })

  const deactivateMutation = useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('کاربر غیرفعال شد')
    },
    onError: () => toast.error('خطا در غیرفعال‌سازی'),
  })

  const users = data?.data ?? []

  const roleColors: Record<string, string> = {
    developer: 'text-purple-500 bg-purple-500/10',
    company_manager: 'text-blue-500 bg-blue-500/10',
    employee: 'text-green-500 bg-green-500/10',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مدیریت کاربران</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} کاربر</p>
        </div>
        {isDeveloper && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 ml-2" />
            کاربر جدید
          </Button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی کاربر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="فیلتر نقش" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه نقش‌ها</SelectItem>
            <SelectItem value="developer">توسعه‌دهنده</SelectItem>
            <SelectItem value="company_manager">مدیر شرکت</SelectItem>
            <SelectItem value="employee">کارمند</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">کاربر</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">نقش</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">وضعیت</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">تاریخ ثبت‌نام</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-48" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-8" /></td>
                    </tr>
                  ))
                : users.map((user: User) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${roleColors[user.role]}`}
                        >
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-muted'}`} />
                          <span className="text-xs text-muted-foreground">
                            {user.is_active ? 'فعال' : 'غیرفعال'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(user.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isDeveloper && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => changeRoleMutation.mutate({
                                  id: user.id,
                                  role: 'company_manager',
                                })}
                              >
                                <Shield className="w-4 h-4 ml-2" />
                                مدیر شرکت
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => changeRoleMutation.mutate({
                                  id: user.id,
                                  role: 'employee',
                                })}
                              >
                                <UserCheck className="w-4 h-4 ml-2" />
                                کارمند
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm('آیا از غیرفعال‌سازی این کاربر مطمئن هستید؟')) {
                                    deactivateMutation.mutate(user.id)
                                  }
                                }}
                              >
                                <UserX className="w-4 h-4 ml-2" />
                                غیرفعال
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              کاربری یافت نشد
            </div>
          )}
        </div>
      </Card>

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}