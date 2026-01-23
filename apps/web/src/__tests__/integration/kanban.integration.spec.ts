/**
 * Kanban Integration Tests
 * Tests against real backend API
 */

import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface KanbanCard {
  id: string
  title: string
  description: string | null
  status: string
  tab: string
  assigneeId: string | null
  grupoId: string
  createdById: string
  tags: Array<{ id: string; name: string; color: string }>
  links: Array<{ id: string; title: string; url: string }>
  timeline: Array<{
    id: string
    type: string
    authorId: string
    content: string
    createdAt: string
  }>
  createdAt: string
  updatedAt: string
}

interface KanbanTag {
  id: string
  name: string
  color: string
}

interface Grupo {
  id: string
  nome: string
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

describe('Kanban Integration', () => {
  let testGrupoId: string
  let createdCardId: string
  let testTagId: string

  describe('Setup', () => {
    it('should get a grupo for testing', async () => {
      const grupos = await apiRequest<PaginatedResponse<Grupo>>('/grupos')

      expect(grupos.data).toBeDefined()
      if (grupos.data.length > 0) {
        testGrupoId = grupos.data[0].id
      } else {
        console.log('No grupos available, some tests will be skipped')
      }
    })
  })

  describe('Card CRUD Operations', () => {
    it('should create a card', async () => {
      if (!testGrupoId) {
        console.log('No grupo available, skipping test')
        return
      }

      const card = await apiRequest<KanbanCard>('/kanban/cards', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Card de Teste Integracao',
          description: 'Descricao do card de teste',
          status: 'backlog',
          tab: 'projetos',
          grupoId: testGrupoId,
        }),
      })

      expect(card.id).toBeDefined()
      expect(card.title).toBe('Card de Teste Integracao')
      expect(card.description).toBe('Descricao do card de teste')
      expect(card.status).toBe('backlog')
      expect(card.tab).toBe('projetos')
      expect(card.grupoId).toBe(testGrupoId)
      expect(card.timeline).toBeDefined()
      expect(card.timeline.length).toBeGreaterThan(0)

      createdCardId = card.id
    })

    it('should list cards', async () => {
      if (!testGrupoId) {
        console.log('No grupo available, skipping test')
        return
      }

      const cards = await apiRequest<KanbanCard[]>(`/kanban/cards?grupoId=${testGrupoId}`)

      expect(cards).toBeDefined()
      expect(Array.isArray(cards)).toBe(true)
    })

    it('should filter cards by tab', async () => {
      if (!testGrupoId) {
        console.log('No grupo available, skipping test')
        return
      }

      const cards = await apiRequest<KanbanCard[]>(`/kanban/cards?grupoId=${testGrupoId}&tab=projetos`)

      expect(cards).toBeDefined()
      cards.forEach((card) => {
        expect(card.tab).toBe('projetos')
      })
    })

    it('should filter cards by status', async () => {
      if (!testGrupoId) {
        console.log('No grupo available, skipping test')
        return
      }

      const cards = await apiRequest<KanbanCard[]>(`/kanban/cards?grupoId=${testGrupoId}&status=backlog`)

      expect(cards).toBeDefined()
      cards.forEach((card) => {
        expect(card.status).toBe('backlog')
      })
    })

    it('should get card by id', async () => {
      if (!createdCardId) {
        console.log('No card created, skipping test')
        return
      }

      const card = await apiRequest<KanbanCard>(`/kanban/cards/${createdCardId}`)

      expect(card.id).toBe(createdCardId)
      expect(card.title).toBe('Card de Teste Integracao')
    })

    it('should update card', async () => {
      if (!createdCardId) {
        console.log('No card created, skipping test')
        return
      }

      const card = await apiRequest<KanbanCard>(`/kanban/cards/${createdCardId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Card Atualizado',
          description: 'Descricao atualizada',
        }),
      })

      expect(card.title).toBe('Card Atualizado')
      expect(card.description).toBe('Descricao atualizada')
    })
  })

  describe('Card Movement', () => {
    it('should move card to different status', async () => {
      if (!createdCardId) {
        console.log('No card created, skipping test')
        return
      }

      const card = await apiRequest<KanbanCard>(`/kanban/cards/${createdCardId}/move`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'doing',
        }),
      })

      expect(card.status).toBe('doing')

      // Check timeline has move entry
      const moveEntry = card.timeline.find((t) => t.type === 'move')
      expect(moveEntry).toBeDefined()
    })

    it('should move card to done', async () => {
      if (!createdCardId) {
        console.log('No card created, skipping test')
        return
      }

      const card = await apiRequest<KanbanCard>(`/kanban/cards/${createdCardId}/move`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'done',
        }),
      })

      expect(card.status).toBe('done')
    })
  })

  describe('Tags', () => {
    it('should add tag to card', async () => {
      if (!createdCardId || !testGrupoId) {
        console.log('No card or grupo available, skipping test')
        return
      }

      const card = await apiRequest<KanbanCard>(`/kanban/cards/${createdCardId}/tags`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'urgente',
          color: '#ff0000',
          grupoId: testGrupoId,
        }),
      })

      expect(card.tags).toBeDefined()
      expect(card.tags.length).toBeGreaterThan(0)

      const urgenteTag = card.tags.find((t) => t.name === 'urgente')
      expect(urgenteTag).toBeDefined()
      expect(urgenteTag?.color).toBe('#ff0000')

      testTagId = urgenteTag!.id
    })

    it('should get tags for grupo', async () => {
      if (!testGrupoId) {
        console.log('No grupo available, skipping test')
        return
      }

      const tags = await apiRequest<KanbanTag[]>(`/kanban/tags?grupoId=${testGrupoId}`)

      expect(tags).toBeDefined()
      expect(Array.isArray(tags)).toBe(true)
    })

    it('should remove tag from card', async () => {
      if (!createdCardId || !testTagId) {
        console.log('No card or tag available, skipping test')
        return
      }

      const card = await apiRequest<KanbanCard>(`/kanban/cards/${createdCardId}/tags/${testTagId}`, {
        method: 'DELETE',
      })

      expect(card.tags).toBeDefined()
      const urgenteTag = card.tags.find((t) => t.id === testTagId)
      expect(urgenteTag).toBeUndefined()
    })
  })

  describe('Links', () => {
    it('should add link to card', async () => {
      if (!createdCardId) {
        console.log('No card created, skipping test')
        return
      }

      const card = await apiRequest<KanbanCard>(`/kanban/cards/${createdCardId}/links`, {
        method: 'POST',
        body: JSON.stringify({
          title: 'Google',
          url: 'https://google.com',
        }),
      })

      expect(card.links).toBeDefined()
      expect(card.links.length).toBeGreaterThan(0)

      const googleLink = card.links.find((l) => l.title === 'Google')
      expect(googleLink).toBeDefined()
      expect(googleLink?.url).toBe('https://google.com')
    })

    it('should remove link from card', async () => {
      if (!createdCardId) {
        console.log('No card created, skipping test')
        return
      }

      // Get card to find link id
      const cardBefore = await apiRequest<KanbanCard>(`/kanban/cards/${createdCardId}`)

      if (cardBefore.links.length === 0) {
        console.log('No links on card, skipping test')
        return
      }

      const linkId = cardBefore.links[0].id

      const card = await apiRequest<KanbanCard>(`/kanban/cards/${createdCardId}/links/${linkId}`, {
        method: 'DELETE',
      })

      const removedLink = card.links.find((l) => l.id === linkId)
      expect(removedLink).toBeUndefined()
    })
  })

  describe('Comments', () => {
    it('should add comment to card', async () => {
      if (!createdCardId) {
        console.log('No card created, skipping test')
        return
      }

      const card = await apiRequest<KanbanCard>(`/kanban/cards/${createdCardId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: 'Este eh um comentario de teste',
        }),
      })

      expect(card.timeline).toBeDefined()

      const comment = card.timeline.find(
        (t) => t.type === 'comment' && t.content === 'Este eh um comentario de teste'
      )
      expect(comment).toBeDefined()
    })
  })

  describe('Delete Card', () => {
    it('should soft delete card', async () => {
      if (!createdCardId) {
        console.log('No card created, skipping test')
        return
      }

      await apiRequest(`/kanban/cards/${createdCardId}`, {
        method: 'DELETE',
      })

      // Card should not be found in normal listing
      if (testGrupoId) {
        const cards = await apiRequest<KanbanCard[]>(`/kanban/cards?grupoId=${testGrupoId}`)
        const deletedCard = cards.find((c) => c.id === createdCardId)
        expect(deletedCard).toBeUndefined()
      }
    })
  })
})
