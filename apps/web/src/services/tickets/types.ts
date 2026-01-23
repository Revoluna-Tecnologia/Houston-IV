export enum TicketStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TicketCategory {
  UI = 'ui',
  FUNCTIONALITY = 'functionality',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  API = 'api',
  OTHER = 'other',
}

export enum TicketType {
  BUG = 'bug',
  FEATURE = 'feature',
  INCIDENT = 'incident',
  IMPROVEMENT = 'improvement',
  TECH_TASK = 'tech_task',
  SUPPORT = 'support',
  INTEGRATION = 'integration',
  SECURITY = 'security',
}

export enum TicketSector {
  DEV = 'dev',
  COMERCIAL = 'comercial',
  PROMPTERS = 'prompters',
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  type: TicketType
  sector: TicketSector
  location: string | null
  reproductionSteps: string | null
  screenshots: string[]
  tags: string[]
  slaDeadline: string | null
  slaBreach: boolean
  archived: boolean
  resolvedAt: string | null
  closedAt: string | null
  createdById: string
  assignedToId: string | null
  grupoId: string
  createdAt: string
  updatedAt: string
  commentsCount?: number
  attachmentsCount?: number
}

export interface CreateTicketDto {
  title: string
  description: string
  priority: TicketPriority
  category: TicketCategory
  type?: TicketType
  sector?: TicketSector
  location?: string
  reproductionSteps?: string
  screenshots?: string[]
  tags?: string[]
  slaDeadline?: string
  assignedToId?: string
  grupoId: string
}

export interface UpdateTicketDto {
  title?: string
  description?: string
  priority?: TicketPriority
  category?: TicketCategory
  type?: TicketType
  sector?: TicketSector
  location?: string
  reproductionSteps?: string
  screenshots?: string[]
  tags?: string[]
  slaDeadline?: string
  assignedToId?: string
}

export interface TicketQueryParams {
  status?: TicketStatus
  priority?: TicketPriority
  category?: TicketCategory
  sector?: TicketSector
  assignedToId?: string
  createdById?: string
  grupoId?: string
  search?: string
  archived?: boolean
  page?: number
  limit?: number
}

export interface TicketComment {
  id: string
  content: string
  isInternal: boolean
  ticketId: string
  authorId: string
  authorName: string
  createdAt: string
  updatedAt: string
}

export interface CreateCommentDto {
  content: string
  isInternal?: boolean
}

export interface TicketAttachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  key: string
  ticketId: string
  createdAt: string
}

export interface CreateAttachmentDto {
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  key: string
}

export interface TicketsPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface TicketAnalytics {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  avgResolutionTimeHours: number | null
  byStatus: Record<TicketStatus, number>
  byPriority: Record<TicketPriority, number>
  byCategory: Record<TicketCategory, number>
  bySector: Record<TicketSector, number>
  timeline: { date: string; created: number; resolved: number }[]
  slaMetrics: {
    total: number
    breached: number
    atRisk: number
    onTrack: number
    breachRate: number
  }
  topAssignees: {
    assigneeId: string
    assigneeName: string
    total: number
    open: number
    resolved: number
    avgResolutionTimeHours: number | null
  }[]
}

export interface AnalyticsQueryParams {
  grupoId?: string
  startDate?: string
  endDate?: string
  assigneeId?: string
  sector?: string
}
