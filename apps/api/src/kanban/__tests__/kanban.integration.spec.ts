import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { NotFoundException } from '@nestjs/common'
import { KanbanService } from '../kanban.service'
import { KanbanRepository } from '../kanban.repository'
import { PrismaModule } from '../../prisma/prisma.module'
import { PrismaService } from '../../prisma/prisma.service'
import { KanbanTab } from '@prisma/client'

describe('KanbanModule (Integration)', () => {
  let module: TestingModule
  let service: KanbanService
  let prisma: PrismaService
  let testGrupoId: string
  let testUserId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
      ],
      providers: [KanbanService, KanbanRepository],
    }).compile()

    service = module.get<KanbanService>(KanbanService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    // Clean up in correct order (respecting foreign keys)
    await prisma.kanbanTimeline.deleteMany()
    await prisma.kanbanCardTag.deleteMany()
    await prisma.kanbanLink.deleteMany()
    await prisma.kanbanCard.deleteMany()
    await prisma.kanbanTag.deleteMany()
    await prisma.grupo.deleteMany()
    await prisma.user.deleteMany()

    // Create test grupo
    const grupo = await prisma.grupo.create({
      data: { nome: 'Grupo Kanban Teste' },
    })
    testGrupoId = grupo.id

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'kanban-test@example.com',
        name: 'Kanban Test User',
        emailVerified: true,
      },
    })
    testUserId = user.id
  })

  describe('Card CRUD Operations', () => {
    describe('createCard', () => {
      it('should create a new card', async () => {
        const dto = {
          title: 'Nova Tarefa',
          description: 'Descricao da tarefa',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }

        const result = await service.createCard(dto, testUserId)

        expect(result).toBeDefined()
        expect(result.id).toBeDefined()
        expect(result.title).toBe(dto.title)
        expect(result.description).toBe(dto.description)
        expect(result.status).toBe(dto.status)
        expect(result.tab).toBe(dto.tab)
        expect(result.grupoId).toBe(testGrupoId)
        expect(result.createdById).toBe(testUserId)
      })

      it('should create card without description', async () => {
        const dto = {
          title: 'Tarefa Simples',
          status: 'backlog',
          tab: KanbanTab.suporte,
          grupoId: testGrupoId,
        }

        const result = await service.createCard(dto, testUserId)

        expect(result.title).toBe(dto.title)
        expect(result.description).toBeNull()
      })

      it('should create card with assignee', async () => {
        const dto = {
          title: 'Tarefa Atribuida',
          status: 'doing',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
          assigneeId: testUserId,
        }

        const result = await service.createCard(dto, testUserId)

        expect(result.assigneeId).toBe(testUserId)
      })

      it('should add create timeline entry when card is created', async () => {
        const dto = {
          title: 'Tarefa com Timeline',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }

        const result = await service.createCard(dto, testUserId)

        expect(result.timeline).toBeDefined()
        expect(result.timeline.length).toBeGreaterThan(0)
        expect(result.timeline[0].type).toBe('create')
        expect(result.timeline[0].authorId).toBe(testUserId)
      })
    })

    describe('findAllCards', () => {
      it('should return empty list when no cards exist', async () => {
        const result = await service.findAllCards({ grupoId: testGrupoId })

        expect(result).toEqual([])
      })

      it('should return all cards for grupo', async () => {
        await service.createCard({
          title: 'Card 1',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        await service.createCard({
          title: 'Card 2',
          status: 'doing',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.findAllCards({ grupoId: testGrupoId })

        expect(result).toHaveLength(2)
      })

      it('should filter by tab', async () => {
        await service.createCard({
          title: 'Projeto Card',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        await service.createCard({
          title: 'Suporte Card',
          status: 'backlog',
          tab: KanbanTab.suporte,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.findAllCards({
          grupoId: testGrupoId,
          tab: KanbanTab.projetos,
        })

        expect(result).toHaveLength(1)
        expect(result[0].title).toBe('Projeto Card')
      })

      it('should filter by status', async () => {
        await service.createCard({
          title: 'Backlog Card',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        await service.createCard({
          title: 'Doing Card',
          status: 'doing',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.findAllCards({
          grupoId: testGrupoId,
          status: 'doing',
        })

        expect(result).toHaveLength(1)
        expect(result[0].title).toBe('Doing Card')
      })
    })

    describe('findCardById', () => {
      it('should return card by id', async () => {
        const created = await service.createCard({
          title: 'Card Especifico',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.findCardById(created.id)

        expect(result.id).toBe(created.id)
        expect(result.title).toBe('Card Especifico')
      })

      it('should throw NotFoundException when card does not exist', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000'

        await expect(service.findCardById(nonExistentId)).rejects.toThrow(NotFoundException)
        await expect(service.findCardById(nonExistentId)).rejects.toThrow('Card nao encontrado')
      })
    })

    describe('updateCard', () => {
      it('should update card title', async () => {
        const created = await service.createCard({
          title: 'Titulo Original',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.updateCard(created.id, { title: 'Titulo Atualizado' }, testUserId)

        expect(result.title).toBe('Titulo Atualizado')
      })

      it('should update card description', async () => {
        const created = await service.createCard({
          title: 'Card',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.updateCard(created.id, { description: 'Nova descricao' }, testUserId)

        expect(result.description).toBe('Nova descricao')
      })

      it('should add update timeline entry', async () => {
        const created = await service.createCard({
          title: 'Card',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.updateCard(created.id, { title: 'Updated' }, testUserId)

        const updateTimeline = result.timeline.find(t => t.type === 'update')
        expect(updateTimeline).toBeDefined()
        expect(updateTimeline?.authorId).toBe(testUserId)
      })

      it('should throw NotFoundException when updating non-existent card', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000'

        await expect(
          service.updateCard(nonExistentId, { title: 'New Title' }, testUserId)
        ).rejects.toThrow(NotFoundException)
      })
    })

    describe('deleteCard', () => {
      it('should soft delete a card', async () => {
        const created = await service.createCard({
          title: 'Card a Deletar',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        await service.deleteCard(created.id, false)

        // Card should still exist but with deletedAt set
        const card = await prisma.kanbanCard.findUnique({
          where: { id: created.id },
        })
        expect(card).toBeDefined()
        expect(card?.deletedAt).not.toBeNull()
      })

      it('should hard delete a card', async () => {
        const created = await service.createCard({
          title: 'Card a Deletar Hard',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        await service.deleteCard(created.id, true)

        // Card should not exist
        const card = await prisma.kanbanCard.findUnique({
          where: { id: created.id },
        })
        expect(card).toBeNull()
      })

      it('should throw NotFoundException when deleting non-existent card', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000'

        await expect(service.deleteCard(nonExistentId)).rejects.toThrow(NotFoundException)
      })
    })
  })

  describe('Card Movement', () => {
    describe('moveCard', () => {
      it('should move card to new status', async () => {
        const created = await service.createCard({
          title: 'Card para Mover',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.moveCard(created.id, 'doing', testUserId)

        expect(result.status).toBe('doing')
      })

      it('should add move timeline entry', async () => {
        const created = await service.createCard({
          title: 'Card para Mover',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.moveCard(created.id, 'doing', testUserId)

        const moveTimeline = result.timeline.find(t => t.type === 'move')
        expect(moveTimeline).toBeDefined()
        expect(moveTimeline?.content).toContain('backlog')
        expect(moveTimeline?.content).toContain('doing')
      })

      it('should throw NotFoundException when moving non-existent card', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000'

        await expect(service.moveCard(nonExistentId, 'doing', testUserId)).rejects.toThrow(NotFoundException)
      })
    })

    describe('assignCard', () => {
      it('should assign card to user', async () => {
        const created = await service.createCard({
          title: 'Card para Atribuir',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.assignCard(created.id, testUserId, testUserId)

        expect(result.assigneeId).toBe(testUserId)
      })

      it('should remove assignment when null is passed', async () => {
        const created = await service.createCard({
          title: 'Card Atribuido',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
          assigneeId: testUserId,
        }, testUserId)

        const result = await service.assignCard(created.id, null, testUserId)

        expect(result.assigneeId).toBeNull()
      })

      it('should add assign timeline entry', async () => {
        const created = await service.createCard({
          title: 'Card',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.assignCard(created.id, testUserId, testUserId)

        const assignTimeline = result.timeline.find(t => t.type === 'assign')
        expect(assignTimeline).toBeDefined()
      })
    })
  })

  describe('Tags Operations', () => {
    describe('addTag', () => {
      it('should add tag to card', async () => {
        const card = await service.createCard({
          title: 'Card com Tag',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.addTag(card.id, 'urgente', testGrupoId, testUserId, '#ff0000')

        expect(result.tags).toHaveLength(1)
        expect(result.tags[0].name).toBe('urgente')
        expect(result.tags[0].color).toBe('#ff0000')
      })

      it('should reuse existing tag', async () => {
        const card1 = await service.createCard({
          title: 'Card 1',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const card2 = await service.createCard({
          title: 'Card 2',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        await service.addTag(card1.id, 'feature', testGrupoId, testUserId)
        await service.addTag(card2.id, 'feature', testGrupoId, testUserId)

        // Should only have one tag in the database
        const tags = await service.getTags(testGrupoId)
        const featureTags = tags.filter(t => t.name === 'feature')
        expect(featureTags).toHaveLength(1)
      })

      it('should throw NotFoundException when card does not exist', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000'

        await expect(
          service.addTag(nonExistentId, 'tag', testGrupoId, testUserId)
        ).rejects.toThrow(NotFoundException)
      })
    })

    describe('removeTag', () => {
      it('should remove tag from card', async () => {
        const card = await service.createCard({
          title: 'Card com Tag',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const withTag = await service.addTag(card.id, 'remover', testGrupoId, testUserId)
        const tagId = withTag.tags[0].id

        const result = await service.removeTag(card.id, tagId, testUserId)

        expect(result.tags).toHaveLength(0)
      })
    })

    describe('getTags', () => {
      it('should return all tags for grupo', async () => {
        const card = await service.createCard({
          title: 'Card',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        await service.addTag(card.id, 'tag1', testGrupoId, testUserId)
        await service.addTag(card.id, 'tag2', testGrupoId, testUserId)

        const tags = await service.getTags(testGrupoId)

        expect(tags).toHaveLength(2)
        expect(tags.map(t => t.name)).toContain('tag1')
        expect(tags.map(t => t.name)).toContain('tag2')
      })
    })
  })

  describe('Links Operations', () => {
    describe('addLink', () => {
      it('should add link to card', async () => {
        const card = await service.createCard({
          title: 'Card com Link',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.addLink(card.id, 'Google', 'https://google.com', testUserId)

        expect(result.links).toHaveLength(1)
        expect(result.links[0].title).toBe('Google')
        expect(result.links[0].url).toBe('https://google.com')
      })

      it('should add multiple links to card', async () => {
        const card = await service.createCard({
          title: 'Card com Links',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        await service.addLink(card.id, 'Link 1', 'https://example1.com', testUserId)
        const result = await service.addLink(card.id, 'Link 2', 'https://example2.com', testUserId)

        expect(result.links).toHaveLength(2)
      })
    })

    describe('removeLink', () => {
      it('should remove link from card', async () => {
        const card = await service.createCard({
          title: 'Card com Link',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const withLink = await service.addLink(card.id, 'Remover', 'https://remove.com', testUserId)
        const linkId = withLink.links[0].id

        const result = await service.removeLink(card.id, linkId, testUserId)

        expect(result.links).toHaveLength(0)
      })
    })
  })

  describe('Comments/Timeline', () => {
    describe('addComment', () => {
      it('should add comment to card timeline', async () => {
        const card = await service.createCard({
          title: 'Card com Comentario',
          status: 'backlog',
          tab: KanbanTab.projetos,
          grupoId: testGrupoId,
        }, testUserId)

        const result = await service.addComment(card.id, 'Este eh um comentario', testUserId)

        const comment = result.timeline.find(t => t.type === 'comment')
        expect(comment).toBeDefined()
        expect(comment?.content).toBe('Este eh um comentario')
        expect(comment?.authorId).toBe(testUserId)
      })

      it('should throw NotFoundException when card does not exist', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000'

        await expect(
          service.addComment(nonExistentId, 'Comentario', testUserId)
        ).rejects.toThrow(NotFoundException)
      })
    })
  })
})
