import { describe, it, expect, beforeEach, vi } from 'vitest'
import { KanbanService } from '../kanban.service'
import { KanbanRepository } from '../kanban.repository'
import { NotFoundException } from '@nestjs/common'
import {
  createKanbanCardFixture,
  createKanbanCardWithRelationsFixture,
  createKanbanCardListFixture,
  createKanbanTagFixture,
  createKanbanTimelineFixture,
} from '../../__tests__/fixtures/kanban.fixture'

describe('KanbanService', () => {
  let service: KanbanService
  let repository: KanbanRepository

  const mockRepository = {
    createCard: vi.fn(),
    findAllCards: vi.fn(),
    findCardById: vi.fn(),
    updateCard: vi.fn(),
    softDeleteCard: vi.fn(),
    hardDeleteCard: vi.fn(),
    addTimeline: vi.fn(),
    findOrCreateTag: vi.fn(),
    addTagToCard: vi.fn(),
    removeTagFromCard: vi.fn(),
    findTagsByGrupo: vi.fn(),
    addLink: vi.fn(),
    removeLink: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    repository = mockRepository as unknown as KanbanRepository
    service = new KanbanService(repository)
  })

  describe('createCard', () => {
    it('should create a card with timeline entry', async () => {
      const card = createKanbanCardFixture()
      const cardWithRelations = createKanbanCardWithRelationsFixture()
      mockRepository.createCard.mockResolvedValue(card)
      mockRepository.addTimeline.mockResolvedValue(createKanbanTimelineFixture())
      mockRepository.findCardById.mockResolvedValue(cardWithRelations)

      const result = await service.createCard(
        {
          title: 'Task nova',
          status: 'backlog',
          tab: 'projetos',
          grupoId: 'grupo-1',
        },
        'user-1'
      )

      expect(result.id).toBe(cardWithRelations.id)
      expect(mockRepository.addTimeline).toHaveBeenCalledWith(
        card.id,
        'create',
        'user-1',
        'Card criado'
      )
    })
  })

  describe('findAllCards', () => {
    it('should return all cards', async () => {
      const cards = createKanbanCardListFixture()
      mockRepository.findAllCards.mockResolvedValue(cards)

      const result = await service.findAllCards({})

      expect(result).toHaveLength(3)
    })
  })

  describe('findCardById', () => {
    it('should return card by id', async () => {
      const card = createKanbanCardWithRelationsFixture()
      mockRepository.findCardById.mockResolvedValue(card)

      const result = await service.findCardById('card-1')

      expect(result.id).toBe(card.id)
      expect(result.tags).toHaveLength(1)
      expect(result.links).toHaveLength(1)
    })

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findCardById.mockResolvedValue(null)

      await expect(service.findCardById('non-existent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('moveCard', () => {
    it('should move card to new status', async () => {
      const existing = createKanbanCardWithRelationsFixture({ status: 'backlog' })
      const updated = createKanbanCardWithRelationsFixture({ status: 'in_progress' })
      mockRepository.findCardById.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated)
      mockRepository.updateCard.mockResolvedValue(createKanbanCardFixture({ status: 'in_progress' }))
      mockRepository.addTimeline.mockResolvedValue(createKanbanTimelineFixture({ type: 'move' }))

      const result = await service.moveCard('card-1', 'in_progress', 'user-1')

      expect(result.status).toBe('in_progress')
      expect(mockRepository.addTimeline).toHaveBeenCalledWith(
        'card-1',
        'move',
        'user-1',
        'Movido de backlog para in_progress',
        { from: 'backlog', to: 'in_progress' }
      )
    })
  })

  describe('assignCard', () => {
    it('should assign card to user', async () => {
      const existing = createKanbanCardWithRelationsFixture()
      const updated = createKanbanCardWithRelationsFixture({ assigneeId: 'user-2' })
      mockRepository.findCardById.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated)
      mockRepository.updateCard.mockResolvedValue(createKanbanCardFixture({ assigneeId: 'user-2' }))
      mockRepository.addTimeline.mockResolvedValue(createKanbanTimelineFixture({ type: 'assign' }))

      const result = await service.assignCard('card-1', 'user-2', 'user-1')

      expect(result.assigneeId).toBe('user-2')
      expect(mockRepository.addTimeline).toHaveBeenCalledWith(
        'card-1',
        'assign',
        'user-1',
        'Card atribuido',
        { assigneeId: 'user-2' }
      )
    })

    it('should unassign card', async () => {
      const existing = createKanbanCardWithRelationsFixture({ assigneeId: 'user-2' })
      const updated = createKanbanCardWithRelationsFixture({ assigneeId: null })
      mockRepository.findCardById.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated)
      mockRepository.updateCard.mockResolvedValue(createKanbanCardFixture({ assigneeId: null }))
      mockRepository.addTimeline.mockResolvedValue(createKanbanTimelineFixture({ type: 'assign' }))

      const result = await service.assignCard('card-1', null, 'user-1')

      expect(result.assigneeId).toBeNull()
    })
  })

  describe('deleteCard', () => {
    it('should soft delete card', async () => {
      const card = createKanbanCardWithRelationsFixture()
      mockRepository.findCardById.mockResolvedValue(card)
      mockRepository.softDeleteCard.mockResolvedValue(undefined)

      await service.deleteCard('card-1')

      expect(mockRepository.softDeleteCard).toHaveBeenCalledWith('card-1')
      expect(mockRepository.hardDeleteCard).not.toHaveBeenCalled()
    })

    it('should hard delete card when specified', async () => {
      const card = createKanbanCardWithRelationsFixture()
      mockRepository.findCardById.mockResolvedValue(card)
      mockRepository.hardDeleteCard.mockResolvedValue(undefined)

      await service.deleteCard('card-1', true)

      expect(mockRepository.hardDeleteCard).toHaveBeenCalledWith('card-1')
      expect(mockRepository.softDeleteCard).not.toHaveBeenCalled()
    })
  })

  describe('addTag', () => {
    it('should add tag to card', async () => {
      const card = createKanbanCardWithRelationsFixture()
      const tag = createKanbanTagFixture()
      mockRepository.findCardById.mockResolvedValue(card)
      mockRepository.findOrCreateTag.mockResolvedValue(tag)
      mockRepository.addTagToCard.mockResolvedValue(undefined)
      mockRepository.addTimeline.mockResolvedValue(createKanbanTimelineFixture({ type: 'tag' }))

      const result = await service.addTag('card-1', 'Frontend', 'grupo-1', 'user-1')

      expect(result).toBeDefined()
      expect(mockRepository.findOrCreateTag).toHaveBeenCalledWith(
        'grupo-1',
        'Frontend',
        'user-1',
        undefined
      )
      expect(mockRepository.addTagToCard).toHaveBeenCalledWith('card-1', tag.id)
    })
  })

  describe('addComment', () => {
    it('should add comment to card timeline', async () => {
      const card = createKanbanCardWithRelationsFixture()
      mockRepository.findCardById.mockResolvedValue(card)
      mockRepository.addTimeline.mockResolvedValue(createKanbanTimelineFixture({ type: 'comment' }))

      const result = await service.addComment('card-1', 'Este card precisa de revisao', 'user-1')

      expect(result).toBeDefined()
      expect(mockRepository.addTimeline).toHaveBeenCalledWith(
        'card-1',
        'comment',
        'user-1',
        'Este card precisa de revisao'
      )
    })
  })

  describe('getTags', () => {
    it('should return tags for grupo', async () => {
      const tags = [createKanbanTagFixture(), createKanbanTagFixture({ id: 'tag-2', name: 'Backend' })]
      mockRepository.findTagsByGrupo.mockResolvedValue(tags)

      const result = await service.getTags('grupo-1')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Frontend')
    })
  })
})
