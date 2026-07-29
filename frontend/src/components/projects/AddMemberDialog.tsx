'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Search } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { projectsApi } from '@/lib/api/projects'
import { usersApi } from '@/lib/api/users'
import { QUERY_KEYS } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { User } from '@/types/auth'

interface Props {
  open: boolean
  projectId: string
  onClose: () => void
}

export function AddMemberDialog({ open, projectId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [role, setRole] = useState('viewer')

  const { data: usersData } = useQuery({
    queryKey: ['users', search],
    queryFn: () => usersApi.list({ search: search || undefined }),
    enabled: search.length > 1,
  })

  const mutation = useMutation({
    mutationFn: () =>
      projectsApi.addMember(projectId, { user_id: selectedUserId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECT_MEMBERS(projectId) })
      toast.success('عضو اضافه شد')
      setSearch('')
      setSelectedUserId('')
      onClose()
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'خطا در افزودن عضو'),
  })

  const users = (usersData?.data ?? []) as User[]
  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>افزودن عضو به پروژه</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>جستجوی کاربر</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="نام یا ایمیل کاربر..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setSelectedUserId('')
                }}
                className="pr-9"
              />
            </div>
          </div>

          {users.length > 0 && !selectedUserId && (
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {users.map((u: User) => (
                <button
                  key={u.id}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-right"
                  onClick={() => {
                    setSelectedUserId(u.id)
                    setSearch(u.full_name)
                  }}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(u.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(selectedUser.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedUser.full_name}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">{selectedUser.email}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>نقش در پروژه</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">مدیر</SelectItem>
                <SelectItem value="analyst">آنالیست</SelectItem>
                <SelectItem value="viewer">مشاهده‌گر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>انصراف</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!selectedUserId || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'افزودن'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}