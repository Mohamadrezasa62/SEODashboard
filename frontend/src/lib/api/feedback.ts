import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { FeedbackThread, FeedbackComment } from '@/types/feedback'

export const feedbackApi = {
  listThreads: (projectId: string, params?: {
    status?: string
    priority?: string
    search?: string
  }) =>
    apiClient.get<ApiResponse<FeedbackThread[]>>(
      `/feedback/projects/${projectId}/threads/`,
      { params }
    ),

  getThread: (threadId: string) =>
    apiClient.get<ApiResponse<FeedbackThread>>(`/feedback/threads/${threadId}/`),

  createThread: (projectId: string, data: { title: string; priority: string }) =>
    apiClient.post<ApiResponse<FeedbackThread>>(
      `/feedback/projects/${projectId}/threads/`,
      data
    ),

  updateThread: (threadId: string, data: Partial<{
    title: string
    status: string
    priority: string
  }>) =>
    apiClient.patch<ApiResponse<FeedbackThread>>(`/feedback/threads/${threadId}/`, data),

  resolveThread: (threadId: string) =>
    apiClient.post<ApiResponse<FeedbackThread>>(`/feedback/threads/${threadId}/resolve/`),

  assignThread: (threadId: string, userId: string) =>
    apiClient.post<ApiResponse<FeedbackThread>>(`/feedback/threads/${threadId}/assign/`, {
      user_id: userId,
    }),

  markSeen: (threadId: string) =>
    apiClient.post<ApiResponse<null>>(`/feedback/threads/${threadId}/seen/`),

  deleteThread: (threadId: string) =>
    apiClient.delete<ApiResponse<null>>(`/feedback/threads/${threadId}/`),

  getComments: (threadId: string) =>
    apiClient.get<ApiResponse<FeedbackComment[]>>(`/feedback/threads/${threadId}/comments/`),

  addComment: (threadId: string, data: FormData) =>
    apiClient.uploadFile<ApiResponse<FeedbackComment>>(
      `/feedback/threads/${threadId}/comments/`,
      data
    ),

  updateComment: (commentId: string, content: string) =>
    apiClient.patch<ApiResponse<FeedbackComment>>(`/feedback/comments/${commentId}/`, {
      content,
    }),

  deleteComment: (commentId: string) =>
    apiClient.delete<ApiResponse<null>>(`/feedback/comments/${commentId}/`),
}