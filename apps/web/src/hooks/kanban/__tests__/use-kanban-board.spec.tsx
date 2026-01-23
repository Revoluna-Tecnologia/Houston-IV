import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useKanbanBoard } from '../use-kanban-board'
import { kanbanService } from '../../../services/kanban'
import type { KanbanCard, KanbanTag } from '../../../services/kanban'

vi.mock('../../../services/kanban', () => ({
  kanbanService: {
    getCards: vi.fn(),
    getTags: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
    moveCard: vi.fn(),
    assignCard: vi.fn(),
    deleteCard: vi.fn(),
    addTag: vi.fn(),
    removeTag: vi.fn(),
    addLink: vi.fn(),
    removeLink: vi.fn(),
    addComment: vi.fn(),
  },
}))

const mockCards: KanbanCard[] = [
  {
    id: 'card-1',
    title: 'Test Card 1',
    description: 'Description 1',
    status: 'todo',
    tab: 'projetos',
    grupoId: 'grupo-1',
    createdById: 'user-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    tags: [],
    links: [],
    timeline: [],
  },
  {
    id: 'card-2',
    title: 'Test Card 2',
    description: 'Description 2',
    status: 'in_progress',
    tab: 'projetos',
    grupoId: 'grupo-1',
    createdById: 'user-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    tags: [],
    links: [],
    timeline: [],
  },
]

const mockTags: KanbanTag[] = [
  { id: 'tag-1', name: 'Bug', color: '#ff0000', grupoId: 'grupo-1' },
  { id: 'tag-2', name: 'Feature', color: '#00ff00', grupoId: 'grupo-1' },
]

describe('useKanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(kanbanService.getCards).mockResolvedValue(mockCards)
    vi.mocked(kanbanService.getTags).mockResolvedValue(mockTags)
  })

  describe('initial fetch', () => {
    it('should fetch cards on mount', async () => {
      const { result } = renderHook(() => useKanbanBoard())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(kanbanService.getCards).toHaveBeenCalled()
      expect(result.current.cards).toEqual(mockCards)
    })

    it('should fetch tags when grupoId is provided', async () => {
      const { result } = renderHook(() => useKanbanBoard({ grupoId: 'grupo-1' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(kanbanService.getTags).toHaveBeenCalledWith('grupo-1')
      expect(result.current.tags).toEqual(mockTags)
    })

    it('should not fetch tags without grupoId', async () => {
      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(kanbanService.getTags).not.toHaveBeenCalled()
      expect(result.current.tags).toEqual([])
    })

    it('should handle fetch error', async () => {
      const error = new Error('Network error')
      vi.mocked(kanbanService.getCards).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.cards).toEqual([])
    })
  })

  describe('createCard', () => {
    it('should create a new card and refetch', async () => {
      const newCard: KanbanCard = {
        id: 'card-3',
        title: 'New Card',
        description: '',
        status: 'todo',
        tab: 'projetos',
        grupoId: 'grupo-1',
        createdById: 'user-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        tags: [],
        links: [],
        timeline: [],
      }
      vi.mocked(kanbanService.createCard).mockResolvedValue(newCard)

      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const createData = { title: 'New Card', grupoId: 'grupo-1', tab: 'projetos' as const }
      let created: KanbanCard | undefined
      await act(async () => {
        created = await result.current.createCard(createData)
      })

      expect(created).toEqual(newCard)
      expect(kanbanService.createCard).toHaveBeenCalledWith(createData)
    })
  })

  describe('updateCard', () => {
    it('should update a card', async () => {
      const updatedCard = { ...mockCards[0], title: 'Updated Title' }
      vi.mocked(kanbanService.updateCard).mockResolvedValue(updatedCard)

      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let updated: KanbanCard | undefined
      await act(async () => {
        updated = await result.current.updateCard('card-1', { title: 'Updated Title' })
      })

      expect(updated).toEqual(updatedCard)
      expect(kanbanService.updateCard).toHaveBeenCalledWith('card-1', { title: 'Updated Title' })
    })
  })

  describe('moveCard', () => {
    it('should move a card to a new status', async () => {
      const movedCard = { ...mockCards[0], status: 'done' }
      vi.mocked(kanbanService.moveCard).mockResolvedValue(movedCard)

      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.moveCard('card-1', 'done')
      })

      expect(kanbanService.moveCard).toHaveBeenCalledWith('card-1', 'done')
      expect(result.current.cards.find((c) => c.id === 'card-1')?.status).toBe('done')
    })
  })

  describe('assignCard', () => {
    it('should assign a card to a user', async () => {
      const assignedCard = { ...mockCards[0], assigneeId: 'user-2' }
      vi.mocked(kanbanService.assignCard).mockResolvedValue(assignedCard)

      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.assignCard('card-1', 'user-2')
      })

      expect(kanbanService.assignCard).toHaveBeenCalledWith('card-1', 'user-2')
      expect(result.current.cards.find((c) => c.id === 'card-1')?.assigneeId).toBe('user-2')
    })
  })

  describe('deleteCard', () => {
    it('should delete a card', async () => {
      vi.mocked(kanbanService.deleteCard).mockResolvedValue(undefined)

      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.cards).toHaveLength(2)

      await act(async () => {
        await result.current.deleteCard('card-1')
      })

      expect(kanbanService.deleteCard).toHaveBeenCalledWith('card-1', undefined)
      expect(result.current.cards).toHaveLength(1)
      expect(result.current.cards.find((c) => c.id === 'card-1')).toBeUndefined()
    })

    it('should hard delete a card', async () => {
      vi.mocked(kanbanService.deleteCard).mockResolvedValue(undefined)

      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deleteCard('card-1', true)
      })

      expect(kanbanService.deleteCard).toHaveBeenCalledWith('card-1', true)
    })
  })

  describe('addTag', () => {
    it('should add a tag to a card', async () => {
      const cardWithTag = { ...mockCards[0], tags: [mockTags[0]] }
      vi.mocked(kanbanService.addTag).mockResolvedValue(cardWithTag)

      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.addTag('card-1', 'Bug', 'grupo-1', '#ff0000')
      })

      expect(kanbanService.addTag).toHaveBeenCalledWith('card-1', 'Bug', 'grupo-1', '#ff0000')
    })
  })

  describe('removeTag', () => {
    it('should remove a tag from a card', async () => {
      vi.mocked(kanbanService.removeTag).mockResolvedValue(mockCards[0])

      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.removeTag('card-1', 'tag-1')
      })

      expect(kanbanService.removeTag).toHaveBeenCalledWith('card-1', 'tag-1')
    })
  })

  describe('addLink', () => {
    it('should add a link to a card', async () => {
      vi.mocked(kanbanService.addLink).mockResolvedValue(mockCards[0])

      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.addLink('card-1', 'Docs', 'https://docs.example.com')
      })

      expect(kanbanService.addLink).toHaveBeenCalledWith('card-1', 'Docs', 'https://docs.example.com')
    })
  })

  describe('removeLink', () => {
    it('should remove a link from a card', async () => {
      vi.mocked(kanbanService.removeLink).mockResolvedValue(mockCards[0])

      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.removeLink('card-1', 'link-1')
      })

      expect(kanbanService.removeLink).toHaveBeenCalledWith('card-1', 'link-1')
    })
  })

  describe('addComment', () => {
    it('should add a comment to a card', async () => {
      vi.mocked(kanbanService.addComment).mockResolvedValue(mockCards[0])

      const { result } = renderHook(() => useKanbanBoard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.addComment('card-1', 'This is a comment')
      })

      expect(kanbanService.addComment).toHaveBeenCalledWith('card-1', 'This is a comment')
    })
  })

  describe('refetch', () => {
    it('should refetch cards and tags', async () => {
      const { result } = renderHook(() => useKanbanBoard({ grupoId: 'grupo-1' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(kanbanService.getCards).toHaveBeenCalledTimes(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(kanbanService.getCards).toHaveBeenCalledTimes(2)
    })
  })
})
