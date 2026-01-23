import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTicketComments } from '../use-ticket-comments'
import { commentsService } from '../../../services/tickets'
import type { TicketComment } from '../../../services/tickets'

vi.mock('../../../services/tickets', () => ({
  commentsService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockComments: TicketComment[] = [
  {
    id: 'comment-1',
    content: 'First comment',
    ticketId: 'ticket-1',
    authorId: 'user-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'comment-2',
    content: 'Second comment',
    ticketId: 'ticket-1',
    authorId: 'user-2',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
]

describe('useTicketComments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(commentsService.getAll).mockResolvedValue({ data: mockComments })
  })

  describe('initial fetch', () => {
    it('should fetch comments on mount', async () => {
      const { result } = renderHook(() => useTicketComments('ticket-1'))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(commentsService.getAll).toHaveBeenCalledWith('ticket-1')
      expect(result.current.data).toEqual(mockComments)
    })

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch comments')
      vi.mocked(commentsService.getAll).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useTicketComments('ticket-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.data).toEqual([])
    })

    it('should refetch when ticketId changes', async () => {
      const { result, rerender } = renderHook(
        ({ ticketId }) => useTicketComments(ticketId),
        { initialProps: { ticketId: 'ticket-1' } }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(commentsService.getAll).toHaveBeenCalledWith('ticket-1')

      const otherComments = [{ ...mockComments[0], id: 'comment-3', ticketId: 'ticket-2' }]
      vi.mocked(commentsService.getAll).mockResolvedValueOnce({ data: otherComments })

      rerender({ ticketId: 'ticket-2' })

      await waitFor(() => {
        expect(commentsService.getAll).toHaveBeenCalledWith('ticket-2')
      })
    })
  })

  describe('create', () => {
    it('should create a new comment', async () => {
      const newComment: TicketComment = {
        id: 'comment-3',
        content: 'New comment',
        ticketId: 'ticket-1',
        authorId: 'user-1',
        createdAt: '2024-01-03',
        updatedAt: '2024-01-03',
      }
      vi.mocked(commentsService.create).mockResolvedValue(newComment)

      const { result } = renderHook(() => useTicketComments('ticket-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let created: TicketComment | undefined
      await act(async () => {
        created = await result.current.create({ content: 'New comment' })
      })

      expect(created).toEqual(newComment)
      expect(commentsService.create).toHaveBeenCalledWith('ticket-1', { content: 'New comment' })
    })
  })

  describe('update', () => {
    it('should update a comment', async () => {
      const updatedComment = { ...mockComments[0], content: 'Updated content' }
      vi.mocked(commentsService.update).mockResolvedValue(updatedComment)

      const { result } = renderHook(() => useTicketComments('ticket-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.update('comment-1', 'Updated content')
      })

      expect(commentsService.update).toHaveBeenCalledWith('ticket-1', 'comment-1', 'Updated content')
    })
  })

  describe('remove', () => {
    it('should delete a comment', async () => {
      vi.mocked(commentsService.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useTicketComments('ticket-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.remove('comment-1')
      })

      expect(commentsService.delete).toHaveBeenCalledWith('ticket-1', 'comment-1')
    })
  })

  describe('refetch', () => {
    it('should refetch comments', async () => {
      const { result } = renderHook(() => useTicketComments('ticket-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(commentsService.getAll).toHaveBeenCalledTimes(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(commentsService.getAll).toHaveBeenCalledTimes(2)
    })
  })
})
