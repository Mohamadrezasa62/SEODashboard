'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X, Send, CheckCircle, Paperclip,
  MoreVertical, Reply, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { feedbackApi } from '@/lib/api/feedback'
import { useAuth } from '@/lib/hooks/useAuth'
import { QUERY_KEYS, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants'
import { formatDateTime, getInitials, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { FeedbackThread, FeedbackComment } from '@/types/feedback'

interface Props {
  thread: FeedbackThread
  onClose: () => void
  onUpdate: (thread: FeedbackThread) => void
}

export function ThreadDetail({ thread, onClose, onUpdate }: Props) {
  const { user, canManage } = useAuth()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['feedback', 'comments', thread.id],
    queryFn: () => feedbackApi.getComments(thread.id),
  })

  const addCommentMutation = useMutation({
    mutationFn: (formData: FormData) => feedbackApi.addComment(thread.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', 'comments', thread.id] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEEDBACK_THREADS(thread.id) })
      setContent('')
      setReplyTo(null)
    },
    onError: () => toast.error('خطا در ارسال کامنت'),
  })

  const resolveMutation = useMutation({
    mutationFn: () => feedbackApi.resolveThread(thread.id),
    onSuccess: (res) => {
      onUpdate(res.data)
      toast.success('Thread حل‌شده علامت‌گذاری شد')
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  })

  const deleteCommentMutation = useMutation({
    mutationFn: feedbackApi.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', 'comments', thread.id] })
      toast.success('کامنت حذف شد')
    },
  })

  const handleSend = () => {
    if (!content.trim()) return
    const formData = new FormData()
    formData.append('content', content)
    if (replyTo) formData.append('parent_id', replyTo)
    if (fileRef.current?.files?.length) {
      Array.from(fileRef.current.files).forEach((f) => formData.append('attachments', f))
    }
    addCommentMutation.mutate(formData)
  }

  const comments = commentsData?.data ?? []

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] border border-border rounded-xl overflow-hidden bg-card">
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-snug mb-2">{thread.title}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={cn('text-xs', STATUS_COLORS[thread.status])}>
              {STATUS_LABELS[thread.status]}
            </Badge>
            <Badge variant="secondary" className={cn('text-xs', PRIORITY_COLORS[thread.priority])}>
              {PRIORITY_LABELS[thread.priority]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {thread.created_by.full_name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canManage && thread.status !== 'resolved' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-green-500 hover:text-green-600 h-8"
              onClick={() => resolveMutation.mutate()}
              disabled={resolveMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 ml-1" />
              حل‌شده
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-32" />
                  <div className="h-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            هنوز کامنتی نیست. اولین نفر باشید!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment: FeedbackComment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={user?.id}
                canManage={canManage}
                onReply={() => setReplyTo(comment.id)}
                onDelete={(id) => deleteCommentMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border space-y-2">
        {replyTo && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
            <span className="text-xs text-muted-foreground">در حال پاسخ به کامنت</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setReplyTo(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder="کامنت خود را بنویسید..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" multiple className="hidden" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground">Ctrl+Enter برای ارسال</span>
          </div>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!content.trim() || addCommentMutation.isPending}
          >
            {addCommentMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 ml-2" />
                ارسال
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CommentItem({
  comment,
  currentUserId,
  canManage,
  onReply,
  onDelete,
}: {
  comment: FeedbackComment
  currentUserId?: string
  canManage: boolean
  onReply: () => void
  onDelete: (id: string) => void
}) {
  const isOwn = comment.author.id === currentUserId
  const canDelete = isOwn || canManage

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {getInitials(comment.author.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{comment.author.full_name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(comment.created_at)}
          </span>
          {comment.is_edited && (
            <span className="text-xs text-muted-foreground">(ویرایش شده)</span>
          )}
        </div>
        <div className="bg-muted/40 rounded-xl px-3 py-2.5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        </div>
        {comment.attachments?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {comment.attachments.map((att) => (
              
                key={att.id}
                href={att.file}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-lg hover:bg-muted/80"
              >
                <Paperclip className="w-3 h-3" />
                {att.file_name}
              </a>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground px-2"
            onClick={onReply}
          >
            <Reply className="w-3 h-3 ml-1" />
            پاسخ
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-destructive px-2"
              onClick={() => onDelete(comment.id)}
            >
              حذف
            </Button>
          )}
        </div>
        {comment.replies?.length > 0 && (
          <div className="mt-3 space-y-3 pr-4 border-r-2 border-border">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                canManage={canManage}
                onReply={onReply}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}