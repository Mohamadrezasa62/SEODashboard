import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'

const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

describe('useLocalStorage', () => {
  beforeEach(() => mockLocalStorage.clear())

  it('returns initial value when key not set', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('stores and retrieves value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', ''))
    act(() => result.current[1]('new-value'))
    expect(result.current[0]).toBe('new-value')
    expect(mockLocalStorage.getItem('test-key')).toBe('"new-value"')
  })

  it('removes value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    act(() => result.current[1]('stored'))
    act(() => result.current[2]())
    expect(result.current[0]).toBe('initial')
  })

  it('handles objects', () => {
    const { result } = renderHook(() =>
      useLocalStorage<{ name: string }>('obj-key', { name: '' })
    )
    act(() => result.current[1]({ name: 'Ali' }))
    expect(result.current[0]).toEqual({ name: 'Ali' })
  })
})