'use client'

import { useState, useCallback } from 'react'

interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export function usePagination(initialPageSize = 20) {
  const [state, setState] = useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
    total: 0,
  })

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }))
  }, [])

  const setTotal = useCallback((total: number) => {
    setState((prev) => ({ ...prev, total }))
  }, [])

  const nextPage = useCallback(() => {
    setState((prev) => ({ ...prev, page: prev.page + 1 }))
  }, [])

  const prevPage = useCallback(() => {
    setState((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
  }, [])

  const totalPages = Math.ceil(state.total / state.pageSize)
  const hasNext = state.page < totalPages
  const hasPrev = state.page > 1

  return {
    page: state.page,
    pageSize: state.pageSize,
    total: state.total,
    totalPages,
    hasNext,
    hasPrev,
    setPage,
    setTotal,
    nextPage,
    prevPage,
  }
}