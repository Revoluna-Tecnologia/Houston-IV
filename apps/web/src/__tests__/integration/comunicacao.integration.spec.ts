import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface Contact {
  id: string
  name: string
  phoneNumber: string
  email?: string
  isFavorite: boolean
  isBlocked: boolean
}

interface Conversation {
  id: string
  type: string
  name?: string
  grupoId: string
  participants: { id: string; phoneNumber: string }[]
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
}

describe('Comunicacao Integration', () => {
  describe('Contacts CRUD', () => {
    let createdContactId: string

    it('should create, read, update and delete contact', async () => {
      // CREATE
      const created = await apiRequest<Contact>('/comunicacao/contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Dr. Contato Teste',
          phoneNumber: '5511999990000',
          email: 'contato@teste.com',
        }),
      })

      expect(created.id).toBeDefined()
      expect(created.name).toBe('Dr. Contato Teste')
      expect(created.phoneNumber).toBe('5511999990000')
      expect(created.isFavorite).toBe(false)
      createdContactId = created.id

      // READ
      const fetched = await apiRequest<Contact>(`/comunicacao/contacts/${createdContactId}`)
      expect(fetched.id).toBe(createdContactId)

      // UPDATE
      const updated = await apiRequest<Contact>(`/comunicacao/contacts/${createdContactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Dr. Contato Atualizado' }),
      })
      expect(updated.name).toBe('Dr. Contato Atualizado')

      // DELETE
      await apiRequest(`/comunicacao/contacts/${createdContactId}`, {
        method: 'DELETE',
      })
    })

    it('should toggle favorite status', async () => {
      // Create contact
      const contact = await apiRequest<Contact>('/comunicacao/contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Contato Favorito',
          phoneNumber: '5511888880000',
        }),
      })

      expect(contact.isFavorite).toBe(false)

      // Toggle favorite
      const favorited = await apiRequest<Contact>(
        `/comunicacao/contacts/${contact.id}/favorite`,
        { method: 'POST' }
      )
      expect(favorited.isFavorite).toBe(true)

      // Toggle back
      const unfavorited = await apiRequest<Contact>(
        `/comunicacao/contacts/${contact.id}/favorite`,
        { method: 'POST' }
      )
      expect(unfavorited.isFavorite).toBe(false)

      // Cleanup
      await apiRequest(`/comunicacao/contacts/${contact.id}`, { method: 'DELETE' })
    })

    it('should toggle block status', async () => {
      // Create contact
      const contact = await apiRequest<Contact>('/comunicacao/contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Contato Bloqueio',
          phoneNumber: '5511777770000',
        }),
      })

      expect(contact.isBlocked).toBe(false)

      // Block
      const blocked = await apiRequest<Contact>(
        `/comunicacao/contacts/${contact.id}/block`,
        { method: 'POST' }
      )
      expect(blocked.isBlocked).toBe(true)

      // Cleanup
      await apiRequest(`/comunicacao/contacts/${contact.id}`, { method: 'DELETE' })
    })
  })

  describe('Contacts Listing', () => {
    it('should list contacts', async () => {
      const response = await apiRequest<PaginatedResponse<Contact>>('/comunicacao/contacts')

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should filter contacts by search', async () => {
      const response = await apiRequest<PaginatedResponse<Contact>>(
        '/comunicacao/contacts?search=teste'
      )

      expect(response.data).toBeDefined()
    })

    it('should filter contacts by favorite', async () => {
      const response = await apiRequest<PaginatedResponse<Contact>>(
        '/comunicacao/contacts?isFavorite=true'
      )

      response.data.forEach((contact) => {
        expect(contact.isFavorite).toBe(true)
      })
    })
  })

  describe('Conversations', () => {
    it('should list conversations', async () => {
      const response = await apiRequest<PaginatedResponse<Conversation>>(
        '/comunicacao/conversations'
      )

      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should filter conversations by type', async () => {
      const response = await apiRequest<PaginatedResponse<Conversation>>(
        '/comunicacao/conversations?type=direct'
      )

      response.data.forEach((conversation) => {
        expect(conversation.type).toBe('direct')
      })
    })
  })
})
