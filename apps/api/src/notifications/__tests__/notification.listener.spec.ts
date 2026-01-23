import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationEventListener } from '../events/notification.listener'
import { NotificationsService } from '../notifications.service'
import { NotificationsGateway } from '../notifications.gateway'
import { ResendProvider } from '../providers/resend.provider'

describe('NotificationEventListener', () => {
  let listener: NotificationEventListener
  let mockService: Partial<NotificationsService>
  let mockGateway: Partial<NotificationsGateway>
  let mockEmailProvider: Partial<ResendProvider>

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    type: 'ticket_created',
    title: 'Test',
    content: 'Test content',
    read: false,
    createdAt: new Date(),
  }

  beforeEach(() => {
    mockService = {
      send: vi.fn().mockResolvedValue(mockNotification),
      sendBulk: vi.fn().mockResolvedValue([mockNotification]),
    }
    mockGateway = {
      emitNotification: vi.fn(),
    }
    mockEmailProvider = {
      sendNotificationEmail: vi.fn().mockResolvedValue(true),
    }

    listener = new NotificationEventListener(
      mockService as NotificationsService,
      mockGateway as NotificationsGateway,
      mockEmailProvider as ResendProvider,
    )
  })

  describe('handleTicketCreated', () => {
    it('should create notification and emit via gateway', async () => {
      const event = {
        ticket: { id: 'ticket-1', title: 'Bug Report', assigneeId: 'user-1' },
        createdBy: { id: 'user-2', name: 'John' },
        grupoId: 'grupo-1',
      }

      await listener.handleTicketCreated(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'ticket_created',
        title: 'Novo Ticket Criado',
        content: 'Ticket "Bug Report" foi criado por John',
        data: { ticketId: 'ticket-1' },
        grupoId: 'grupo-1',
      })
      expect(mockGateway.emitNotification).toHaveBeenCalledWith('user-1', mockNotification)
    })

    it('should use createdBy.id when no assignee', async () => {
      const event = {
        ticket: { id: 'ticket-1', title: 'Bug', assigneeId: null },
        createdBy: { id: 'creator-1', name: 'Jane' },
      }

      await listener.handleTicketCreated(event as any)

      expect(mockService.send).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'creator-1' }),
      )
    })
  })

  describe('handleTicketAssigned', () => {
    it('should create notification and send email', async () => {
      const event = {
        ticket: { id: 'ticket-1', title: 'Task' },
        assignee: { id: 'user-1', email: 'user@test.com' },
      }

      await listener.handleTicketAssigned(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'ticket_assigned',
        title: 'Ticket Atribuído',
        content: 'Você foi atribuído ao ticket "Task"',
        data: { ticketId: 'ticket-1' },
      })
      expect(mockEmailProvider.sendNotificationEmail).toHaveBeenCalledWith(
        'user@test.com',
        'Test',
        'Test content',
        '/tickets/ticket-1',
      )
    })

    it('should not send email when assignee has no email', async () => {
      const event = {
        ticket: { id: 'ticket-1', title: 'Task' },
        assignee: { id: 'user-1', email: null },
      }

      await listener.handleTicketAssigned(event as any)

      expect(mockEmailProvider.sendNotificationEmail).not.toHaveBeenCalled()
    })
  })

  describe('handleTicketStatusChanged', () => {
    it('should create notification with status change details', async () => {
      const event = {
        ticket: { id: 'ticket-1', title: 'Issue', creatorId: 'user-1' },
        oldStatus: 'open',
        newStatus: 'in_progress',
      }

      await listener.handleTicketStatusChanged(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'ticket_status_changed',
        title: 'Status do Ticket Alterado',
        content: 'Ticket "Issue" mudou de open para in_progress',
        data: { ticketId: 'ticket-1', oldStatus: 'open', newStatus: 'in_progress' },
        priority: 'low',
      })
    })
  })

  describe('handleTicketCommentAdded', () => {
    it('should notify all participants except author', async () => {
      const event = {
        ticketId: 'ticket-1',
        comment: { id: 'comment-1' },
        author: { id: 'author-1', name: 'Author' },
        ticketParticipants: [
          { id: 'author-1' },
          { id: 'participant-1' },
          { id: 'participant-2' },
        ],
      }

      await listener.handleTicketCommentAdded(event as any)

      expect(mockService.send).toHaveBeenCalledTimes(2)
      expect(mockService.send).not.toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'author-1' }),
      )
    })
  })

  describe('handleTicketSlaWarning', () => {
    it('should create high priority notification and send email', async () => {
      const event = {
        ticket: {
          id: 'ticket-1',
          title: 'Urgent',
          assigneeId: 'user-1',
          assignee: { email: 'assignee@test.com' },
          creatorId: 'creator-1',
        },
        hoursRemaining: 2,
        grupoId: 'grupo-1',
      }

      await listener.handleTicketSlaWarning(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'ticket_sla_warning',
        title: 'Alerta de SLA',
        content: 'Ticket "Urgent" expira em 2h',
        data: { ticketId: 'ticket-1', hoursRemaining: 2 },
        priority: 'high',
        grupoId: 'grupo-1',
      })
      expect(mockEmailProvider.sendNotificationEmail).toHaveBeenCalled()
    })

    it('should use creatorId when no assignee', async () => {
      const event = {
        ticket: {
          id: 'ticket-1',
          title: 'Urgent',
          assigneeId: null,
          creatorId: 'creator-1',
        },
        hoursRemaining: 1,
      }

      await listener.handleTicketSlaWarning(event as any)

      expect(mockService.send).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'creator-1' }),
      )
    })
  })

  describe('handleTicketSlaBreach', () => {
    it('should create urgent notification', async () => {
      const event = {
        ticket: { id: 'ticket-1', title: 'Breached', assigneeId: 'user-1', creatorId: 'c-1' },
        grupoId: 'grupo-1',
      }

      await listener.handleTicketSlaBreach(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'ticket_sla_breach',
        title: 'SLA Violado',
        content: 'Ticket "Breached" excedeu o prazo de SLA',
        data: { ticketId: 'ticket-1' },
        priority: 'urgent',
        grupoId: 'grupo-1',
      })
    })
  })

  describe('handleVagaCreated', () => {
    it('should notify creator', async () => {
      const event = {
        vaga: { id: 'vaga-1' },
        createdBy: { id: 'user-1' },
        grupoId: 'grupo-1',
      }

      await listener.handleVagaCreated(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'vaga_created',
        title: 'Nova Vaga Criada',
        content: 'Vaga criada com sucesso',
        data: { vagaId: 'vaga-1' },
        grupoId: 'grupo-1',
      })
    })
  })

  describe('handleVagaExpiring', () => {
    it('should notify coordinator when exists', async () => {
      const event = {
        vaga: { id: 'vaga-1' },
        coordinatorId: 'coord-1',
        hoursRemaining: 4,
        grupoId: 'grupo-1',
      }

      await listener.handleVagaExpiring(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'coord-1',
        type: 'vaga_expiring',
        title: 'Vaga Expirando',
        content: 'Vaga expira em 4h e ainda não tem médicos confirmados',
        data: { vagaId: 'vaga-1', hoursRemaining: 4 },
        priority: 'high',
        grupoId: 'grupo-1',
      })
    })

    it('should skip when no coordinator', async () => {
      const event = { vaga: { id: 'vaga-1' }, coordinatorId: null }

      await listener.handleVagaExpiring(event as any)

      expect(mockService.send).not.toHaveBeenCalled()
    })
  })

  describe('handleVagaNoCandidates', () => {
    it('should create urgent notification', async () => {
      const event = {
        vaga: { id: 'vaga-1' },
        coordinatorId: 'coord-1',
        grupoId: 'grupo-1',
      }

      await listener.handleVagaNoCandidates(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'coord-1',
        type: 'vaga_no_candidates',
        title: 'Vaga Sem Candidatos',
        content: 'Vaga está próxima do início e não tem candidatos',
        data: { vagaId: 'vaga-1' },
        priority: 'urgent',
        grupoId: 'grupo-1',
      })
    })

    it('should skip when no coordinator', async () => {
      const event = { vaga: { id: 'vaga-1' }, coordinatorId: null }

      await listener.handleVagaNoCandidates(event as any)

      expect(mockService.send).not.toHaveBeenCalled()
    })
  })

  describe('handleCandidaturaReceived', () => {
    it('should notify coordinator', async () => {
      const event = {
        candidatura: { id: 'cand-1' },
        vaga: { id: 'vaga-1' },
        medico: { name: 'Dr. Smith' },
        coordinatorId: 'coord-1',
        grupoId: 'grupo-1',
      }

      await listener.handleCandidaturaReceived(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'coord-1',
        type: 'candidatura_received',
        title: 'Nova Candidatura',
        content: 'Dr. Smith se candidatou à vaga',
        data: { candidaturaId: 'cand-1', vagaId: 'vaga-1' },
        grupoId: 'grupo-1',
      })
    })

    it('should skip when no coordinator', async () => {
      const event = { coordinatorId: null }

      await listener.handleCandidaturaReceived(event as any)

      expect(mockService.send).not.toHaveBeenCalled()
    })
  })

  describe('handleCandidaturaApproved', () => {
    it('should notify medico and send email', async () => {
      const event = {
        candidatura: { id: 'cand-1' },
        vaga: { id: 'vaga-1' },
        medico: { id: 'medico-1', email: 'medico@test.com' },
      }

      await listener.handleCandidaturaApproved(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'medico-1',
        type: 'candidatura_approved',
        title: 'Candidatura Aprovada',
        content: 'Sua candidatura foi aprovada!',
        data: { candidaturaId: 'cand-1', vagaId: 'vaga-1' },
        priority: 'high',
      })
      expect(mockEmailProvider.sendNotificationEmail).toHaveBeenCalled()
    })
  })

  describe('handleMedicoRegistered', () => {
    it('should notify medico', async () => {
      const event = {
        medico: { id: 'medico-1' },
        grupoId: 'grupo-1',
      }

      await listener.handleMedicoRegistered(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'medico-1',
        type: 'medico_registered',
        title: 'Cadastro Recebido',
        content: 'Seu cadastro foi recebido e está em análise',
        data: { medicoId: 'medico-1' },
        grupoId: 'grupo-1',
      })
    })
  })

  describe('handleComunicadoPublished', () => {
    it('should send bulk notifications and emit to all users', async () => {
      const event = {
        comunicado: { id: 'com-1', titulo: 'Aviso' },
        targetUserIds: ['user-1', 'user-2'],
        grupoId: 'grupo-1',
      }

      await listener.handleComunicadoPublished(event as any)

      expect(mockService.sendBulk).toHaveBeenCalledWith({
        userIds: ['user-1', 'user-2'],
        type: 'comunicado_published',
        title: 'Novo Comunicado',
        content: 'Aviso',
        data: { comunicadoId: 'com-1' },
        priority: 'high',
        grupoId: 'grupo-1',
      })
      expect(mockGateway.emitNotification).toHaveBeenCalledTimes(2)
    })
  })

  describe('handleCheckinReminder', () => {
    it('should notify medico and send email', async () => {
      const event = {
        medico: { id: 'medico-1', email: 'medico@test.com' },
        escala: { id: 'escala-1' },
      }

      await listener.handleCheckinReminder(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'medico-1',
        type: 'checkin_reminder',
        title: 'Lembrete de Check-in',
        content: 'Seu plantão começa em breve. Não esqueça de fazer o check-in!',
        data: { escalaId: 'escala-1' },
        priority: 'high',
      })
      expect(mockEmailProvider.sendNotificationEmail).toHaveBeenCalled()
    })
  })

  describe('handleCheckinLate', () => {
    it('should create urgent notification', async () => {
      const event = {
        medico: { id: 'medico-1', name: 'Dr. Jones' },
        escala: { id: 'escala-1' },
        minutesLate: 15,
        grupoId: 'grupo-1',
      }

      await listener.handleCheckinLate(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'medico-1',
        type: 'checkin_late',
        title: 'Check-in Atrasado',
        content: 'Médico Dr. Jones está 15 minutos atrasado para o check-in',
        data: { escalaId: 'escala-1', minutesLate: 15 },
        priority: 'urgent',
        grupoId: 'grupo-1',
      })
    })
  })

  describe('handleMessageReceived', () => {
    it('should notify recipient', async () => {
      const event = {
        message: { id: 'msg-1' },
        sender: { name: 'Sender' },
        recipient: { id: 'recipient-1' },
      }

      await listener.handleMessageReceived(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'recipient-1',
        type: 'message_received',
        title: 'Nova Mensagem',
        content: 'Sender enviou uma mensagem',
        data: { messageId: 'msg-1' },
      })
    })
  })

  describe('handleShiftOfferReceived', () => {
    it('should notify medico and send email', async () => {
      const event = {
        medico: { id: 'medico-1', email: 'medico@test.com' },
        offer: { id: 'offer-1', vagaId: 'vaga-1' },
      }

      await listener.handleShiftOfferReceived(event as any)

      expect(mockService.send).toHaveBeenCalledWith({
        userId: 'medico-1',
        type: 'shift_offer_received',
        title: 'Oferta de Plantão',
        content: 'Você recebeu uma oferta de plantão',
        data: { offerId: 'offer-1', vagaId: 'vaga-1' },
        priority: 'high',
      })
      expect(mockEmailProvider.sendNotificationEmail).toHaveBeenCalled()
    })

    it('should not send email when medico has no email', async () => {
      const event = {
        medico: { id: 'medico-1', email: null },
        offer: { id: 'offer-1', vagaId: 'vaga-1' },
      }

      await listener.handleShiftOfferReceived(event as any)

      expect(mockEmailProvider.sendNotificationEmail).not.toHaveBeenCalled()
    })
  })
})
