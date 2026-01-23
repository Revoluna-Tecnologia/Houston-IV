import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { ContactsRepository } from '../contacts.repository'
import { PrismaService } from '../../../prisma/prisma.service'

describe('ContactsRepository', () => {
  let repository: ContactsRepository
  let prisma: {
    chatContact: {
      create: Mock
      findUnique: Mock
      findMany: Mock
      update: Mock
      delete: Mock
      count: Mock
    }
  }

  const mockContact = {
    id: 'contact-1',
    ownerId: 'user-1',
    name: 'John Doe',
    phoneNumber: '5511999999999',
    email: 'john@example.com',
    avatarUrl: null,
    linkedUserId: null,
    linkedMedicoId: null,
    isFavorite: false,
    isBlocked: false,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    prisma = {
      chatContact: {
        create: vi.fn().mockResolvedValue(mockContact),
        findUnique: vi.fn().mockResolvedValue(mockContact),
        findMany: vi.fn().mockResolvedValue([mockContact]),
        update: vi.fn().mockResolvedValue(mockContact),
        delete: vi.fn().mockResolvedValue(mockContact),
        count: vi.fn().mockResolvedValue(1),
      },
    }

    repository = new ContactsRepository(prisma as unknown as PrismaService)
  })

  describe('create', () => {
    it('should create a new contact', async () => {
      const createData = {
        ownerId: 'user-1',
        name: 'John Doe',
        phoneNumber: '11999999999',
        email: 'john@example.com',
      }

      const result = await repository.create(createData)

      expect(result).toEqual(mockContact)
      expect(prisma.chatContact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ownerId: 'user-1',
          name: 'John Doe',
          phoneNumber: '5511999999999', // normalized
          email: 'john@example.com',
          isFavorite: false,
        }),
      })
    })

    it('should normalize phone number with 55 prefix', async () => {
      const createData = {
        ownerId: 'user-1',
        name: 'John Doe',
        phoneNumber: '(11) 99999-9999',
      }

      await repository.create(createData)

      expect(prisma.chatContact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumber: '5511999999999',
        }),
      })
    })

    it('should not double-prefix phone with 55', async () => {
      const createData = {
        ownerId: 'user-1',
        name: 'John Doe',
        phoneNumber: '+5511999999999',
      }

      await repository.create(createData)

      expect(prisma.chatContact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumber: '5511999999999',
        }),
      })
    })
  })

  describe('findById', () => {
    it('should find contact by id', async () => {
      const result = await repository.findById('contact-1')

      expect(result).toEqual(mockContact)
      expect(prisma.chatContact.findUnique).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
        include: {
          linkedMedico: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
            },
          },
        },
      })
    })

    it('should return null when contact not found', async () => {
      prisma.chatContact.findUnique.mockResolvedValue(null)

      const result = await repository.findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findByOwnerAndPhone', () => {
    it('should find contact by owner and phone', async () => {
      const result = await repository.findByOwnerAndPhone('user-1', '11999999999')

      expect(result).toEqual(mockContact)
      expect(prisma.chatContact.findUnique).toHaveBeenCalledWith({
        where: {
          ownerId_phoneNumber: {
            ownerId: 'user-1',
            phoneNumber: '5511999999999',
          },
        },
      })
    })
  })

  describe('findAll', () => {
    it('should find all contacts for owner', async () => {
      const query = { page: 1, limit: 50 }

      const result = await repository.findAll('user-1', query)

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(prisma.chatContact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: 'user-1' },
          orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
          skip: 0,
          take: 50,
        })
      )
    })

    it('should filter by search term', async () => {
      const query = { search: 'John', page: 1, limit: 50 }

      await repository.findAll('user-1', query)

      expect(prisma.chatContact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'John', mode: 'insensitive' } },
              { phoneNumber: { contains: 'John' } },
              { email: { contains: 'John', mode: 'insensitive' } },
            ]),
          }),
        })
      )
    })

    it('should filter favorites only', async () => {
      const query = { favoritesOnly: true, page: 1, limit: 50 }

      await repository.findAll('user-1', query)

      expect(prisma.chatContact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isFavorite: true,
          }),
        })
      )
    })

    it('should filter blocked only', async () => {
      const query = { blockedOnly: true, page: 1, limit: 50 }

      await repository.findAll('user-1', query)

      expect(prisma.chatContact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isBlocked: true,
          }),
        })
      )
    })

    it('should paginate results', async () => {
      const query = { page: 2, limit: 10 }

      await repository.findAll('user-1', query)

      expect(prisma.chatContact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })
  })

  describe('update', () => {
    it('should update contact', async () => {
      const updateData = { name: 'Jane Doe' }

      const result = await repository.update('contact-1', updateData)

      expect(result).toEqual(mockContact)
      expect(prisma.chatContact.update).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
        data: updateData,
      })
    })
  })

  describe('delete', () => {
    it('should delete contact', async () => {
      await repository.delete('contact-1')

      expect(prisma.chatContact.delete).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
      })
    })
  })

  describe('toggleFavorite', () => {
    it('should toggle favorite to true', async () => {
      prisma.chatContact.findUnique.mockResolvedValue({ ...mockContact, isFavorite: false })
      prisma.chatContact.update.mockResolvedValue({ ...mockContact, isFavorite: true })

      const result = await repository.toggleFavorite('contact-1')

      expect(result.isFavorite).toBe(true)
      expect(prisma.chatContact.update).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
        data: { isFavorite: true },
      })
    })

    it('should toggle favorite to false', async () => {
      prisma.chatContact.findUnique.mockResolvedValue({ ...mockContact, isFavorite: true })
      prisma.chatContact.update.mockResolvedValue({ ...mockContact, isFavorite: false })

      const result = await repository.toggleFavorite('contact-1')

      expect(result.isFavorite).toBe(false)
    })

    it('should throw error when contact not found', async () => {
      prisma.chatContact.findUnique.mockResolvedValue(null)

      await expect(repository.toggleFavorite('non-existent')).rejects.toThrow(
        'Contact not found'
      )
    })
  })

  describe('toggleBlock', () => {
    it('should toggle block to true', async () => {
      prisma.chatContact.findUnique.mockResolvedValue({ ...mockContact, isBlocked: false })
      prisma.chatContact.update.mockResolvedValue({ ...mockContact, isBlocked: true })

      const result = await repository.toggleBlock('contact-1')

      expect(result.isBlocked).toBe(true)
      expect(prisma.chatContact.update).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
        data: { isBlocked: true },
      })
    })

    it('should toggle block to false', async () => {
      prisma.chatContact.findUnique.mockResolvedValue({ ...mockContact, isBlocked: true })
      prisma.chatContact.update.mockResolvedValue({ ...mockContact, isBlocked: false })

      const result = await repository.toggleBlock('contact-1')

      expect(result.isBlocked).toBe(false)
    })

    it('should throw error when contact not found', async () => {
      prisma.chatContact.findUnique.mockResolvedValue(null)

      await expect(repository.toggleBlock('non-existent')).rejects.toThrow(
        'Contact not found'
      )
    })
  })
})
