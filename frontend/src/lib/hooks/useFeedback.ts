'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { feedbackApi } from '@/lib/api/feedback'
import { QUERY_KEYS } from '@/lib/constants'
import toast from 'react-hot-toast'

export function useFeedbackThreads(
  projectId: string,
  filters?: { status?: string; priority?: string; search?: string }
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FEEDBACK_THREADS(projectId), filters],
    queryFn: () => feedbackApi.listThreads(projectId, filters),
    enabled: !!projectId,
  })
}

export function useFeedbackComments(threadId: string) {
  return useQuery({
    queryKey: ['feedback', 'comments', threadId],
    queryFn: () => feedbackApi.getComments(threadId),
    enabled: !!threadId,
  })
}

export function useCreateThread(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; priority: string }) =>
      feedbackApi.createThread(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEEDBACK_THREADS(projectId) })
      toast.success('Thread ایجاد شد')
    },
    onError: () => toast.error('خطا در ایجاد Thread'),
  })
}

export function useResolveThread(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: feedbackApi.resolveThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEEDBACK_THREADS(projectId) })
      toast.success('Thread حل‌شده علامت‌گذاری شد')
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  })
}

export function useAddComment(threadId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => feedbackApi.addComment(threadId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', 'comments', threadId] })
    },
    onError: () => toast.error('خطا در ارسال کامنت'),
  })
}

export function useDeleteComment(threadId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: feedbackApi.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', 'comments', threadId] })
      toast.success('کامنت حذف شد')
    },
  })
}