import type { Ticket, TicketComment, TicketAttachment, TicketHistory } from '@prisma/client'

export const createTicketFixture = (overrides?: Partial<Ticket>): Ticket => ({
  id: 'ticket-1',
  title: 'Bug no formulario de login',
  description: 'O botao de login nao responde ao clicar',
  status: 'open',
  priority: 'high',
  category: 'functionality',
  type: 'bug',
  sector: 'dev',
  location: '/dashboard/login',
  reproductionSteps: '1. Acessar /login\n2. Preencher dados\n3. Clicar em entrar',
  screenshots: ['https://storage.com/screenshot1.png'],
  tags: ['urgent', 'frontend'],
  slaDeadline: new Date('2024-12-31T23:59:59Z'),
  slaBreach: false,
  archived: false,
  resolvedAt: null,
  closedAt: null,
  createdById: 'user-1',
  assignedToId: 'user-2',
  grupoId: 'grupo-1',
  createdAt: new Date('2024-12-20T10:00:00Z'),
  updatedAt: new Date('2024-12-20T15:30:00Z'),
  ...overrides,
})

export const createTicketCommentFixture = (overrides?: Partial<TicketComment>): TicketComment => ({
  id: 'comment-1',
  content: 'Este bug foi identificado na versao 2.0',
  isInternal: false,
  ticketId: 'ticket-1',
  authorId: 'user-1',
  authorName: 'Joao Silva',
  createdAt: new Date('2024-12-20T11:00:00Z'),
  updatedAt: new Date('2024-12-20T11:00:00Z'),
  ...overrides,
})

export const createTicketAttachmentFixture = (overrides?: Partial<TicketAttachment>): TicketAttachment => ({
  id: 'attachment-1',
  filename: 'screenshot-2024.png',
  originalName: 'Screenshot do Bug.png',
  mimeType: 'image/png',
  size: 102400,
  url: 'https://storage.com/uploads/screenshot-2024.png',
  key: 'uploads/tickets/ticket-1/screenshot-2024.png',
  ticketId: 'ticket-1',
  createdAt: new Date('2024-12-20T10:30:00Z'),
  ...overrides,
})

export const createTicketHistoryFixture = (overrides?: Partial<TicketHistory>): TicketHistory => ({
  id: 'history-1',
  action: 'status_changed',
  field: 'status',
  oldValue: 'open',
  newValue: 'in_progress',
  metadata: null,
  ticketId: 'ticket-1',
  authorId: 'user-1',
  authorName: 'Joao Silva',
  createdAt: new Date('2024-12-20T12:00:00Z'),
  ...overrides,
})

export const createTicketListFixture = (): Ticket[] => [
  createTicketFixture({ id: 'ticket-1', title: 'Bug no login' }),
  createTicketFixture({ id: 'ticket-2', title: 'Feature de exportacao', type: 'feature', priority: 'medium' }),
  createTicketFixture({ id: 'ticket-3', title: 'Problema de performance', category: 'performance', priority: 'critical' }),
]
