import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { toast } from 'sonner'
import { NotificationToastProvider } from '../notification-toast'
import type { Notification } from '@/services/notifications'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

const mockUseNotificationSocket = vi.fn()
vi.mock('@/hooks/notifications', () => ({
  useNotificationSocket: (opts: unknown) => mockUseNotificationSocket(opts),
}))

vi.mock('@/hooks/use-current-user', () => ({
  useCurrentUser: () => ({
    user: { id: 'user-1', name: 'Test User' },
    isLoading: false,
  }),
}))

describe('NotificationToastProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children', () => {
    const { getByText } = render(
      <NotificationToastProvider>
        <div>Child Content</div>
      </NotificationToastProvider>,
    )
    expect(getByText('Child Content')).toBeInTheDocument()
  })

  it('calls useNotificationSocket with userId and enabled', () => {
    render(
      <NotificationToastProvider>
        <div />
      </NotificationToastProvider>,
    )
    expect(mockUseNotificationSocket).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        enabled: true,
        onNotification: expect.any(Function),
      }),
    )
  })

  it('calls toast.error for urgent notifications', () => {
    mockUseNotificationSocket.mockImplementation((opts: { onNotification: (n: Notification) => void }) => {
      opts.onNotification({
        id: '1',
        title: 'Urgent Alert',
        content: 'Something critical happened',
        priority: 'urgent',
        type: 'ticket_sla_breach',
        userId: 'user-1',
        read: false,
        createdAt: new Date().toISOString(),
      } as Notification)
    })

    render(
      <NotificationToastProvider>
        <div />
      </NotificationToastProvider>,
    )

    expect(toast.error).toHaveBeenCalledWith('Urgent Alert', {
      description: 'Something critical happened',
      duration: 10000,
    })
  })

  it('calls toast.warning for high priority notifications', () => {
    mockUseNotificationSocket.mockImplementation((opts: { onNotification: (n: Notification) => void }) => {
      opts.onNotification({
        id: '2',
        title: 'High Priority',
        content: 'Needs attention',
        priority: 'high',
        type: 'ticket_assigned',
        userId: 'user-1',
        read: false,
        createdAt: new Date().toISOString(),
      } as Notification)
    })

    render(
      <NotificationToastProvider>
        <div />
      </NotificationToastProvider>,
    )

    expect(toast.warning).toHaveBeenCalledWith('High Priority', {
      description: 'Needs attention',
      duration: 5000,
    })
  })

  it('calls toast.info for normal priority notifications', () => {
    mockUseNotificationSocket.mockImplementation((opts: { onNotification: (n: Notification) => void }) => {
      opts.onNotification({
        id: '3',
        title: 'Normal Update',
        content: 'Something happened',
        priority: 'normal',
        type: 'ticket_comment_added',
        userId: 'user-1',
        read: false,
        createdAt: new Date().toISOString(),
      } as Notification)
    })

    render(
      <NotificationToastProvider>
        <div />
      </NotificationToastProvider>,
    )

    expect(toast.info).toHaveBeenCalledWith('Normal Update', {
      description: 'Something happened',
      duration: 5000,
    })
  })
})
