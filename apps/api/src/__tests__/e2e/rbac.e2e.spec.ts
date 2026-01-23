import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../../app.module'
import { PrismaService } from '../../prisma/prisma.service'
import { AppRole } from '../../auth/types/auth.types'

describe('RBAC E2E', () => {
  let app: INestApplication
  let prisma: PrismaService
  let testGrupoId: string

  const createTestUser = async (role: AppRole) => {
    const userId = crypto.randomUUID()
    const email = `${role.toLowerCase()}-${Date.now()}@test.com`

    // Create user
    await prisma.$executeRawUnsafe(`
      INSERT INTO users (id, email, name, email_verified, role, created_at, updated_at)
      VALUES ('${userId}', '${email}', 'Test ${role}', true, '${role}', NOW(), NOW())
    `)

    // Create user_roles
    await prisma.$executeRawUnsafe(`
      INSERT INTO houston.user_roles (user_id, role, grupo_ids, hospital_ids, setor_ids)
      VALUES ('${userId}'::uuid, '${role}'::houston.app_role, ARRAY[]::uuid[], ARRAY[]::uuid[], ARRAY[]::uuid[])
    `)

    // Create session
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
    // Clean up test data
    await prisma.$executeRawUnsafe('DELETE FROM sessions')
    await prisma.$executeRawUnsafe('DELETE FROM houston.user_roles')
    await prisma.$executeRawUnsafe('DELETE FROM users')
    await prisma.grupo.deleteMany()

    // Create test grupo
    const grupo = await prisma.grupo.create({
      data: { nome: 'Grupo de Teste E2E' },
    })
    testGrupoId = grupo.id
  })

  describe('Authentication', () => {
    it('should reject requests without session cookie', async () => {
      const response = await request(app.getHttpServer()).get('/grupos')

      expect(response.status).toBe(401)
    })

    it('should reject requests with invalid session token', async () => {
      const response = await request(app.getHttpServer())
        .get('/grupos')
        .set('Cookie', 'better-auth.session_token=invalid-token')

      expect(response.status).toBe(401)
    })

    it('should accept requests with valid session token', async () => {
      const { cookie } = await createTestUser(AppRole.ADMINISTRADOR)

      const response = await request(app.getHttpServer())
        .get('/grupos')
        .set('Cookie', cookie)

      expect(response.status).toBe(200)
    })
  })

  describe('Role-based Access Control', () => {
    describe('Administrador (highest level)', () => {
      it('should have access to all CRUD operations on grupos', async () => {
        const { cookie } = await createTestUser(AppRole.ADMINISTRADOR)

        // CREATE
        const createResponse = await request(app.getHttpServer())
          .post('/grupos')
          .set('Cookie', cookie)
          .send({ nome: 'Novo Grupo' })

        expect(createResponse.status).toBe(201)
        const grupoId = createResponse.body.data.id

        // READ
        const readResponse = await request(app.getHttpServer())
          .get(`/grupos/${grupoId}`)
          .set('Cookie', cookie)

        expect(readResponse.status).toBe(200)

        // UPDATE
        const updateResponse = await request(app.getHttpServer())
          .put(`/grupos/${grupoId}`)
          .set('Cookie', cookie)
          .send({ nome: 'Grupo Atualizado' })

        expect(updateResponse.status).toBe(200)

        // DELETE
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/grupos/${grupoId}`)
          .set('Cookie', cookie)

        expect(deleteResponse.status).toBe(204)
      })

      it('should have access to all endpoints', async () => {
        const { cookie } = await createTestUser(AppRole.ADMINISTRADOR)

        // Test multiple endpoints
        const endpoints = [
          { method: 'get', path: '/grupos' },
          { method: 'get', path: '/especialidades' },
          { method: 'get', path: '/hospitais' },
          { method: 'get', path: '/medicos' },
        ]

        for (const endpoint of endpoints) {
          const response = await request(app.getHttpServer())
            [endpoint.method as 'get'](endpoint.path)
            .set('Cookie', cookie)

          expect(response.status).toBe(200)
        }
      })
    })

    describe('Escalista (lowest level)', () => {
      it('should have read-only access to grupos', async () => {
        const { cookie } = await createTestUser(AppRole.ESCALISTA)

        // READ should work
        const readResponse = await request(app.getHttpServer())
          .get('/grupos')
          .set('Cookie', cookie)

        expect(readResponse.status).toBe(200)

        // CREATE should be forbidden
        const createResponse = await request(app.getHttpServer())
          .post('/grupos')
          .set('Cookie', cookie)
          .send({ nome: 'Novo Grupo' })

        expect(createResponse.status).toBe(403)

        // UPDATE should be forbidden
        const updateResponse = await request(app.getHttpServer())
          .put(`/grupos/${testGrupoId}`)
          .set('Cookie', cookie)
          .send({ nome: 'Grupo Atualizado' })

        expect(updateResponse.status).toBe(403)

        // DELETE should be forbidden
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/grupos/${testGrupoId}`)
          .set('Cookie', cookie)

        expect(deleteResponse.status).toBe(403)
      })
    })

    describe('Gestor (mid level)', () => {
      it('should have read access but limited write access', async () => {
        const { cookie } = await createTestUser(AppRole.GESTOR)

        // READ should work
        const readResponse = await request(app.getHttpServer())
          .get('/grupos')
          .set('Cookie', cookie)

        expect(readResponse.status).toBe(200)

        // DELETE should be forbidden (only admin can delete)
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/grupos/${testGrupoId}`)
          .set('Cookie', cookie)

        expect(deleteResponse.status).toBe(403)
      })
    })
  })

  describe('Permission Hierarchy', () => {
    it('higher roles should have access to lower role endpoints', async () => {
      // Create users for each role
      const admin = await createTestUser(AppRole.ADMINISTRADOR)
      const moderador = await createTestUser(AppRole.MODERADOR)
      const gestor = await createTestUser(AppRole.GESTOR)
      const coordenador = await createTestUser(AppRole.COORDENADOR)
      const escalista = await createTestUser(AppRole.ESCALISTA)

      // Test read access (all should have)
      for (const user of [admin, moderador, gestor, coordenador, escalista]) {
        const response = await request(app.getHttpServer())
          .get('/grupos')
          .set('Cookie', user.cookie)

        expect(response.status).toBe(200)
      }

      // Test create access (only admin, moderador should have)
      const createResponses = await Promise.all([
        request(app.getHttpServer())
          .post('/grupos')
          .set('Cookie', admin.cookie)
          .send({ nome: 'Admin Grupo' }),
        request(app.getHttpServer())
          .post('/grupos')
          .set('Cookie', moderador.cookie)
          .send({ nome: 'Moderador Grupo' }),
        request(app.getHttpServer())
          .post('/grupos')
          .set('Cookie', gestor.cookie)
          .send({ nome: 'Gestor Grupo' }),
        request(app.getHttpServer())
          .post('/grupos')
          .set('Cookie', coordenador.cookie)
          .send({ nome: 'Coordenador Grupo' }),
        request(app.getHttpServer())
          .post('/grupos')
          .set('Cookie', escalista.cookie)
          .send({ nome: 'Escalista Grupo' }),
      ])

      expect(createResponses[0].status).toBe(201) // admin
      expect(createResponses[1].status).toBe(201) // moderador
      expect(createResponses[2].status).toBe(403) // gestor
      expect(createResponses[3].status).toBe(403) // coordenador
      expect(createResponses[4].status).toBe(403) // escalista
    })
  })
})
