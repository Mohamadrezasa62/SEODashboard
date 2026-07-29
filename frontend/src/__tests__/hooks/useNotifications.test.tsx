import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useNotifications } from '@/lib/hooks/useNotifications'

jest.mock('@/lib/api/notifications', () => ({
  notificationsApi: {
    list: jest.fn().mockResolvedValue({
      data: {
        notifications: [
          {
            id: '1',
            notification_type: 'comment',
            title: 'New Comment',
            body: 'Someone commented',
            is_read: false,
            read_at: null,
            action_url: null,
            sender: null,
            metadata: {},
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        unread_count: 1,
      },
    }),
    getUnreadCount: jest.fn().mockResolvedValue({
      data: { unread_count: 1 },
    }),
    markRead: jest.fn().mockResolvedValue({}),
    markAllRead: jest.fn().mockResolvedValue({}),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useNotifications', () => {
  it('returns notifications list', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1)
    })

    expect(result.current.notifications[0].title).toBe('New Comment')
  })

  it('returns unread count', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(1)
    })
  })
})