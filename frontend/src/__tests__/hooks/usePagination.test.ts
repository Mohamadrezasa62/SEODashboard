import { renderHook, act } from '@testing-library/react'
import { usePagination } from '@/lib/hooks/usePagination'

describe('usePagination', () => {
  it('initializes with correct default values', () => {
    const { result } = renderHook(() => usePagination(20))
    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(20)
    expect(result.current.total).toBe(0)
  })

  it('calculates total pages correctly', () => {
    const { result } = renderHook(() => usePagination(10))
    act(() => result.current.setTotal(95))
    expect(result.current.totalPages).toBe(10)
  })

  it('handles next and prev page', () => {
    const { result } = renderHook(() => usePagination(10))
    act(() => result.current.setTotal(100))
    act(() => result.current.nextPage())
    expect(result.current.page).toBe(2)
    act(() => result.current.prevPage())
    expect(result.current.page).toBe(1)
  })

  it('does not go below page 1', () => {
    const { result } = renderHook(() => usePagination(10))
    act(() => result.current.prevPage())
    expect(result.current.page).toBe(1)
  })

  it('reports hasNext and hasPrev correctly', () => {
    const { result } = renderHook(() => usePagination(10))
    act(() => result.current.setTotal(30))
    expect(result.current.hasNext).toBe(true)
    expect(result.current.hasPrev).toBe(false)
    act(() => result.current.setPage(3))
    expect(result.current.hasNext).toBe(false)
    expect(result.current.hasPrev).toBe(true)
  })
})