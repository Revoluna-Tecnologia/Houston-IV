import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TicketsRepository } from '../tickets.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { createMockPrisma, MockPrismaClient } from '../../__tests__/mocks/prisma.mock'
import { createTicketFixture, createTicketListFixture } from '../../__tests__/fixtures/ticket.fixture'

describe('TicketsRepository', () => {
  let repository: TicketsRepository
  let mockPrisma: MockPrismaClient

  beforeEach(() => {
    mockPrisma = createMockPrisma()
    repository = new TicketsRepository(mockPrisma as unknown as PrismaService)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a ticket', async () => {
      const ticket = createTicketFixture()
      mockPrisma.ticket.create.mockResolvedValue(ticket)

      const result = await repository.create(
        {
          title: 'Bug no login',
          description: 'Descricao do bug',
          priority: 'high',
          category: 'functionality',
          grupoId: 'grupo-1',
        },
        'user-1'
      )

      expect(result).toEqual(ticket)
      expect(mockPrisma.ticket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Bug no login',
          description: 'Descricao do bug',
          priority: 'high',
          category: 'functionality',
          grupoId: 'grupo-1',
          createdById: 'user-1',
        }),
      })
    })
  })

  describe('findAll', () => {
    it('should return paginated tickets', async () => {
      const tickets = createTicketListFixture()
      mockPrisma.ticket.findMany.mockResolvedValue(tickets)
      mockPrisma.ticket.count.mockResolvedValue(3)

      const result = await repository.findAll({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(3)
      expect(result.meta.total).toBe(3)
      expect(result.meta.page).toBe(1)
      expect(result.meta.totalPages).toBe(1)
    })

    it('should filter by status', async () => {
      const tickets = [createTicketFixture({ status: 'open' })]
      mockPrisma.ticket.findMany.mockResolvedValue(tickets)
      mockPrisma.ticket.count.mockResolvedValue(1)

      await repository.findAll({ status: 'open' })

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'open' }),
        })
      )
    })

    it('should filter by priority', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([])
      mockPrisma.ticket.count.mockResolvedValue(0)

      await repository.findAll({ priority: 'critical' })

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: 'critical' }),
        })
      )
    })

    it('should search by title and description', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([])
      mockPrisma.ticket.count.mockResolvedValue(0)

      await repository.findAll({ search: 'login' })

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'login', mode: 'insensitive' } },
              { description: { contains: 'login', mode: 'insensitive' } },
            ],
          }),
        })
      )
    })
  })

  describe('findById', () => {
    it('should return ticket by id', async () => {
      const ticket = createTicketFixture()
      mockPrisma.ticket.findUnique.mockResolvedValue(ticket)

      const result = await repository.findById('ticket-1')

      expect(result).toEqual(ticket)
      expect(mockPrisma.ticket.findUnique).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
      })
    })

    it('should return null if not found', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(null)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update ticket', async () => {
      const ticket = createTicketFixture({ status: 'in_progress' })
      mockPrisma.ticket.update.mockResolvedValue(ticket)

      const result = await repository.update('ticket-1', { status: 'in_progress' })

      expect(result).toEqual(ticket)
      expect(mockPrisma.ticket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: { status: 'in_progress' },
      })
    })
  })

  describe('delete', () => {
    it('should delete ticket', async () => {
      mockPrisma.ticket.delete.mockResolvedValue(createTicketFixture())

      await repository.delete('ticket-1')

      expect(mockPrisma.ticket.delete).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
      })
    })
  })

  describe('countByStatus', () => {
    it('should return count by status', async () => {
      mockPrisma.ticket.groupBy.mockResolvedValue([
        { status: 'open', _count: { status: 5 } },
        { status: 'in_progress', _count: { status: 3 } },
        { status: 'closed', _count: { status: 10 } },
      ] as never)

      const result = await repository.countByStatus()

      expect(result).toEqual({
        open: 5,
        in_progress: 3,
        closed: 10,
      })
    })
  })
})
