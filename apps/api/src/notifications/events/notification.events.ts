export class TicketCreatedEvent {
  constructor(
    public readonly ticket: {
      id: string
      title: string
      assigneeId?: string | null
      creatorId: string
      assignee?: { id: string; name: string; email: string }
    },
    public readonly createdBy: { id: string; name: string },
    public readonly grupoId: string,
  ) {}
}

export class TicketAssignedEvent {
  constructor(
    public readonly ticket: { id: string; title: string },
    public readonly assignee: { id: string; name: string; email: string },
    public readonly assignedBy: { id: string; name: string },
  ) {}
}

export class TicketStatusChangedEvent {
  constructor(
    public readonly ticket: { id: string; title: string; creatorId: string },
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly changedBy: { id: string; name: string },
  ) {}
}

export class TicketCommentAddedEvent {
  constructor(
    public readonly ticketId: string,
    public readonly comment: { id: string; content: string },
    public readonly author: { id: string; name: string },
    public readonly ticketParticipants: Array<{ id: string; name: string; email: string }>,
  ) {}
}

export class TicketSlaWarningEvent {
  constructor(
    public readonly ticket: {
      id: string
      title: string
      assigneeId?: string | null
      creatorId: string
      assignee?: { id: string; name: string; email: string }
    },
    public readonly hoursRemaining: number,
    public readonly grupoId: string,
  ) {}
}

export class TicketSlaBreachEvent {
  constructor(
    public readonly ticket: {
      id: string
      title: string
      assigneeId?: string | null
      creatorId: string
      assignee?: { id: string; name: string; email: string }
    },
    public readonly grupoId: string,
  ) {}
}

export class VagaCreatedEvent {
  constructor(
    public readonly vaga: { id: string },
    public readonly createdBy: { id: string; name: string },
    public readonly grupoId: string,
  ) {}
}

export class VagaExpiringEvent {
  constructor(
    public readonly vaga: { id: string },
    public readonly hoursRemaining: number,
    public readonly grupoId: string,
    public readonly coordinatorId?: string,
  ) {}
}

export class VagaNoCandidatesEvent {
  constructor(
    public readonly vaga: { id: string },
    public readonly grupoId: string,
    public readonly coordinatorId?: string,
  ) {}
}

export class CandidaturaReceivedEvent {
  constructor(
    public readonly candidatura: { id: string },
    public readonly vaga: { id: string },
    public readonly medico: { id: string; name: string },
    public readonly grupoId: string,
    public readonly coordinatorId?: string,
  ) {}
}

export class CandidaturaApprovedEvent {
  constructor(
    public readonly candidatura: { id: string },
    public readonly vaga: { id: string },
    public readonly medico: { id: string; name: string; email: string },
  ) {}
}

export class CandidaturaRejectedEvent {
  constructor(
    public readonly candidatura: { id: string },
    public readonly vaga: { id: string },
    public readonly medico: { id: string; name: string; email: string },
    public readonly reason?: string,
  ) {}
}

export class MedicoRegisteredEvent {
  constructor(
    public readonly medico: { id: string; name: string },
    public readonly grupoId: string,
  ) {}
}

export class MedicoApprovedEvent {
  constructor(
    public readonly medico: { id: string; name: string; email: string },
  ) {}
}

export class ComunicadoPublishedEvent {
  constructor(
    public readonly comunicado: { id: string; titulo: string },
    public readonly grupoId: string,
    public readonly targetUserIds: string[],
  ) {}
}

export class CheckinReminderEvent {
  constructor(
    public readonly escala: { id: string; data: Date; medicoId: string },
    public readonly medico: { id: string; name: string; email: string },
  ) {}
}

export class CheckoutReminderEvent {
  constructor(
    public readonly checkin: { id: string },
    public readonly medico: { id: string; name: string; email: string },
  ) {}
}

export class CheckinLateEvent {
  constructor(
    public readonly escala: { id: string; data: Date; medicoId: string },
    public readonly medico: { id: string; name: string },
    public readonly grupoId: string,
    public readonly minutesLate: number,
  ) {}
}

export class CheckoutLateEvent {
  constructor(
    public readonly checkin: { id: string },
    public readonly medico: { id: string; name: string },
    public readonly grupoId: string,
    public readonly minutesLate: number,
  ) {}
}

export class MessageReceivedEvent {
  constructor(
    public readonly message: { id: string; content: string },
    public readonly sender: { id: string; name: string },
    public readonly recipient: { id: string; name: string; email: string },
  ) {}
}

export class ShiftOfferReceivedEvent {
  constructor(
    public readonly offer: { id: string; vagaId: string },
    public readonly medico: { id: string; name: string; email: string },
  ) {}
}

export class ShiftOfferResponseEvent {
  constructor(
    public readonly offer: { id: string; vagaId: string },
    public readonly medico: { id: string; name: string },
    public readonly accepted: boolean,
    public readonly grupoId: string,
  ) {}
}
