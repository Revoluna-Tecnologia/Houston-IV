import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { ContactsController } from '../contacts.controller'
import { ContactsService } from '../contacts.service'

describe('ContactsController', () => {
  let controller: ContactsController
  let service: {
    create: Mock
    findAll: Mock
    findOne: Mock
    update: Mock
    delete: Mock
    toggleFavorite: Mock
    toggleBlock: Mock
  }

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
    role: 'admin' as const,
    grupoIds: ['grupo-1'],
    permissions: [],
    iat: 0,
    exp: 0,
  }

  const mockContact = {
    id: 'contact-1',
    ownerId: 'user-1',
    name: 'John Doe',
    phoneNumber: '5511999999999',
    email: 'john@example.com',
    avatarUrl: undefined,
    linkedUserId: undefined,
    linkedMedicoId: undefined,
    linkedMedicoName: undefined,
    isFavorite: false,
    isBlocked: false,
    notes: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    service = {
      create: vi.fn().mockResolvedValue(mockContact),
      findAll: vi.fn().mockResolvedValue({ data: [mockContact], total: 1 }),
      findOne: vi.fn().mockResolvedValue(mockContact),
      update: vi.fn().mockResolvedValue(mockContact),
      delete: vi.fn().mockResolvedValue(undefined),
      toggleFavorite: vi.fn().mockResolvedValue({ ...mockContact, isFavorite: true }),
      toggleBlock: vi.fn().mockResolvedValue({ ...mockContact, isBlocked: true }),
    }

    controller = new ContactsController(service as unknown as ContactsService)
  })

  describe('create', () => {
    it('should create a new contact', async () => {
      const dto = {
        name: 'John Doe',
        phoneNumber: '5511999999999',
        email: 'john@example.com',
      }

      const result = await controller.create(dto, mockUser)

      expect(result.id).toBe('contact-1')
      expect(service.create).toHaveBeenCalledWith(dto, mockUser)
    })
  })

  describe('findAll', () => {
    it('should return all contacts', async () => {
      const query = { page: 1, limit: 50 }

      const result = await controller.findAll(query, mockUser)

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(service.findAll).toHaveBeenCalledWith(query, mockUser)
    })

    it('should filter by search term', async () => {
      const query = { search: 'John', page: 1, limit: 50 }

      await controller.findAll(query, mockUser)

      expect(service.findAll).toHaveBeenCalledWith(query, mockUser)
    })

    it('should filter favorites only', async () => {
      const query = { favoritesOnly: true, page: 1, limit: 50 }

      await controller.findAll(query, mockUser)

      expect(service.findAll).toHaveBeenCalledWith(query, mockUser)
    })
  })

  describe('findOne', () => {
    it('should return a contact by id', async () => {
      const result = await controller.findOne('contact-1', mockUser)

      expect(result.id).toBe('contact-1')
      expect(service.findOne).toHaveBeenCalledWith('contact-1', mockUser)
    })
  })

  describe('update', () => {
    it('should update a contact', async () => {
      const dto = { name: 'Jane Doe' }

      const result = await controller.update('contact-1', dto, mockUser)

      expect(result.id).toBe('contact-1')
      expect(service.update).toHaveBeenCalledWith('contact-1', dto, mockUser)
    })
  })

  describe('delete', () => {
    it('should delete a contact', async () => {
      await controller.delete('contact-1', mockUser)

      expect(service.delete).toHaveBeenCalledWith('contact-1', mockUser)
    })
  })

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      const result = await controller.toggleFavorite('contact-1', mockUser)

      expect(result.isFavorite).toBe(true)
      expect(service.toggleFavorite).toHaveBeenCalledWith('contact-1', mockUser)
    })
  })

  describe('toggleBlock', () => {
    it('should toggle block status', async () => {
      const result = await controller.toggleBlock('contact-1', mockUser)

      expect(result.isBlocked).toBe(true)
      expect(service.toggleBlock).toHaveBeenCalledWith('contact-1', mockUser)
    })
  })
})
