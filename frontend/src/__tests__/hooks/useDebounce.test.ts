import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/lib/hooks/useDebounce'

jest.useFakeTimers()

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('debounces value update', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )
    rerender({ value: 'updated' })
    expect(result.current).toBe('initial')
    act(() => jest.advanceTimersByTime(500))
    expect(result.current).toBe('updated')
  })

  it('cancels previous timeout on rapid updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    )
    rerender({ value: 'b' })
    act(() => jest.advanceTimersByTime(200))
    rerender({ value: 'c' })
    act(() => jest.advanceTimersByTime(500))
    expect(result.current).toBe('c')
  })
})