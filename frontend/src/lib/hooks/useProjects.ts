'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api/projects'
import { QUERY_KEYS } from '@/lib/constants'
import toast from 'react-hot-toast'

export function useProjects(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PROJECTS, params],
    queryFn: () => projectsApi.list(params),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PROJECT(id),
    queryFn: () => projectsApi.get(id),
    enabled: !!id,
  })
}

export function useProjectMembers(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PROJECT_MEMBERS(id),
    queryFn: () => projectsApi.getMembers(id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECTS })
      toast.success('پروژه ایجاد شد')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در ایجاد پروژه')
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECTS })
      toast.success('پروژه حذف شد')
    },
    onError: () => toast.error('خطا در حذف پروژه'),
  })
}