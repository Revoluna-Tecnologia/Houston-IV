import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { NotificationsService } from '../notifications.service'
import { NotificationsGateway } from '../notifications.gateway'
import { ResendProvider } from '../providers/resend.provider'
import {
  TicketCreatedEvent,
  TicketAssignedEvent,
  TicketStatusChangedEvent,
  TicketCommentAddedEvent,
  TicketSlaWarningEvent,
  TicketSlaBreachEvent,
  VagaCreatedEvent,
  VagaExpiringEvent,
  VagaNoCandidatesEvent,
  CandidaturaReceivedEvent,
  CandidaturaApprovedEvent,
  MedicoRegisteredEvent,
  ComunicadoPublishedEvent,
  CheckinReminderEvent,
  CheckinLateEvent,
  MessageReceivedEvent,
  ShiftOfferReceivedEvent,
} from './notification.events'

@Injectable()
export class NotificationEventListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly gateway: NotificationsGateway,
    private readonly emailProvider: ResendProvider,
  ) {}

  @OnEvent('ticket.created')
  async handleTicketCreated(event: TicketCreatedEvent) {
    const userId = event.ticket.assigneeId || event.createdBy.id
    const notification = await this.notificationsService.send({
      userId,
      type: 'ticket_created',
      title: 'Novo Ticket Criado',
      content: `Ticket "${event.ticket.title}" foi criado por ${event.createdBy.name}`,
      data: { ticketId: event.ticket.id },
      grupoId: event.grupoId,
    })
    this.gateway.emitNotification(notification.userId, notification)
  }

  @OnEvent('ticket.assigned')
  async handleTicketAssigned(event: TicketAssignedEvent) {
    const notification = await this.notificationsService.send({
      userId: event.assignee.id,
      type: 'ticket_assigned',
      title: 'Ticket Atribuído',
      content: `Você foi atribuído ao ticket "${event.ticket.title}"`,
      data: { ticketId: event.ticket.id },
    })
    this.gateway.emitNotification(notification.userId, notification)

    if (event.assignee.email) {
      await this.emailProvider.sendNotificationEmail(
        event.assignee.email,
        notification.title,
        notification.content,
        `/tickets/${event.ticket.id}`,
      )
    }
  }

  @OnEvent('ticket.status_changed')
  async handleTicketStatusChanged(event: TicketStatusChangedEvent) {
    const notification = await this.notificationsService.send({
      userId: event.ticket.creatorId,
      type: 'ticket_status_changed',
      title: 'Status do Ticket Alterado',
      content: `Ticket "${event.ticket.title}" mudou de ${event.oldStatus} para ${event.newStatus}`,
      data: { ticketId: event.ticket.id, oldStatus: event.oldStatus, newStatus: event.newStatus },
      priority: 'low',
    })
    this.gateway.emitNotification(notification.userId, notification)
  }

  @OnEvent('ticket.comment_added')
  async handleTicketCommentAdded(event: TicketCommentAddedEvent) {
    for (const participant of event.ticketParticipants) {
      if (participant.id === event.author.id) continue

      const notification = await this.notificationsService.send({
        userId: participant.id,
        type: 'ticket_comment_added',
        title: 'Novo Comentário',
        content: `${event.author.name} comentou no ticket`,
        data: { ticketId: event.ticketId, commentId: event.comment.id },
        priority: 'low',
      })
      this.gateway.emitNotification(notification.userId, notification)
    }
  }

  @OnEvent('ticket.sla_warning')
  async handleTicketSlaWarning(event: TicketSlaWarningEvent) {
    const userId = event.ticket.assigneeId || event.ticket.creatorId
    const notification = await this.notificationsService.send({
      userId,
      type: 'ticket_sla_warning',
      title: 'Alerta de SLA',
      content: `Ticket "${event.ticket.title}" expira em ${event.hoursRemaining}h`,
      data: { ticketId: event.ticket.id, hoursRemaining: event.hoursRemaining },
      priority: 'high',
      grupoId: event.grupoId,
    })
    this.gateway.emitNotification(notification.userId, notification)

    if (event.ticket.assignee?.email) {
      await this.emailProvider.sendNotificationEmail(
        event.ticket.assignee.email,
        notification.title,
        notification.content,
        `/tickets/${event.ticket.id}`,
      )
    }
  }

  @OnEvent('ticket.sla_breach')
  async handleTicketSlaBreach(event: TicketSlaBreachEvent) {
    const userId = event.ticket.assigneeId || event.ticket.creatorId
    const notification = await this.notificationsService.send({
      userId,
      type: 'ticket_sla_breach',
      title: 'SLA Violado',
      content: `Ticket "${event.ticket.title}" excedeu o prazo de SLA`,
      data: { ticketId: event.ticket.id },
      priority: 'urgent',
      grupoId: event.grupoId,
    })
    this.gateway.emitNotification(notification.userId, notification)
  }

  @OnEvent('vaga.created')
  async handleVagaCreated(event: VagaCreatedEvent) {
    const notification = await this.notificationsService.send({
      userId: event.createdBy.id,
      type: 'vaga_created',
      title: 'Nova Vaga Criada',
      content: `Vaga criada com sucesso`,
      data: { vagaId: event.vaga.id },
      grupoId: event.grupoId,
    })
    this.gateway.emitNotification(notification.userId, notification)
  }

  @OnEvent('vaga.expiring')
  async handleVagaExpiring(event: VagaExpiringEvent) {
    if (!event.coordinatorId) return

    const notification = await this.notificationsService.send({
      userId: event.coordinatorId,
      type: 'vaga_expiring',
      title: 'Vaga Expirando',
      content: `Vaga expira em ${event.hoursRemaining}h e ainda não tem médicos confirmados`,
      data: { vagaId: event.vaga.id, hoursRemaining: event.hoursRemaining },
      priority: 'high',
      grupoId: event.grupoId,
    })
    this.gateway.emitNotification(notification.userId, notification)
  }

  @OnEvent('vaga.no_candidates')
  async handleVagaNoCandidates(event: VagaNoCandidatesEvent) {
    if (!event.coordinatorId) return

    const notification = await this.notificationsService.send({
      userId: event.coordinatorId,
      type: 'vaga_no_candidates',
      title: 'Vaga Sem Candidatos',
      content: `Vaga está próxima do início e não tem candidatos`,
      data: { vagaId: event.vaga.id },
      priority: 'urgent',
      grupoId: event.grupoId,
    })
    this.gateway.emitNotification(notification.userId, notification)
  }

  @OnEvent('candidatura.received')
  async handleCandidaturaReceived(event: CandidaturaReceivedEvent) {
    if (!event.coordinatorId) return

    const notification = await this.notificationsService.send({
      userId: event.coordinatorId,
      type: 'candidatura_received',
      title: 'Nova Candidatura',
      content: `${event.medico.name} se candidatou à vaga`,
      data: { candidaturaId: event.candidatura.id, vagaId: event.vaga.id },
      grupoId: event.grupoId,
    })
    this.gateway.emitNotification(notification.userId, notification)
  }

  @OnEvent('candidatura.approved')
  async handleCandidaturaApproved(event: CandidaturaApprovedEvent) {
    const notification = await this.notificationsService.send({
      userId: event.medico.id,
      type: 'candidatura_approved',
      title: 'Candidatura Aprovada',
      content: `Sua candidatura foi aprovada!`,
      data: { candidaturaId: event.candidatura.id, vagaId: event.vaga.id },
      priority: 'high',
    })
    this.gateway.emitNotification(notification.userId, notification)

    if (event.medico.email) {
      await this.emailProvider.sendNotificationEmail(
        event.medico.email,
        notification.title,
        notification.content,
        `/vagas/${event.vaga.id}`,
      )
    }
  }

  @OnEvent('medico.registered')
  async handleMedicoRegistered(event: MedicoRegisteredEvent) {
    const notification = await this.notificationsService.send({
      userId: event.medico.id,
      type: 'medico_registered',
      title: 'Cadastro Recebido',
      content: `Seu cadastro foi recebido e está em análise`,
      data: { medicoId: event.medico.id },
      grupoId: event.grupoId,
    })
    this.gateway.emitNotification(notification.userId, notification)
  }

  @OnEvent('comunicado.published')
  async handleComunicadoPublished(event: ComunicadoPublishedEvent) {
    await this.notificationsService.sendBulk({
      userIds: event.targetUserIds,
      type: 'comunicado_published',
      title: 'Novo Comunicado',
      content: event.comunicado.titulo,
      data: { comunicadoId: event.comunicado.id },
      priority: 'high',
      grupoId: event.grupoId,
    })
    for (const userId of event.targetUserIds) {
      this.gateway.emitNotification(userId, {
        id: '',
        userId,
        type: 'comunicado_published' as const,
        priority: 'high' as const,
        title: 'Novo Comunicado',
        content: event.comunicado.titulo,
        read: false,
        sentAt: new Date(),
        channels: ['in_app' as const],
        createdAt: new Date(),
      })
    }
  }

  @OnEvent('checkin.reminder')
  async handleCheckinReminder(event: CheckinReminderEvent) {
    const notification = await this.notificationsService.send({
      userId: event.medico.id,
      type: 'checkin_reminder',
      title: 'Lembrete de Check-in',
      content: `Seu plantão começa em breve. Não esqueça de fazer o check-in!`,
      data: { escalaId: event.escala.id },
      priority: 'high',
    })
    this.gateway.emitNotification(notification.userId, notification)

    if (event.medico.email) {
      await this.emailProvider.sendNotificationEmail(
        event.medico.email,
        notification.title,
        notification.content,
        `/escalas/${event.escala.id}`,
      )
    }
  }

  @OnEvent('checkin.late')
  async handleCheckinLate(event: CheckinLateEvent) {
    const notification = await this.notificationsService.send({
      userId: event.medico.id,
      type: 'checkin_late',
      title: 'Check-in Atrasado',
      content: `Médico ${event.medico.name} está ${event.minutesLate} minutos atrasado para o check-in`,
      data: { escalaId: event.escala.id, minutesLate: event.minutesLate },
      priority: 'urgent',
      grupoId: event.grupoId,
    })
    this.gateway.emitNotification(notification.userId, notification)
  }

  @OnEvent('message.received')
  async handleMessageReceived(event: MessageReceivedEvent) {
    const notification = await this.notificationsService.send({
      userId: event.recipient.id,
      type: 'message_received',
      title: 'Nova Mensagem',
      content: `${event.sender.name} enviou uma mensagem`,
      data: { messageId: event.message.id },
    })
    this.gateway.emitNotification(notification.userId, notification)
  }

  @OnEvent('shift_offer.received')
  async handleShiftOfferReceived(event: ShiftOfferReceivedEvent) {
    const notification = await this.notificationsService.send({
      userId: event.medico.id,
      type: 'shift_offer_received',
      title: 'Oferta de Plantão',
      content: `Você recebeu uma oferta de plantão`,
      data: { offerId: event.offer.id, vagaId: event.offer.vagaId },
      priority: 'high',
    })
    this.gateway.emitNotification(notification.userId, notification)

    if (event.medico.email) {
      await this.emailProvider.sendNotificationEmail(
        event.medico.email,
        notification.title,
        notification.content,
        `/vagas/${event.offer.vagaId}`,
      )
    }
  }
}
