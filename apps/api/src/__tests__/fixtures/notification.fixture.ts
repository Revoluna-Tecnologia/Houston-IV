interface NotificationFixture {
  id: string
  userId: string
  type: string
  priority: string
  title: string
  content: string
  data: null | Record<string, unknown>
  read: boolean
  readAt: Date | null
  sentAt: Date
  channels: string[]
  grupoId: string
  createdAt: Date
}

interface PreferenceFixture {
  id: string
  userId: string
  type: string
  inApp: boolean
  email: boolean
  push: boolean
  createdAt: Date
  updatedAt: Date
}

export const createNotificationFixture = (overrides?: Partial<NotificationFixture>): NotificationFixture => ({
  id: 'notification-1',
  userId: 'user-1',
  type: 'ticket_created',
  priority: 'normal',
  title: 'Novo Ticket',
  content: 'Um novo ticket foi criado',
  data: null,
  read: false,
  readAt: null,
  sentAt: new Date('2024-01-01T10:00:00Z'),
  channels: ['in_app', 'email'],
  grupoId: 'grupo-1',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  ...overrides,
})

export const createNotificationListFixture = (): NotificationFixture[] => [
  createNotificationFixture({ id: 'notification-1' }),
  createNotificationFixture({ id: 'notification-2', type: 'ticket_assigned' }),
  createNotificationFixture({ id: 'notification-3', type: 'vaga_created', read: true }),
]

export const createPreferenceFixture = (overrides?: Partial<PreferenceFixture>): PreferenceFixture => ({
  id: 'pref-1',
  userId: 'user-1',
  type: 'ticket_created',
  inApp: true,
  email: true,
  push: false,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  ...overrides,
})

export const createPreferenceListFixture = (): PreferenceFixture[] => [
  createPreferenceFixture({ type: 'ticket_created' }),
  createPreferenceFixture({ id: 'pref-2', type: 'vaga_created', email: false }),
  createPreferenceFixture({ id: 'pref-3', type: 'message_received' }),
]
