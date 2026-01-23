import { vi, beforeEach, afterEach } from 'vitest'

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
  VagaStatus: {
    aberta: 'aberta',
    fechada: 'fechada',
    cancelada: 'cancelada',
    anunciada: 'anunciada',
  },
  CandidaturaStatus: {
    pendente: 'pendente',
    aprovada: 'aprovada',
    rejeitada: 'rejeitada',
  },
  EscalistaStatus: {
    pendente: 'pendente',
    ativo: 'ativo',
    inativo: 'inativo',
  },
  UserRole: {
    administrador: 'administrador',
    moderador: 'moderador',
    gestor: 'gestor',
    coordenador: 'coordenador',
    escalista: 'escalista',
  },
  WhatsAppInstanceStatus: {
    disconnected: 'disconnected',
    connecting: 'connecting',
    connected: 'connected',
    offline: 'offline',
    error: 'error',
  },
  MessageType: {
    text: 'text',
    image: 'image',
    audio: 'audio',
    video: 'video',
    document: 'document',
    sticker: 'sticker',
    location: 'location',
    contact: 'contact',
    template: 'template',
    shift_offer: 'shift_offer',
  },
  MessageStatus: {
    pending: 'pending',
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
    failed: 'failed',
  },
  PagamentoStatus: {
    pendente: 'pendente',
    autorizado: 'autorizado',
    pago: 'pago',
    cancelado: 'cancelado',
  },
  GradeStatus: {
    rascunho: 'rascunho',
    publicada: 'publicada',
    arquivada: 'arquivada',
  },
  TicketStatus: {
    open: 'open',
    in_progress: 'in_progress',
    resolved: 'resolved',
    closed: 'closed',
  },
  TicketPriority: {
    low: 'low',
    medium: 'medium',
    high: 'high',
    urgent: 'urgent',
  },
  ConversationType: {
    direct: 'direct',
    group: 'group',
  },
  ParticipantRole: {
    admin: 'admin',
    member: 'member',
  },
  TicketCategory: {
    ui: 'ui',
    functionality: 'functionality',
    performance: 'performance',
    security: 'security',
    api: 'api',
    other: 'other',
  },
  TicketType: {
    bug: 'bug',
    feature: 'feature',
    incident: 'incident',
    improvement: 'improvement',
    tech_task: 'tech_task',
    support: 'support',
    integration: 'integration',
    security: 'security',
  },
  TicketSector: {
    dev: 'dev',
    comercial: 'comercial',
    prompters: 'prompters',
  },
  ShiftOfferStatus: {
    pending: 'pending',
    accepted: 'accepted',
    rejected: 'rejected',
    expired: 'expired',
    cancelled: 'cancelled',
  },
  KanbanTab: {
    projetos: 'projetos',
    financeiro: 'financeiro',
  },
  KanbanTimelineType: {
    created: 'created',
    status_changed: 'status_changed',
    assigned: 'assigned',
    comment: 'comment',
    tag_added: 'tag_added',
    tag_removed: 'tag_removed',
    link_added: 'link_added',
    link_removed: 'link_removed',
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})
