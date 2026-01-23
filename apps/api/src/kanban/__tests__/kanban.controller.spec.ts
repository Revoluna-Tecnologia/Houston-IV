import { describe, it, expect, vi, beforeEach } from 'vitest'
import { KanbanController } from '../kanban.controller'
import { KanbanService } from '../kanban.service'

describe('KanbanController', () => {
  let controller: KanbanController
  let service: KanbanService

  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    description: 'Test Description',
    status: 'backlog',
    priority: 'medium',
    createdById: 'user-1',
    assigneeId: 'user-2',
    grupoId: 'grupo-1',
    dueDate: new Date('2024-02-01'),
    tags: [{ id: 'tag-1', name: 'Bug', color: '#FF0000' }],
    links: [{ id: 'link-1', title: 'Docs', url: 'https://docs.example.com' }],
    comments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockTag = {
    id: 'tag-1',
    name: 'Bug',
    color: '#FF0000',
    grupoId: 'grupo-1',
  }

  beforeEach(() => {
    service = {
      createCard: vi.fn(),
      findAllCards: vi.fn(),
      findCardById: vi.fn(),
      updateCard: vi.fn(),
      moveCard: vi.fn(),
      assignCard: vi.fn(),
      deleteCard: vi.fn(),
      addTag: vi.fn(),
      removeTag: vi.fn(),
      getTags: vi.fn(),
      addLink: vi.fn(),
      removeLink: vi.fn(),
      addComment: vi.fn(),
    } as unknown as KanbanService

    controller = new KanbanController(service)
  })

  describe('createCard', () => {
    it('should create a card', async () => {
      const dto = {
        title: 'New Card',
        description: 'Description',
        grupoId: 'grupo-1',
      }

      vi.mocked(service.createCard).mockResolvedValue(mockCard)

      const result = await controller.createCard(dto, 'user-1')

      expect(service.createCard).toHaveBeenCalledWith(dto, 'user-1')
      expect(result).toEqual(mockCard)
    })

    it('should create card with all optional fields', async () => {
      const dto = {
        title: 'New Card',
        description: 'Description',
        grupoId: 'grupo-1',
        priority: 'high',
        dueDate: '2024-02-01',
        assigneeId: 'user-2',
      }

      vi.mocked(service.createCard).mockResolvedValue(mockCard)

      await controller.createCard(dto, 'user-1')

      expect(service.createCard).toHaveBeenCalledWith(dto, 'user-1')
    })
  })

  describe('findAllCards', () => {
    it('should return all cards', async () => {
      vi.mocked(service.findAllCards).mockResolvedValue([mockCard])

      const result = await controller.findAllCards({})

      expect(service.findAllCards).toHaveBeenCalledWith({})
      expect(result).toEqual([mockCard])
    })

    it('should filter by status', async () => {
      const query = { status: 'backlog' }

      vi.mocked(service.findAllCards).mockResolvedValue([mockCard])

      await controller.findAllCards(query)

      expect(service.findAllCards).toHaveBeenCalledWith(query)
    })

    it('should filter by grupoId', async () => {
      const query = { grupoId: 'grupo-1' }

      vi.mocked(service.findAllCards).mockResolvedValue([mockCard])

      await controller.findAllCards(query)

      expect(service.findAllCards).toHaveBeenCalledWith(query)
    })

    it('should filter by assigneeId', async () => {
      const query = { assigneeId: 'user-2' }

      vi.mocked(service.findAllCards).mockResolvedValue([mockCard])

      await controller.findAllCards(query)

      expect(service.findAllCards).toHaveBeenCalledWith(query)
    })

    it('should filter by priority', async () => {
      const query = { priority: 'high' }

      vi.mocked(service.findAllCards).mockResolvedValue([mockCard])

      await controller.findAllCards(query)

      expect(service.findAllCards).toHaveBeenCalledWith(query)
    })
  })

  describe('findCardById', () => {
    it('should return a card by id', async () => {
      vi.mocked(service.findCardById).mockResolvedValue(mockCard)

      const result = await controller.findCardById('card-1')

      expect(service.findCardById).toHaveBeenCalledWith('card-1')
      expect(result).toEqual(mockCard)
    })
  })

  describe('updateCard', () => {
    it('should update a card', async () => {
      const dto = { title: 'Updated Title' }
      const updated = { ...mockCard, title: 'Updated Title' }

      vi.mocked(service.updateCard).mockResolvedValue(updated)

      const result = await controller.updateCard('card-1', dto, 'user-1')

      expect(service.updateCard).toHaveBeenCalledWith('card-1', dto, 'user-1')
      expect(result.title).toBe('Updated Title')
    })

    it('should update card with all fields', async () => {
      const dto = {
        title: 'Updated Title',
        description: 'Updated Description',
        priority: 'urgent',
        dueDate: '2024-03-01',
      }

      vi.mocked(service.updateCard).mockResolvedValue(mockCard)

      await controller.updateCard('card-1', dto, 'user-1')

      expect(service.updateCard).toHaveBeenCalledWith('card-1', dto, 'user-1')
    })
  })

  describe('moveCard', () => {
    it('should move card to new status', async () => {
      const dto = { status: 'in_progress' }
      const moved = { ...mockCard, status: 'in_progress' }

      vi.mocked(service.moveCard).mockResolvedValue(moved)

      const result = await controller.moveCard('card-1', dto, 'user-1')

      expect(service.moveCard).toHaveBeenCalledWith('card-1', 'in_progress', 'user-1')
      expect(result.status).toBe('in_progress')
    })

    it('should move card to done status', async () => {
      const dto = { status: 'done' }

      vi.mocked(service.moveCard).mockResolvedValue({ ...mockCard, status: 'done' })

      await controller.moveCard('card-1', dto, 'user-1')

      expect(service.moveCard).toHaveBeenCalledWith('card-1', 'done', 'user-1')
    })
  })

  describe('assignCard', () => {
    it('should assign card to user', async () => {
      const assigned = { ...mockCard, assigneeId: 'user-3' }

      vi.mocked(service.assignCard).mockResolvedValue(assigned)

      const result = await controller.assignCard('card-1', 'user-3', 'user-1')

      expect(service.assignCard).toHaveBeenCalledWith('card-1', 'user-3', 'user-1')
      expect(result.assigneeId).toBe('user-3')
    })

    it('should unassign card when assigneeId is null', async () => {
      const unassigned = { ...mockCard, assigneeId: null }

      vi.mocked(service.assignCard).mockResolvedValue(unassigned)

      const result = await controller.assignCard('card-1', null, 'user-1')

      expect(service.assignCard).toHaveBeenCalledWith('card-1', null, 'user-1')
      expect(result.assigneeId).toBeNull()
    })
  })

  describe('deleteCard', () => {
    it('should soft delete card by default', async () => {
      vi.mocked(service.deleteCard).mockResolvedValue(undefined)

      await controller.deleteCard('card-1', 'false')

      expect(service.deleteCard).toHaveBeenCalledWith('card-1', false)
    })

    it('should hard delete card when hard=true', async () => {
      vi.mocked(service.deleteCard).mockResolvedValue(undefined)

      await controller.deleteCard('card-1', 'true')

      expect(service.deleteCard).toHaveBeenCalledWith('card-1', true)
    })
  })

  describe('addTag', () => {
    it('should add tag to card', async () => {
      const body = { name: 'Feature', grupoId: 'grupo-1' }
      const cardWithTag = {
        ...mockCard,
        tags: [...mockCard.tags, { id: 'tag-2', name: 'Feature', color: '#00FF00' }],
      }

      vi.mocked(service.addTag).mockResolvedValue(cardWithTag)

      const result = await controller.addTag('card-1', body, 'user-1')

      expect(service.addTag).toHaveBeenCalledWith('card-1', 'Feature', 'grupo-1', 'user-1', undefined)
      expect(result.tags).toHaveLength(2)
    })

    it('should add tag with custom color', async () => {
      const body = { name: 'Priority', grupoId: 'grupo-1', color: '#FF5500' }

      vi.mocked(service.addTag).mockResolvedValue(mockCard)

      await controller.addTag('card-1', body, 'user-1')

      expect(service.addTag).toHaveBeenCalledWith('card-1', 'Priority', 'grupo-1', 'user-1', '#FF5500')
    })
  })

  describe('removeTag', () => {
    it('should remove tag from card', async () => {
      const cardWithoutTag = { ...mockCard, tags: [] }

      vi.mocked(service.removeTag).mockResolvedValue(cardWithoutTag)

      const result = await controller.removeTag('card-1', 'tag-1', 'user-1')

      expect(service.removeTag).toHaveBeenCalledWith('card-1', 'tag-1', 'user-1')
      expect(result.tags).toHaveLength(0)
    })
  })

  describe('getTags', () => {
    it('should return tags for grupo', async () => {
      vi.mocked(service.getTags).mockResolvedValue([mockTag])

      const result = await controller.getTags('grupo-1')

      expect(service.getTags).toHaveBeenCalledWith('grupo-1')
      expect(result).toEqual([mockTag])
    })

    it('should return empty array when no tags', async () => {
      vi.mocked(service.getTags).mockResolvedValue([])

      const result = await controller.getTags('grupo-2')

      expect(result).toEqual([])
    })
  })

  describe('addLink', () => {
    it('should add link to card', async () => {
      const body = { title: 'GitHub', url: 'https://github.com' }
      const cardWithLink = {
        ...mockCard,
        links: [...mockCard.links, { id: 'link-2', title: 'GitHub', url: 'https://github.com' }],
      }

      vi.mocked(service.addLink).mockResolvedValue(cardWithLink)

      const result = await controller.addLink('card-1', body, 'user-1')

      expect(service.addLink).toHaveBeenCalledWith('card-1', 'GitHub', 'https://github.com', 'user-1')
      expect(result.links).toHaveLength(2)
    })
  })

  describe('removeLink', () => {
    it('should remove link from card', async () => {
      const cardWithoutLink = { ...mockCard, links: [] }

      vi.mocked(service.removeLink).mockResolvedValue(cardWithoutLink)

      const result = await controller.removeLink('card-1', 'link-1', 'user-1')

      expect(service.removeLink).toHaveBeenCalledWith('card-1', 'link-1', 'user-1')
      expect(result.links).toHaveLength(0)
    })
  })

  describe('addComment', () => {
    it('should add comment to card', async () => {
      const cardWithComment = {
        ...mockCard,
        comments: [{ id: 'comment-1', content: 'Great progress!', userId: 'user-1' }],
      }

      vi.mocked(service.addComment).mockResolvedValue(cardWithComment)

      const result = await controller.addComment('card-1', 'Great progress!', 'user-1')

      expect(service.addComment).toHaveBeenCalledWith('card-1', 'Great progress!', 'user-1')
      expect(result.comments).toHaveLength(1)
    })
  })
})
