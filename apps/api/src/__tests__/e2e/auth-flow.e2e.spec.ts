import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../../app.module'
import { PrismaService } from '../../prisma/prisma.service'
import { AppRole } from '../../auth/types/auth.types'

describe('Auth Flow E2E', () => {
  let app: INestApplication
  let prisma: PrismaService

  const createTestUser = async (role: AppRole = AppRole.ADMINISTRADOR) => {
    const userId = crypto.randomUUID()
    const email = `auth-${Date.now()}@test.com`

    await prisma.$executeRawUnsafe(`
      INSERT INTO users (id, email, name, email_verified, role, created_at, updated_at)
      VALUES ('${userId}', '${email}', 'Test User', true, '${role}', NOW(), NOW())
    `)

    await prisma.$executeRawUnsafe(`
      INSERT INTO houston.user_roles (user_id, role, grupo_ids, hospital_ids, setor_ids)
      VALUES ('${userId}'::uuid, '${role}'::houston.app_role, ARRAY[]::uuid[], ARRAY[]::uuid[], ARRAY[]::uuid[])
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
    await prisma.$executeRawUnsafe('DELETE FROM sessions')
    await prisma.$executeRawUnsafe('DELETE FROM houston.user_roles')
    await prisma.$executeRawUnsafe('DELETE FROM users')
  })

  describe('Session Management', () => {
    it('should return current user info', async () => {
      const { cookie, userId, email } = await createTestUser()

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookie)

      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe(userId)
      expect(response.body.data.email).toBe(email)
      expect(response.body.data.role).toBe(AppRole.ADMINISTRADOR)
    })

    it('should reject expired sessions', async () => {
      const userId = crypto.randomUUID()
      const email = `expired-${Date.now()}@test.com`
      const sessionToken = crypto.randomUUID()

      await prisma.$executeRawUnsafe(`
        INSERT INTO users (id, email, name, email_verified, role, created_at, updated_at)
        VALUES ('${userId}', '${email}', 'Test User', true, 'administrador', NOW(), NOW())
      `)

      await prisma.$executeRawUnsafe(`
        INSERT INTO houston.user_roles (user_id, role, grupo_ids, hospital_ids, setor_ids)
        VALUES ('${userId}'::uuid, 'administrador'::houston.app_role, ARRAY[]::uuid[], ARRAY[]::uuid[], ARRAY[]::uuid[])
      `)

      // Create expired session
      const expiredAt = new Date(Date.now() - 24 * 60 * 60 * 1000)
      await prisma.$executeRawUnsafe(`
        INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
        VALUES ('${crypto.randomUUID()}', '${userId}', '${sessionToken}', '${expiredAt.toISOString()}', NOW(), NOW())
      `)

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `better-auth.session_token=${sessionToken}`)

      expect(response.status).toBe(401)
    })

    it('should reject requests without session', async () => {
      const response = await request(app.getHttpServer()).get('/auth/me')

      expect(response.status).toBe(401)
    })
  })

  describe('Role Verification', () => {
    it('should return correct role for each user type', async () => {
      const roles = [
        AppRole.ADMINISTRADOR,
        AppRole.MODERADOR,
        AppRole.GESTOR,
        AppRole.COORDENADOR,
        AppRole.ESCALISTA,
      ]

      for (const role of roles) {
        const { cookie } = await createTestUser(role)

        const response = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Cookie', cookie)

        expect(response.status).toBe(200)
        expect(response.body.data.role).toBe(role)
      }
    })
  })

  describe('Protected Endpoints', () => {
    it('should require authentication for protected routes', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/grupos' },
        { method: 'get', path: '/hospitais' },
        { method: 'get', path: '/medicos' },
        { method: 'get', path: '/vagas' },
        { method: 'get', path: '/tickets' },
      ]

      for (const endpoint of protectedEndpoints) {
        const response = await request(app.getHttpServer())[
          endpoint.method as 'get'
        ](endpoint.path)

        expect(response.status).toBe(401)
      }
    })

    it('should allow access with valid session', async () => {
      const { cookie } = await createTestUser()

      const protectedEndpoints = [
        { method: 'get', path: '/grupos' },
        { method: 'get', path: '/hospitais' },
        { method: 'get', path: '/medicos' },
        { method: 'get', path: '/vagas' },
        { method: 'get', path: '/tickets' },
      ]

      for (const endpoint of protectedEndpoints) {
        const response = await request(app.getHttpServer())
          [endpoint.method as 'get'](endpoint.path)
          .set('Cookie', cookie)

        expect(response.status).toBe(200)
      }
    })
  })
})
