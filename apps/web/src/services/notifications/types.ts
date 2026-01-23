export type NotificationType =
  | 'ticket_created'
  | 'ticket_assigned'
  | 'ticket_status_changed'
  | 'ticket_comment_added'
  | 'ticket_sla_warning'
  | 'ticket_sla_breach'
  | 'message_received'
  | 'conversation_created'
  | 'shift_offer_received'
  | 'shift_offer_response'
  | 'vaga_created'
  | 'vaga_updated'
  | 'vaga_expiring'
  | 'vaga_no_candidates'
  | 'candidatura_received'
  | 'candidatura_approved'
  | 'candidatura_rejected'
  | 'medico_registered'
  | 'medico_approved'
  | 'medico_documents_pending'
  | 'comunicado_published'
  | 'checkin_reminder'
  | 'checkout_reminder'
  | 'checkin_late'
  | 'checkout_late'

export type NotificationChannel = 'in_app' | 'email' | 'push'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  content: string
  data?: Record<string, unknown>
  read: boolean
  readAt?: string
  sentAt: string
  channels: NotificationChannel[]
  grupoId?: string
  createdAt: string
}

export interface NotificationPreference {
  id: string
  userId: string
  type: NotificationType
  inApp: boolean
  email: boolean
  push: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationQueryParams {
  type?: NotificationType
  read?: boolean
  page?: number
  limit?: number
}

export interface NotificationPaginatedResponse {
  data: Notification[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UnreadCountResponse {
  count: number
}

export interface UpdatePreferenceInput {
  type: NotificationType
  inApp?: boolean
  email?: boolean
  push?: boolean
}

export interface NotificationSocketEvents {
  'notification:new': (notification: Notification) => void
  'notification:unread_count': (data: { count: number }) => void
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  ticket_created: 'Ticket criado',
  ticket_assigned: 'Ticket atribuído',
  ticket_status_changed: 'Status do ticket alterado',
  ticket_comment_added: 'Comentário adicionado',
  ticket_sla_warning: 'Alerta de SLA',
  ticket_sla_breach: 'SLA violado',
  message_received: 'Mensagem recebida',
  conversation_created: 'Conversa criada',
  shift_offer_received: 'Oferta de plantão',
  shift_offer_response: 'Resposta de oferta',
  vaga_created: 'Vaga criada',
  vaga_updated: 'Vaga atualizada',
  vaga_expiring: 'Vaga expirando',
  vaga_no_candidates: 'Vaga sem candidatos',
  candidatura_received: 'Candidatura recebida',
  candidatura_approved: 'Candidatura aprovada',
  candidatura_rejected: 'Candidatura rejeitada',
  medico_registered: 'Médico cadastrado',
  medico_approved: 'Médico aprovado',
  medico_documents_pending: 'Documentos pendentes',
  comunicado_published: 'Comunicado publicado',
  checkin_reminder: 'Lembrete de check-in',
  checkout_reminder: 'Lembrete de check-out',
  checkin_late: 'Check-in atrasado',
  checkout_late: 'Check-out atrasado',
}

export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
}
