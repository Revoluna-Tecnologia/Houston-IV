import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UsersService } from '../users-service'
import { apiClient } from '../api-client'
import { UserRole } from '../types'

vi.mock('../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('UsersService', () => {
  let service: UsersService

  const mockUser = {
    id: 'user-1',
    email: 'joao@email.com',
    name: 'João Silva',
    role: UserRole.ESCALISTA,
    grupoIds: ['grupo-1'],
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockPaginatedResponse = {
    data: [mockUser],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new UsersService()
  })

  describe('getAll', () => {
    it('should fetch all users', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const result = await service.getAll()

      expect(apiClient.get).toHaveBeenCalledWith('/users', undefined)
      expect(result).toEqual(mockPaginatedResponse)
    })

    it('should fetch users with search filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { search: 'joao' }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/users', params)
    })

    it('should fetch users with role filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { role: UserRole.ADMIN }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/users', params)
    })

    it('should fetch users with ativo filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { ativo: true }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/users', params)
    })

    it('should fetch users with pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { page: 2, limit: 20 }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/users', params)
    })

    it('should fetch users with multiple filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPaginatedResponse)

      const params = { role: UserRole.ESCALISTA, ativo: true, search: 'silva' }
      await service.getAll(params)

      expect(apiClient.get).toHaveBeenCalledWith('/users', params)
    })
  })

  describe('getById', () => {
    it('should fetch user by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockUser)

      const result = await service.getById('user-1')

      expect(apiClient.get).toHaveBeenCalledWith('/users/user-1')
      expect(result).toEqual(mockUser)
    })
  })

  describe('create', () => {
    it('should create a new user', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockUser)

      const createData = {
        email: 'joao@email.com',
        password: 'senha123',
        nome: 'João Silva',
        role: UserRole.ESCALISTA,
      }

      const result = await service.create(createData)

      expect(apiClient.post).toHaveBeenCalledWith('/users', createData)
      expect(result).toEqual(mockUser)
    })

    it('should create user with grupoIds', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockUser)

      const createData = {
        email: 'maria@email.com',
        password: 'senha456',
        nome: 'Maria Santos',
        role: UserRole.COORDENADOR,
        grupoIds: ['grupo-1', 'grupo-2'],
      }

      const result = await service.create(createData)

      expect(apiClient.post).toHaveBeenCalledWith('/users', createData)
      expect(result).toEqual(mockUser)
    })

    it('should create admin user', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN }
      vi.mocked(apiClient.post).mockResolvedValue(adminUser)

      const createData = {
        email: 'admin@email.com',
        password: 'admin123',
        nome: 'Admin',
        role: UserRole.ADMIN,
      }

      const result = await service.create(createData)

      expect(apiClient.post).toHaveBeenCalledWith('/users', createData)
      expect(result.role).toBe(UserRole.ADMIN)
    })
  })

  describe('update', () => {
    it('should update user nome', async () => {
      const updatedUser = { ...mockUser, name: 'João Santos' }
      vi.mocked(apiClient.put).mockResolvedValue(updatedUser)

      const updateData = { nome: 'João Santos' }
      const result = await service.update('user-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/users/user-1', updateData)
      expect(result).toEqual(updatedUser)
    })

    it('should update user role', async () => {
      const updatedUser = { ...mockUser, role: UserRole.COORDENADOR }
      vi.mocked(apiClient.put).mockResolvedValue(updatedUser)

      const updateData = { role: UserRole.COORDENADOR }
      const result = await service.update('user-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/users/user-1', updateData)
      expect(result.role).toBe(UserRole.COORDENADOR)
    })

    it('should update user grupoIds', async () => {
      const updatedUser = { ...mockUser, grupoIds: ['grupo-2', 'grupo-3'] }
      vi.mocked(apiClient.put).mockResolvedValue(updatedUser)

      const updateData = { grupoIds: ['grupo-2', 'grupo-3'] }
      const result = await service.update('user-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/users/user-1', updateData)
      expect(result.grupoIds).toEqual(['grupo-2', 'grupo-3'])
    })

    it('should update multiple fields', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'João Atualizado',
        role: UserRole.COORDENADOR,
        grupoIds: ['grupo-2'],
      }
      vi.mocked(apiClient.put).mockResolvedValue(updatedUser)

      const updateData = {
        nome: 'João Atualizado',
        role: UserRole.COORDENADOR,
        grupoIds: ['grupo-2'],
      }
      const result = await service.update('user-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/users/user-1', updateData)
      expect(result).toEqual(updatedUser)
    })

    it('should deactivate user via update', async () => {
      const inactiveUser = { ...mockUser, ativo: false }
      vi.mocked(apiClient.put).mockResolvedValue(inactiveUser)

      const updateData = { ativo: false }
      const result = await service.update('user-1', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/users/user-1', updateData)
      expect(result.ativo).toBe(false)
    })
  })

  describe('delete', () => {
    it('should delete a user', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)

      await service.delete('user-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/users/user-1')
    })
  })

  describe('activate', () => {
    it('should activate a user', async () => {
      const activatedUser = { ...mockUser, ativo: true }
      vi.mocked(apiClient.post).mockResolvedValue(activatedUser)

      const result = await service.activate('user-1')

      expect(apiClient.post).toHaveBeenCalledWith('/users/user-1/activate')
      expect(result).toEqual(activatedUser)
      expect(result.ativo).toBe(true)
    })

    it('should activate inactive user', async () => {
      const activatedUser = { ...mockUser, ativo: true }
      vi.mocked(apiClient.post).mockResolvedValue(activatedUser)

      const result = await service.activate('user-inactive')

      expect(apiClient.post).toHaveBeenCalledWith('/users/user-inactive/activate')
      expect(result.ativo).toBe(true)
    })
  })

  describe('deactivate', () => {
    it('should deactivate a user', async () => {
      const deactivatedUser = { ...mockUser, ativo: false }
      vi.mocked(apiClient.post).mockResolvedValue(deactivatedUser)

      const result = await service.deactivate('user-1')

      expect(apiClient.post).toHaveBeenCalledWith('/users/user-1/deactivate')
      expect(result).toEqual(deactivatedUser)
      expect(result.ativo).toBe(false)
    })

    it('should deactivate active user', async () => {
      const deactivatedUser = { ...mockUser, ativo: false }
      vi.mocked(apiClient.post).mockResolvedValue(deactivatedUser)

      const result = await service.deactivate('user-active')

      expect(apiClient.post).toHaveBeenCalledWith('/users/user-active/deactivate')
      expect(result.ativo).toBe(false)
    })
  })
})
