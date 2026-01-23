import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../prisma/prisma.service'
import { AppRole, AppPermission } from '../../auth/types/auth.types'

export interface TestUser {
  id: string
  email: string
  name: string
  role: AppRole
  sessionToken?: string
}

const rolePermissions: Record<AppRole, AppPermission[]> = {
  [AppRole.ADMINISTRADOR]: Object.values(AppPermission),
  [AppRole.MODERADOR]: [
    AppPermission.VAGAS_SELECT,
    AppPermission.VAGAS_INSERT,
    AppPermission.VAGAS_UPDATE,
    AppPermission.MEDICOS_SELECT,
    AppPermission.MEDICOS_INSERT,
    AppPermission.MEDICOS_UPDATE,
    AppPermission.HOSPITAIS_SELECT,
    AppPermission.HOSPITAIS_INSERT,
    AppPermission.HOSPITAIS_UPDATE,
    AppPermission.GRUPOS_SELECT,
    AppPermission.GRUPOS_INSERT,
    AppPermission.GRUPOS_UPDATE,
    AppPermission.CANDIDATURAS_SELECT,
    AppPermission.CANDIDATURAS_INSERT,
    AppPermission.CANDIDATURAS_UPDATE,
    AppPermission.RELATORIOS_SELECT,
    AppPermission.PAGAMENTOS_SELECT,
    AppPermission.CHECKIN_CHECKOUT_SELECT,
    AppPermission.CHECKIN_CHECKOUT_INSERT,
    AppPermission.CHECKIN_CHECKOUT_UPDATE,
    AppPermission.MEMBROS_SELECT,
    AppPermission.MEMBROS_INSERT,
    AppPermission.MEMBROS_UPDATE,
  ],
  [AppRole.GESTOR]: [
    AppPermission.VAGAS_SELECT,
    AppPermission.VAGAS_INSERT,
    AppPermission.VAGAS_UPDATE,
    AppPermission.MEDICOS_SELECT,
    AppPermission.HOSPITAIS_SELECT,
    AppPermission.GRUPOS_SELECT,
    AppPermission.CANDIDATURAS_SELECT,
    AppPermission.CANDIDATURAS_UPDATE,
    AppPermission.RELATORIOS_SELECT,
    AppPermission.PAGAMENTOS_SELECT,
    AppPermission.CHECKIN_CHECKOUT_SELECT,
    AppPermission.CHECKIN_CHECKOUT_INSERT,
    AppPermission.MEMBROS_SELECT,
  ],
  [AppRole.COORDENADOR]: [
    AppPermission.VAGAS_SELECT,
    AppPermission.MEDICOS_SELECT,
    AppPermission.HOSPITAIS_SELECT,
    AppPermission.GRUPOS_SELECT,
    AppPermission.CANDIDATURAS_SELECT,
    AppPermission.RELATORIOS_SELECT,
    AppPermission.CHECKIN_CHECKOUT_SELECT,
    AppPermission.MEMBROS_SELECT,
  ],
  [AppRole.ESCALISTA]: [
    AppPermission.VAGAS_SELECT,
    AppPermission.CANDIDATURAS_SELECT,
    AppPermission.CANDIDATURAS_INSERT,
    AppPermission.CHECKIN_CHECKOUT_SELECT,
    AppPermission.CHECKIN_CHECKOUT_INSERT,
  ],
}

export async function createTestUser(
  prisma: PrismaService,
  role: AppRole,
  grupoIds: string[] = [],
  hospitalIds: string[] = [],
  setorIds: string[] = []
): Promise<TestUser> {
  const userId = crypto.randomUUID()
  const email = `${role.toLowerCase()}-${Date.now()}@test.com`
  const name = `Test ${role}`

  // Create user in auth schema
  await prisma.$executeRawUnsafe(`
    INSERT INTO users (id, email, name, email_verified, role, grupo_ids, created_at, updated_at)
    VALUES ('${userId}', '${email}', '${name}', true, '${role}', ARRAY[]::text[], NOW(), NOW())
  `)

  // Create user_roles entry
  await prisma.$executeRawUnsafe(`
    INSERT INTO houston.user_roles (user_id, role, grupo_ids, hospital_ids, setor_ids)
    VALUES ('${userId}'::uuid, '${role}'::houston.app_role,
      ARRAY[${grupoIds.map((id) => `'${id}'`).join(',')}]::uuid[],
      ARRAY[${hospitalIds.map((id) => `'${id}'`).join(',')}]::uuid[],
      ARRAY[${setorIds.map((id) => `'${id}'`).join(',')}]::uuid[]
    )
  `)

  return {
    id: userId,
    email,
    name,
    role,
  }
}

export async function createTestSession(
  prisma: PrismaService,
  userId: string
): Promise<string> {
  const sessionToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.$executeRawUnsafe(`
    INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
    VALUES ('${crypto.randomUUID()}', '${userId}', '${sessionToken}', '${expiresAt.toISOString()}', NOW(), NOW())
  `)

  return sessionToken
}

export async function loginAs(
  app: INestApplication,
  prisma: PrismaService,
  role: AppRole
): Promise<{ user: TestUser; cookie: string }> {
  const user = await createTestUser(prisma, role)
  const sessionToken = await createTestSession(prisma, user.id)

  user.sessionToken = sessionToken

  // Create cookie header similar to Better Auth
  const cookie = `better-auth.session_token=${sessionToken}`

  return { user, cookie }
}

export async function makeAuthenticatedRequest(
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  cookie: string,
  body?: Record<string, unknown>
): Promise<request.Response> {
  const req = request(app.getHttpServer())[method](path).set('Cookie', cookie)

  if (body) {
    return req.send(body)
  }

  return req
}

export function getPermissionsForRole(role: AppRole): AppPermission[] {
  return rolePermissions[role] || []
}
