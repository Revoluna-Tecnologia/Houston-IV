import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../../app.module'
import { PrismaService } from '../../prisma/prisma.service'
import { AppRole } from '../../auth/types/auth.types'

describe('Tickets Flow E2E', () => {
  let app: INestApplication
  let prisma: PrismaService
  let testGrupoId: string
  let testUserId: string

  const createTestUser = async (role: AppRole = AppRole.ADMINISTRADOR) => {
    const userId = crypto.randomUUID()
    const email = `tickets-${role}-${Date.now()}@test.com`

    await prisma.$executeRawUnsafe(`
      INSERT INTO users (id, email, name, email_verified, role, created_at, updated_at)
      VALUES ('${userId}', '${email}', 'Test User', true, '${role}', NOW(), NOW())
    `)

    await prisma.$executeRawUnsafe(`
      INSERT INTO houston.user_roles (user_id, role, grupo_ids, hospital_ids, setor_ids)
      VALUES ('${userId}'::uuid, '${role}'::houston.app_role, ARRAY['${testGrupoId}']::uuid[], ARRAY[]::uuid[], ARRAY[]::uuid[])
    `)

    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.$executeRawUnsafe(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
      VALUES ('${crypto.randomUUID()}', '${userId}', '${sessionToken}', '${expiresAt.toISOString()}', NOW(), NOW())
    `)

    return {
      userId,
      email,
      sessionToken,
      cookie: `better-auth.session_token=${sessionToken}`,
    }
  }

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      })
    )
    await app.init()

    prisma = moduleRef.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    // Clean up
    await prisma.ticketComment.deleteMany()
    await prisma.ticketAttachment.deleteMany()
    await prisma.ticket.deleteMany()
    await prisma.$executeRawUnsafe('DELETE FROM sessions')
    await prisma.$executeRawUnsafe('DELETE FROM houston.user_roles')
    await prisma.$executeRawUnsafe('DELETE FROM users')
    await prisma.grupo.deleteMany()

    // Create test data
    const grupo = await prisma.grupo.create({
      data: { nome: 'Grupo Tickets E2E' },
    })
    testGrupoId = grupo.id

    // Create a test user for reference
    testUserId = crypto.randomUUID()
    await prisma.$executeRawUnsafe(`
      INSERT INTO users (id, email, name, email_verified, role, created_at, updated_at)
      VALUES ('${testUserId}', 'base-user@test.com', 'Base User', true, 'administrador', NOW(), NOW())
    `)
  })

  describe('Ticket CRUD Flow', () => {
    it('should create a ticket', async () => {
      const { cookie, userId } = await createTestUser()

      const createResponse = await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Bug no login',
          description: 'Usuarios nao conseguem fazer login',
          priority: 'high',
          category: 'functionality',
          type: 'bug',
          sector: 'dev',
          grupoId: testGrupoId,
        })

      expect(createResponse.status).toBe(201)
      expect(createResponse.body.data.id).toBeDefined()
      expect(createResponse.body.data.title).toBe('Bug no login')
      expect(createResponse.body.data.status).toBe('open')
      expect(createResponse.body.data.createdById).toBe(userId)
    })

    it('should list tickets with pagination', async () => {
      const { cookie } = await createTestUser()

      // Create 5 tickets
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/tickets')
          .set('Cookie', cookie)
          .send({
            title: `Ticket ${i + 1}`,
            description: `Descricao ${i + 1}`,
            priority: 'medium',
            category: 'ui',
            type: 'bug',
            sector: 'dev',
            grupoId: testGrupoId,
          })
      }

      // List with pagination
      const listResponse = await request(app.getHttpServer())
        .get('/tickets?page=1&limit=3')
        .set('Cookie', cookie)

      expect(listResponse.status).toBe(200)
      expect(listResponse.body.data).toHaveLength(3)
      expect(listResponse.body.pagination.total).toBe(5)
    })

    it('should get ticket by id', async () => {
      const { cookie } = await createTestUser()

      // Create ticket
      const createResponse = await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket de teste',
          description: 'Descricao de teste',
          priority: 'low',
          category: 'other',
          type: 'support',
          sector: 'comercial',
          grupoId: testGrupoId,
        })

      const ticketId = createResponse.body.data.id

      // Get ticket
      const getResponse = await request(app.getHttpServer())
        .get(`/tickets/${ticketId}`)
        .set('Cookie', cookie)

      expect(getResponse.status).toBe(200)
      expect(getResponse.body.data.id).toBe(ticketId)
      expect(getResponse.body.data.title).toBe('Ticket de teste')
    })

    it('should update a ticket', async () => {
      const { cookie } = await createTestUser()

      // Create ticket
      const createResponse = await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket original',
          description: 'Descricao original',
          priority: 'low',
          category: 'ui',
          type: 'bug',
          sector: 'dev',
          grupoId: testGrupoId,
        })

      const ticketId = createResponse.body.data.id

      // Update ticket
      const updateResponse = await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}`)
        .set('Cookie', cookie)
        .send({
          title: 'Ticket atualizado',
          priority: 'high',
        })

      expect(updateResponse.status).toBe(200)
      expect(updateResponse.body.data.title).toBe('Ticket atualizado')
      expect(updateResponse.body.data.priority).toBe('high')
    })
  })

  describe('Ticket Status Flow', () => {
    it('should change ticket status through lifecycle', async () => {
      const { cookie, userId } = await createTestUser()

      // Create ticket
      const createResponse = await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket lifecycle',
          description: 'Teste de ciclo de vida',
          priority: 'medium',
          category: 'functionality',
          type: 'incident',
          sector: 'dev',
          grupoId: testGrupoId,
        })

      const ticketId = createResponse.body.data.id
      expect(createResponse.body.data.status).toBe('open')

      // Assign ticket
      const assignResponse = await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/assign`)
        .set('Cookie', cookie)
        .send({ assignedToId: userId })

      expect(assignResponse.status).toBe(200)
      expect(assignResponse.body.data.assignedToId).toBe(userId)

      // Move to in_progress
      const progressResponse = await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}`)
        .set('Cookie', cookie)
        .send({ status: 'in_progress' })

      expect(progressResponse.status).toBe(200)
      expect(progressResponse.body.data.status).toBe('in_progress')

      // Resolve ticket
      const resolveResponse = await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}`)
        .set('Cookie', cookie)
        .send({ status: 'resolved' })

      expect(resolveResponse.status).toBe(200)
      expect(resolveResponse.body.data.status).toBe('resolved')
      expect(resolveResponse.body.data.resolvedAt).toBeDefined()

      // Close ticket
      const closeResponse = await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}`)
        .set('Cookie', cookie)
        .send({ status: 'closed' })

      expect(closeResponse.status).toBe(200)
      expect(closeResponse.body.data.status).toBe('closed')
    })
  })

  describe('Ticket Comments', () => {
    it('should add comment to ticket', async () => {
      const { cookie, userId } = await createTestUser()

      // Create ticket
      const createResponse = await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket com comentarios',
          description: 'Teste de comentarios',
          priority: 'medium',
          category: 'ui',
          type: 'improvement',
          sector: 'dev',
          grupoId: testGrupoId,
        })

      const ticketId = createResponse.body.data.id

      // Add comment
      const commentResponse = await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/comments`)
        .set('Cookie', cookie)
        .send({ content: 'Primeiro comentario' })

      expect(commentResponse.status).toBe(201)
      expect(commentResponse.body.data.content).toBe('Primeiro comentario')
      expect(commentResponse.body.data.authorId).toBe(userId)
    })

    it('should list comments for ticket', async () => {
      const { cookie } = await createTestUser()

      // Create ticket
      const createResponse = await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket com multiplos comentarios',
          description: 'Teste de listagem',
          priority: 'low',
          category: 'other',
          type: 'support',
          sector: 'comercial',
          grupoId: testGrupoId,
        })

      const ticketId = createResponse.body.data.id

      // Add multiple comments
      await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/comments`)
        .set('Cookie', cookie)
        .send({ content: 'Comentario 1' })

      await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/comments`)
        .set('Cookie', cookie)
        .send({ content: 'Comentario 2' })

      // List comments
      const listResponse = await request(app.getHttpServer())
        .get(`/tickets/${ticketId}/comments`)
        .set('Cookie', cookie)

      expect(listResponse.status).toBe(200)
      expect(listResponse.body.data).toHaveLength(2)
    })

    it('should update own comment', async () => {
      const { cookie } = await createTestUser()

      // Create ticket
      const createResponse = await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket para editar comentario',
          description: 'Teste',
          priority: 'low',
          category: 'ui',
          type: 'bug',
          sector: 'dev',
          grupoId: testGrupoId,
        })

      const ticketId = createResponse.body.data.id

      // Add comment
      const commentResponse = await request(app.getHttpServer())
        .post(`/tickets/${ticketId}/comments`)
        .set('Cookie', cookie)
        .send({ content: 'Comentario original' })

      const commentId = commentResponse.body.data.id

      // Update comment
      const updateResponse = await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}/comments/${commentId}`)
        .set('Cookie', cookie)
        .send({ content: 'Comentario atualizado' })

      expect(updateResponse.status).toBe(200)
      expect(updateResponse.body.data.content).toBe('Comentario atualizado')
    })
  })

  describe('Ticket Filtering', () => {
    it('should filter tickets by status', async () => {
      const { cookie } = await createTestUser()

      // Create open ticket
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket aberto',
          description: 'Teste',
          priority: 'low',
          category: 'ui',
          type: 'bug',
          sector: 'dev',
          grupoId: testGrupoId,
        })

      // Create resolved ticket
      const resolvedResponse = await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket resolvido',
          description: 'Teste',
          priority: 'low',
          category: 'ui',
          type: 'bug',
          sector: 'dev',
          grupoId: testGrupoId,
        })

      await request(app.getHttpServer())
        .patch(`/tickets/${resolvedResponse.body.data.id}`)
        .set('Cookie', cookie)
        .send({ status: 'resolved' })

      // Filter by open status
      const openResponse = await request(app.getHttpServer())
        .get('/tickets?status=open')
        .set('Cookie', cookie)

      expect(openResponse.status).toBe(200)
      expect(openResponse.body.data).toHaveLength(1)
      expect(openResponse.body.data[0].title).toBe('Ticket aberto')

      // Filter by resolved status
      const resolvedFilterResponse = await request(app.getHttpServer())
        .get('/tickets?status=resolved')
        .set('Cookie', cookie)

      expect(resolvedFilterResponse.status).toBe(200)
      expect(resolvedFilterResponse.body.data).toHaveLength(1)
      expect(resolvedFilterResponse.body.data[0].title).toBe('Ticket resolvido')
    })

    it('should filter tickets by priority', async () => {
      const { cookie } = await createTestUser()

      // Create low priority ticket
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket low',
          description: 'Teste',
          priority: 'low',
          category: 'ui',
          type: 'bug',
          sector: 'dev',
          grupoId: testGrupoId,
        })

      // Create high priority ticket
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket high',
          description: 'Teste',
          priority: 'high',
          category: 'ui',
          type: 'bug',
          sector: 'dev',
          grupoId: testGrupoId,
        })

      // Filter by high priority
      const highResponse = await request(app.getHttpServer())
        .get('/tickets?priority=high')
        .set('Cookie', cookie)

      expect(highResponse.status).toBe(200)
      expect(highResponse.body.data).toHaveLength(1)
      expect(highResponse.body.data[0].title).toBe('Ticket high')
    })

    it('should filter tickets by sector', async () => {
      const { cookie } = await createTestUser()

      // Create dev ticket
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket dev',
          description: 'Teste',
          priority: 'low',
          category: 'ui',
          type: 'bug',
          sector: 'dev',
          grupoId: testGrupoId,
        })

      // Create comercial ticket
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket comercial',
          description: 'Teste',
          priority: 'low',
          category: 'ui',
          type: 'support',
          sector: 'comercial',
          grupoId: testGrupoId,
        })

      // Filter by dev sector
      const devResponse = await request(app.getHttpServer())
        .get('/tickets?sector=dev')
        .set('Cookie', cookie)

      expect(devResponse.status).toBe(200)
      expect(devResponse.body.data).toHaveLength(1)
      expect(devResponse.body.data[0].title).toBe('Ticket dev')
    })
  })

  describe('Ticket Analytics', () => {
    it('should return analytics data', async () => {
      const { cookie } = await createTestUser()

      // Create some tickets with different statuses
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket 1',
          description: 'Teste',
          priority: 'low',
          category: 'ui',
          type: 'bug',
          sector: 'dev',
          grupoId: testGrupoId,
        })

      await request(app.getHttpServer())
        .post('/tickets')
        .set('Cookie', cookie)
        .send({
          title: 'Ticket 2',
          description: 'Teste',
          priority: 'high',
          category: 'functionality',
          type: 'incident',
          sector: 'comercial',
          grupoId: testGrupoId,
        })

      // Get analytics
      const analyticsResponse = await request(app.getHttpServer())
        .get('/tickets/analytics')
        .set('Cookie', cookie)

      expect(analyticsResponse.status).toBe(200)
      expect(analyticsResponse.body.data.totalTickets).toBe(2)
      expect(analyticsResponse.body.data.byStatus).toBeDefined()
      expect(analyticsResponse.body.data.byPriority).toBeDefined()
      expect(analyticsResponse.body.data.byCategory).toBeDefined()
      expect(analyticsResponse.body.data.bySector).toBeDefined()
    })
  })
})
