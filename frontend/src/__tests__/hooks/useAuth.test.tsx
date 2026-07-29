import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types/auth'

const mockUser: User = {
  id: '123',
  email: 'test@test.com',
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  role: 'employee',
  avatar: null,
  phone: null,
  bio: null,
  is_active: true,
  is_verified: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  profile: null,
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  })

  it('returns unauthenticated state initially', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('returns correct role flags for employee', () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true, isLoading: false })
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
    expect(result.current.isEmployee).toBe(true)
    expect(result.current.isDeveloper).toBe(false)
    expect(result.current.isCompanyManager).toBe(false)
    expect(result.current.canManage).toBe(false)
  })

  it('returns correct role flags for developer', () => {
    useAuthStore.setState({
      user: { ...mockUser, role: 'developer' },
      isAuthenticated: true,
      isLoading: false,
    })
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
    expect(result.current.isDeveloper).toBe(true)
    expect(result.current.canManage).toBe(true)
  })

  it('returns correct role flags for company_manager', () => {
    useAuthStore.setState({
      user: { ...mockUser, role: 'company_manager' },
      isAuthenticated: true,
      isLoading: false,
    })
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
    expect(result.current.isCompanyManager).toBe(true)
    expect(result.current.canManage).toBe(true)
  })
})