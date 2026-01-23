import { describe, it, expect, beforeEach, vi } from 'vitest'
import { KanbanRepository } from '../kanban.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { createMockPrisma, MockPrismaClient } from '../../__tests__/mocks/prisma.mock'
import {
  createKanbanCardFixture,
  createKanbanCardWithRelationsFixture,
  createKanbanCardListFixture,
  createKanbanTagFixture,
  createKanbanTimelineFixture,
} from '../../__tests__/fixtures/kanban.fixture'

describe('KanbanRepository', () => {
  let repository: KanbanRepository
  let mockPrisma: MockPrismaClient

  beforeEach(() => {
    mockPrisma = createMockPrisma()
    repository = new KanbanRepository(mockPrisma as unknown as PrismaService)
    vi.clearAllMocks()
  })

  describe('createCard', () => {
    it('should create a card', async () => {
      const card = createKanbanCardFixture()
      mockPrisma.kanbanCard.create.mockResolvedValue(card)

      const result = await repository.createCard(
        {
          title: 'Task nova',
          status: 'backlog',
          tab: 'projetos',
          grupoId: 'grupo-1',
        },
        'user-1'
      )

      expect(result).toEqual(card)
      expect(mockPrisma.kanbanCard.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Task nova',
          status: 'backlog',
          tab: 'projetos',
          grupoId: 'grupo-1',
          createdById: 'user-1',
        }),
      })
    })
  })

  describe('findAllCards', () => {
    it('should return all cards with relations', async () => {
      const cards = createKanbanCardListFixture()
      mockPrisma.kanbanCard.findMany.mockResolvedValue(cards as never)

      const result = await repository.findAllCards({})

      expect(result).toHaveLength(3)
      expect(mockPrisma.kanbanCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            tags: expect.any(Object),
            links: true,
            timeline: expect.any(Object),
          }),
        })
      )
    })

    it('should filter by tab', async () => {
      mockPrisma.kanbanCard.findMany.mockResolvedValue([])

      await repository.findAllCards({ tab: 'projetos' })

      expect(mockPrisma.kanbanCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tab: 'projetos' }),
        })
      )
    })

    it('should filter by status', async () => {
      mockPrisma.kanbanCard.findMany.mockResolvedValue([])

      await repository.findAllCards({ status: 'in_progress' })

      expect(mockPrisma.kanbanCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'in_progress' }),
        })
      )
    })

    it('should exclude deleted by default', async () => {
      mockPrisma.kanbanCard.findMany.mockResolvedValue([])

      await repository.findAllCards({})

      expect(mockPrisma.kanbanCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        })
      )
    })
  })

  describe('findCardById', () => {
    it('should return card with relations', async () => {
      const card = createKanbanCardWithRelationsFixture()
      mockPrisma.kanbanCard.findUnique.mockResolvedValue(card as never)

      const result = await repository.findCardById('card-1')

      expect(result).toEqual(card)
      expect(mockPrisma.kanbanCard.findUnique).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        include: expect.any(Object),
      })
    })

    it('should return null if not found', async () => {
      mockPrisma.kanbanCard.findUnique.mockResolvedValue(null)

      const result = await repository.findCardById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('updateCard', () => {
    it('should update card', async () => {
      const card = createKanbanCardFixture({ status: 'in_progress' })
      mockPrisma.kanbanCard.update.mockResolvedValue(card)

      const result = await repository.updateCard('card-1', { status: 'in_progress' })

      expect(result).toEqual(card)
      expect(mockPrisma.kanbanCard.update).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        data: { status: 'in_progress' },
      })
    })
  })

  describe('softDeleteCard', () => {
    it('should soft delete card', async () => {
      mockPrisma.kanbanCard.update.mockResolvedValue(createKanbanCardFixture({ deletedAt: new Date() }))

      await repository.softDeleteCard('card-1')

      expect(mockPrisma.kanbanCard.update).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        data: { deletedAt: expect.any(Date) },
      })
    })
  })

  describe('addTimeline', () => {
    it('should add timeline entry', async () => {
      const timeline = createKanbanTimelineFixture()
      mockPrisma.kanbanTimeline.create.mockResolvedValue(timeline)

      const result = await repository.addTimeline('card-1', 'move', 'user-1', 'Movido para in_progress')

      expect(result).toEqual(timeline)
      expect(mockPrisma.kanbanTimeline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cardId: 'card-1',
          type: 'move',
          authorId: 'user-1',
          content: 'Movido para in_progress',
        }),
      })
    })
  })

  describe('findOrCreateTag', () => {
    it('should return existing tag', async () => {
      const tag = createKanbanTagFixture()
      mockPrisma.kanbanTag.findUnique.mockResolvedValue(tag)

      const result = await repository.findOrCreateTag('grupo-1', 'Frontend', 'user-1')

      expect(result).toEqual(tag)
      expect(mockPrisma.kanbanTag.create).not.toHaveBeenCalled()
    })

    it('should create new tag if not exists', async () => {
      const tag = createKanbanTagFixture()
      mockPrisma.kanbanTag.findUnique.mockResolvedValue(null)
      mockPrisma.kanbanTag.create.mockResolvedValue(tag)

      const result = await repository.findOrCreateTag('grupo-1', 'Frontend', 'user-1', '#FF0000')

      expect(result).toEqual(tag)
      expect(mockPrisma.kanbanTag.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Frontend',
          color: '#FF0000',
          grupoId: 'grupo-1',
          createdBy: 'user-1',
        }),
      })
    })
  })

  describe('addTagToCard', () => {
    it('should add tag to card', async () => {
      mockPrisma.kanbanCardTag.upsert.mockResolvedValue({} as never)

      await repository.addTagToCard('card-1', 'tag-1')

      expect(mockPrisma.kanbanCardTag.upsert).toHaveBeenCalledWith({
        where: { cardId_tagId: { cardId: 'card-1', tagId: 'tag-1' } },
        create: { cardId: 'card-1', tagId: 'tag-1' },
        update: {},
      })
    })
  })
})
