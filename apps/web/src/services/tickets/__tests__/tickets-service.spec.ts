import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ticketsService } from '../tickets-service'
import { apiClient } from '../../api-client'

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('ticketsService', () => {
  const mockTicket = {
    id: 'ticket-1',
    title: 'Bug no login',
    description: 'Usuarios nao conseguem fazer login',
    status: 'open',
    priority: 'high',
    category: 'functionality',
    type: 'bug',
    sector: 'dev',
    grupoId: 'grupo-1',
    createdById: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockPaginatedResponse = {
    data: [mockTicket],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all tickets', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const result = await ticketsService.getAll()

      expect(apiClient.get).toHaveBeenCalledWith('/tickets', undefined)
      expect(result).toEqual(mockPaginatedResponse)
    })

    it('should fetch tickets with filter params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { status: 'open', priority: 'high', sector: 'dev' }
      await ticketsService.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/tickets', params)
    })
  })

  describe('getById', () => {
    it('should fetch ticket by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTicket)

      const result = await ticketsService.getById('ticket-1')

      expect(apiClient.get).toHaveBeenCalledWith('/tickets/ticket-1')
      expect(result).toEqual(mockTicket)
    })
  })

  describe('create', () => {
    it('should create a new ticket', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockTicket)

      const createData = {
        title: 'Novo ticket',
        description: 'Descricao do ticket',
        priority: 'medium' as const,
        category: 'ui' as const,
        type: 'bug' as const,
        sector: 'dev' as const,
        grupoId: 'grupo-1',
      }

      const result = await ticketsService.create(createData)

      expect(apiClient.post).toHaveBeenCalledWith('/tickets', createData)
      expect(result).toEqual(mockTicket)
    })
  })

  describe('update', () => {
    it('should update ticket', async () => {
      const updatedTicket = { ...mockTicket, title: 'Titulo atualizado' }
      vi.mocked(apiClient.put).mockResolvedValue(updatedTicket)

      const updateData = { title: 'Titulo atualizado' }
      const result = await ticketsService.update('ticket-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/tickets/ticket-1', updateData)
      expect(result).toEqual(updatedTicket)
    })
  })

  describe('updateStatus', () => {
    it('should update ticket status', async () => {
      const updatedTicket = { ...mockTicket, status: 'in_progress' }
      vi.mocked(apiClient.patch).mockResolvedValue(updatedTicket)

      const result = await ticketsService.updateStatus('ticket-1', 'in_progress')

      expect(apiClient.patch).toHaveBeenCalledWith('/tickets/ticket-1/status', {
        status: 'in_progress',
      })
      expect(result).toEqual(updatedTicket)
    })
  })

  describe('assign', () => {
    it('should assign ticket to user', async () => {
      const assignedTicket = { ...mockTicket, assignedToId: 'user-2' }
      vi.mocked(apiClient.patch).mockResolvedValue(assignedTicket)

      const result = await ticketsService.assign('ticket-1', 'user-2')

      expect(apiClient.patch).toHaveBeenCalledWith('/tickets/ticket-1/assign', {
        assignedToId: 'user-2',
      })
      expect(result).toEqual(assignedTicket)
    })

    it('should unassign ticket', async () => {
      const unassignedTicket = { ...mockTicket, assignedToId: null }
      vi.mocked(apiClient.patch).mockResolvedValue(unassignedTicket)

      const result = await ticketsService.assign('ticket-1', null)

      expect(apiClient.patch).toHaveBeenCalledWith('/tickets/ticket-1/assign', {
        assignedToId: null,
      })
      expect(result).toEqual(unassignedTicket)
    })
  })

  describe('archive', () => {
    it('should archive ticket', async () => {
      const archivedTicket = { ...mockTicket, archived: true }
      vi.mocked(apiClient.patch).mockResolvedValue(archivedTicket)

      const result = await ticketsService.archive('ticket-1')

      expect(apiClient.patch).toHaveBeenCalledWith('/tickets/ticket-1/archive', {})
      expect(result).toEqual(archivedTicket)
    })
  })

  describe('delete', () => {
    it('should delete ticket', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)

      await ticketsService.delete('ticket-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/tickets/ticket-1')
    })
  })
})
