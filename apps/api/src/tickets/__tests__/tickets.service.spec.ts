import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TicketsService } from '../tickets.service'
import { TicketsRepository } from '../tickets.repository'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { createTicketFixture, createTicketListFixture } from '../../__tests__/fixtures/ticket.fixture'

describe('TicketsService', () => {
  let service: TicketsService
  let repository: TicketsRepository

  const mockRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByIdWithCounts: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    repository = mockRepository as unknown as TicketsRepository
    service = new TicketsService(repository)
  })

  describe('create', () => {
    it('should create a ticket', async () => {
      const ticket = createTicketFixture()
      mockRepository.create.mockResolvedValue(ticket)

      const result = await service.create(
        {
          title: 'Bug no login',
          description: 'Descricao do bug',
          priority: 'high',
          category: 'functionality',
          grupoId: 'grupo-1',
        },
        'user-1'
      )

      expect(result.id).toBe(ticket.id)
      expect(result.title).toBe(ticket.title)
      expect(mockRepository.create).toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    it('should return paginated tickets', async () => {
      const tickets = createTicketListFixture()
      mockRepository.findAll.mockResolvedValue({
        data: tickets,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      })

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(3)
      expect(result.meta.total).toBe(3)
    })
  })

  describe('findOne', () => {
    it('should return ticket by id', async () => {
      const ticket = { ...createTicketFixture(), _count: { comments: 2, attachments: 1 } }
      mockRepository.findByIdWithCounts.mockResolvedValue(ticket)

      const result = await service.findOne('ticket-1')

      expect(result.id).toBe(ticket.id)
      expect(result.commentsCount).toBe(2)
      expect(result.attachmentsCount).toBe(1)
    })

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findByIdWithCounts.mockResolvedValue(null)

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update ticket', async () => {
      const existing = createTicketFixture()
      const updated = createTicketFixture({ title: 'Titulo atualizado' })
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.update.mockResolvedValue(updated)

      const result = await service.update('ticket-1', { title: 'Titulo atualizado' }, 'user-1')

      expect(result.title).toBe('Titulo atualizado')
    })

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        service.update('non-existent', { title: 'Novo titulo' }, 'user-1')
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateStatus', () => {
    it('should update status with valid transition', async () => {
      const existing = createTicketFixture({ status: 'open' })
      const updated = createTicketFixture({ status: 'in_progress' })
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.update.mockResolvedValue(updated)

      const result = await service.updateStatus('ticket-1', 'in_progress')

      expect(result.status).toBe('in_progress')
    })

    it('should throw BadRequestException for invalid transition', async () => {
      const existing = createTicketFixture({ status: 'closed' })
      mockRepository.findById.mockResolvedValue(existing)

      await expect(service.updateStatus('ticket-1', 'in_progress')).rejects.toThrow(BadRequestException)
    })

    it('should set resolvedAt when status changes to resolved', async () => {
      const existing = createTicketFixture({ status: 'in_progress' })
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.update.mockResolvedValue(createTicketFixture({ status: 'resolved' }))

      await service.updateStatus('ticket-1', 'resolved')

      expect(mockRepository.update).toHaveBeenCalledWith(
        'ticket-1',
        expect.objectContaining({
          status: 'resolved',
          resolvedAt: expect.any(Date),
        })
      )
    })

    it('should set closedAt when status changes to closed', async () => {
      const existing = createTicketFixture({ status: 'resolved' })
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.update.mockResolvedValue(createTicketFixture({ status: 'closed' }))

      await service.updateStatus('ticket-1', 'closed')

      expect(mockRepository.update).toHaveBeenCalledWith(
        'ticket-1',
        expect.objectContaining({
          status: 'closed',
          closedAt: expect.any(Date),
        })
      )
    })
  })

  describe('assign', () => {
    it('should assign ticket to user', async () => {
      const existing = createTicketFixture()
      const updated = createTicketFixture({ assignedToId: 'user-2' })
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.update.mockResolvedValue(updated)

      const result = await service.assign('ticket-1', 'user-2')

      expect(result.assignedToId).toBe('user-2')
    })

    it('should unassign ticket', async () => {
      const existing = createTicketFixture({ assignedToId: 'user-2' })
      const updated = createTicketFixture({ assignedToId: null })
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.update.mockResolvedValue(updated)

      const result = await service.assign('ticket-1', null)

      expect(result.assignedToId).toBeNull()
    })
  })

  describe('archive', () => {
    it('should archive ticket', async () => {
      const existing = createTicketFixture()
      const updated = createTicketFixture({ archived: true })
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.update.mockResolvedValue(updated)

      const result = await service.archive('ticket-1', true)

      expect(result.archived).toBe(true)
    })
  })

  describe('remove', () => {
    it('should remove ticket', async () => {
      mockRepository.findById.mockResolvedValue(createTicketFixture())
      mockRepository.delete.mockResolvedValue(undefined)

      await service.remove('ticket-1')

      expect(mockRepository.delete).toHaveBeenCalledWith('ticket-1')
    })

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException)
    })
  })
})
