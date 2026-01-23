import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useKanbanCard } from '../use-kanban-card'
import { kanbanService } from '../../../services/kanban'
import type { KanbanCard } from '../../../services/kanban'

vi.mock('../../../services/kanban', () => ({
  kanbanService: {
    getCardById: vi.fn(),
    updateCard: vi.fn(),
    moveCard: vi.fn(),
    assignCard: vi.fn(),
    addTag: vi.fn(),
    removeTag: vi.fn(),
    addLink: vi.fn(),
    removeLink: vi.fn(),
    addComment: vi.fn(),
  },
}))

const mockCard: KanbanCard = {
  id: 'card-1',
  title: 'Test Card',
  description: 'Description',
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

describe('useKanbanCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(kanbanService.getCardById).mockResolvedValue(mockCard)
  })

  describe('initial fetch', () => {
    it('should fetch card by id on mount', async () => {
      const { result } = renderHook(() => useKanbanCard('card-1'))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(kanbanService.getCardById).toHaveBeenCalledWith('card-1')
      expect(result.current.data).toEqual(mockCard)
    })

    it('should handle fetch error', async () => {
      const error = new Error('Card not found')
      vi.mocked(kanbanService.getCardById).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useKanbanCard('card-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.data).toBeNull()
    })

    it('should refetch when id changes', async () => {
      const { result, rerender } = renderHook(({ id }) => useKanbanCard(id), {
        initialProps: { id: 'card-1' },
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(kanbanService.getCardById).toHaveBeenCalledWith('card-1')

      const card2 = { ...mockCard, id: 'card-2', title: 'Card 2' }
      vi.mocked(kanbanService.getCardById).mockResolvedValueOnce(card2)

      rerender({ id: 'card-2' })

      await waitFor(() => {
        expect(kanbanService.getCardById).toHaveBeenCalledWith('card-2')
      })
    })
  })

  describe('update', () => {
    it('should update the card', async () => {
      const updatedCard = { ...mockCard, title: 'Updated Title' }
      vi.mocked(kanbanService.updateCard).mockResolvedValue(updatedCard)

      const { result } = renderHook(() => useKanbanCard('card-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let updated: KanbanCard | undefined
      await act(async () => {
        updated = await result.current.update({ title: 'Updated Title' })
      })

      expect(updated).toEqual(updatedCard)
      expect(kanbanService.updateCard).toHaveBeenCalledWith('card-1', { title: 'Updated Title' })
      expect(result.current.data).toEqual(updatedCard)
    })
  })

  describe('move', () => {
    it('should move the card to a new status', async () => {
      const movedCard = { ...mockCard, status: 'done' }
      vi.mocked(kanbanService.moveCard).mockResolvedValue(movedCard)

      const { result } = renderHook(() => useKanbanCard('card-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.move('done')
      })

      expect(kanbanService.moveCard).toHaveBeenCalledWith('card-1', 'done')
      expect(result.current.data?.status).toBe('done')
    })
  })

  describe('assign', () => {
    it('should assign the card to a user', async () => {
      const assignedCard = { ...mockCard, assigneeId: 'user-2' }
      vi.mocked(kanbanService.assignCard).mockResolvedValue(assignedCard)

      const { result } = renderHook(() => useKanbanCard('card-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.assign('user-2')
      })

      expect(kanbanService.assignCard).toHaveBeenCalledWith('card-1', 'user-2')
      expect(result.current.data?.assigneeId).toBe('user-2')
    })

    it('should unassign the card', async () => {
      const unassignedCard = { ...mockCard, assigneeId: null }
      vi.mocked(kanbanService.assignCard).mockResolvedValue(unassignedCard)

      const { result } = renderHook(() => useKanbanCard('card-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.assign(null)
      })

      expect(kanbanService.assignCard).toHaveBeenCalledWith('card-1', null)
    })
  })

  describe('addTag', () => {
    it('should add a tag to the card', async () => {
      const cardWithTag = { ...mockCard, tags: [{ id: 'tag-1', name: 'Bug', color: '#ff0000', grupoId: 'grupo-1' }] }
      vi.mocked(kanbanService.addTag).mockResolvedValue(cardWithTag)

      const { result } = renderHook(() => useKanbanCard('card-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.addTag('Bug', 'grupo-1', '#ff0000')
      })

      expect(kanbanService.addTag).toHaveBeenCalledWith('card-1', 'Bug', 'grupo-1', '#ff0000')
      expect(result.current.data?.tags).toHaveLength(1)
    })
  })

  describe('removeTag', () => {
    it('should remove a tag from the card', async () => {
      vi.mocked(kanbanService.removeTag).mockResolvedValue(mockCard)

      const { result } = renderHook(() => useKanbanCard('card-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.removeTag('tag-1')
      })

      expect(kanbanService.removeTag).toHaveBeenCalledWith('card-1', 'tag-1')
    })
  })

  describe('addLink', () => {
    it('should add a link to the card', async () => {
      const cardWithLink = { ...mockCard, links: [{ id: 'link-1', title: 'Docs', url: 'https://docs.example.com' }] }
      vi.mocked(kanbanService.addLink).mockResolvedValue(cardWithLink)

      const { result } = renderHook(() => useKanbanCard('card-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.addLink('Docs', 'https://docs.example.com')
      })

      expect(kanbanService.addLink).toHaveBeenCalledWith('card-1', 'Docs', 'https://docs.example.com')
      expect(result.current.data?.links).toHaveLength(1)
    })
  })

  describe('removeLink', () => {
    it('should remove a link from the card', async () => {
      vi.mocked(kanbanService.removeLink).mockResolvedValue(mockCard)

      const { result } = renderHook(() => useKanbanCard('card-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.removeLink('link-1')
      })

      expect(kanbanService.removeLink).toHaveBeenCalledWith('card-1', 'link-1')
    })
  })

  describe('addComment', () => {
    it('should add a comment to the card', async () => {
      vi.mocked(kanbanService.addComment).mockResolvedValue(mockCard)

      const { result } = renderHook(() => useKanbanCard('card-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.addComment('This is a comment')
      })

      expect(kanbanService.addComment).toHaveBeenCalledWith('card-1', 'This is a comment')
    })
  })

  describe('refetch', () => {
    it('should refetch the card', async () => {
      const { result } = renderHook(() => useKanbanCard('card-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(kanbanService.getCardById).toHaveBeenCalledTimes(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(kanbanService.getCardById).toHaveBeenCalledTimes(2)
    })
  })
})
