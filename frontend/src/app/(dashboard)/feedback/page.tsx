'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, MessageSquare, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ThreadDetail } from '@/components/feedback/ThreadDetail'
import { CreateThreadDialog } from '@/components/feedback/CreateThreadDialog'
import { projectsApi } from '@/lib/api/projects'
import { feedbackApi } from '@/lib/api/feedback'
import { QUERY_KEYS, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants'
import { formatDateTime, cn } from '@/lib/utils'
import type { FeedbackThread } from '@/types/feedback'

export default function FeedbackPage() {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedThread, setSelectedThread] = useState<FeedbackThread | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: projectsData } = useQuery({
    queryKey: QUERY_KEYS.PROJECTS,
    queryFn: () => projectsApi.list(),
    onSuccess: (d: any) => {
      if (d.data?.length && !selectedProjectId) setSelectedProjectId(d.data[0].id)
    },
  })

  const { data: threadsData, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.FEEDBACK_THREADS(selectedProjectId), statusFilter],
    queryFn: () =>
      feedbackApi.listThreads(selectedProjectId, {
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    enabled: !!selectedProjectId,
  })

  const projects = projectsData?.data ?? []
  const threads = threadsData?.data ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">فیدبک</h1>
          <p className="text-muted-foreground text-sm mt-1">{threads.length} Thread</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!selectedProjectId}>
          <Plus className="w-4 h-4 ml-2" />
          Thread جدید
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="انتخاب پروژه" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="open">باز</SelectItem>
            <SelectItem value="in_progress">در حال بررسی</SelectItem>
            <SelectItem value="resolved">حل‌شده</SelectItem>
            <SelectItem value="closed">بسته</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : threads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Thread‌ای یافت نشد</p>
              </CardContent>
            </Card>
          ) : (
            threads.map((thread: FeedbackThread) => (
              <Card
                key={thread.id}
                className={cn(
                  'cursor-pointer hover:shadow-md transition-all',
                  selectedThread?.id === thread.id && 'ring-2 ring-primary',
                  thread.has_unseen && 'border-primary/30'
                )}
                onClick={() => setSelectedThread(thread)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {thread.has_unseen && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                        <p className="font-medium text-sm leading-snug truncate">
                          {thread.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={cn('text-xs', STATUS_COLORS[thread.status])}
                        >
                          {STATUS_LABELS[thread.status]}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn('text-xs', PRIORITY_COLORS[thread.priority])}
                        >
                          {PRIORITY_LABELS[thread.priority]}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {thread.comment_count} کامنت
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(thread.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    توسط: {thread.created_by.full_name}
                    {thread.assigned_to && ` • به: ${thread.assigned_to.full_name}`}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="hidden lg:block">
          {selectedThread ? (
            <ThreadDetail
              thread={selectedThread}
              onClose={() => setSelectedThread(null)}
              onUpdate={(updated) => setSelectedThread(updated)}
            />
          ) : (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">یک Thread انتخاب کنید</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateThreadDialog
        open={createOpen}
        projectId={selectedProjectId}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  )
}