# Plano de Implementação: Score 10/10 - Houston IV API

## Resumo Executivo

Implementar melhorias para alcançar Score 10/10 em Segurança e Score Geral:

| Categoria | Atual | Meta | Status |
|-----------|-------|------|--------|
| Segurança | 9.0/10 | 10/10 | 🔄 Em Progresso |
| Testes | 9.0/10 | 10/10 | 🔄 Em Progresso |
| Documentação | 7.5/10 | 10/10 | 🔄 Em Progresso |

### Escopo do Plano:
1. ✅ **RBAC e Rate Limiting** - JÁ IMPLEMENTADO (Sprint 3)
2. ✅ **Permissões Granulares** - @RequirePermissions aplicado em 76 endpoints (12 controllers)
3. 🔄 **Testes de Segurança** - Testes dos guards (auth, permissions, roles)
4. 🔄 **Testes de Integração** - Com banco de dados real
5. 🔄 **Testes E2E** - Fluxos completos via HTTP
6. 🔄 **Auditoria de Ações** - Log de quem fez o quê
7. 🔄 **Documentação Completa** - README, /docs, ADRs

---

## 1. Sistema RBAC - Estrutura Atual (JÁ IMPLEMENTADO)

### 1.1 Roles Hierárquicos (5 níveis)
| Role | Nível | Permissões |
|------|-------|------------|
| `administrador` | 4 | 36 (CRUD completo em todos os recursos) |
| `moderador` | 3 | 31 |
| `gestor` | 2 | 30 |
| `coordenador` | 1 | 24 |
| `escalista` | 0 | 19 (nível base) |

### 1.2 Recursos e Permissões (Padrão CRUD)
```
vagas, membros, medicos, grupos, roles, candidaturas,
hospitais, relatorios, pagamentos, checkin_checkout
```

Cada recurso possui: `.select`, `.insert`, `.update`, `.delete`

### 1.3 Tabelas no Schema `houston`
- **`user_roles`**: user_id, role, grupo_ids[], hospital_ids[], setor_ids[]
- **`role_permissions`**: role, permission (140 registros)

---

## 2. Arquivos a Criar/Modificar

### 2.1 Novos Arquivos (RBAC)

```
apps/api/src/
├── auth/
│   ├── auth.module.ts              # Módulo de autenticação
│   ├── decorators/
│   │   ├── current-user.decorator.ts    # @CurrentUser()
│   │   ├── permissions.decorator.ts     # @RequirePermissions()
│   │   └── roles.decorator.ts           # @RequireRoles()
│   ├── guards/
│   │   ├── auth.guard.ts               # Guard de autenticação
│   │   ├── permissions.guard.ts        # Guard de permissões
│   │   └── roles.guard.ts              # Guard de roles
│   ├── types/
│   │   └── auth.types.ts               # Tipos e enums
│   └── services/
│       └── permissions.service.ts      # Serviço de permissões
```

### 2.2 Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `apps/api/src/app.module.ts` | Importar AuthModule, ThrottlerModule |
| `apps/api/src/main.ts` | Adicionar ThrottlerGuard global |
| `apps/api/src/**/*.controller.ts` | Adicionar decorators de permissão |

---

## 3. Implementação Detalhada

### 3.1 Tipos e Enums (`auth/types/auth.types.ts`)

```typescript
export enum AppRole {
  ADMINISTRADOR = 'administrador',
  MODERADOR = 'moderador',
  GESTOR = 'gestor',
  COORDENADOR = 'coordenador',
  ESCALISTA = 'escalista',
}

export enum AppPermission {
  // Vagas
  VAGAS_SELECT = 'vagas.select',
  VAGAS_INSERT = 'vagas.insert',
  VAGAS_UPDATE = 'vagas.update',
  VAGAS_DELETE = 'vagas.delete',
  // ... demais permissões
}

export const ROLE_HIERARCHY: Record<AppRole, number> = {
  [AppRole.ADMINISTRADOR]: 4,
  [AppRole.MODERADOR]: 3,
  [AppRole.GESTOR]: 2,
  [AppRole.COORDENADOR]: 1,
  [AppRole.ESCALISTA]: 0,
}

export interface AuthenticatedUser {
  id: string
  email: string
  roles: AppRole[]
  permissions: AppPermission[]
  grupoIds: string[]
  hospitalIds: string[]
  setorIds: string[]
}
```

### 3.2 Decorator @CurrentUser (`auth/decorators/current-user.decorator.ts`)

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user
    return data ? user?.[data] : user
  }
)
```

### 3.3 Decorator @RequirePermissions (`auth/decorators/permissions.decorator.ts`)

```typescript
import { SetMetadata } from '@nestjs/common'
import { AppPermission } from '../types/auth.types'

export const PERMISSIONS_KEY = 'permissions'
export const RequirePermissions = (...permissions: AppPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions)
```

### 3.4 Auth Guard (`auth/guards/auth.guard.ts`)

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Better Auth já popula req.user via session cookie
    const session = request.session
    if (!session?.user) {
      throw new UnauthorizedException('Sessão inválida')
    }

    // Buscar roles e permissões do usuário
    const userRoles = await this.prisma.$queryRaw`
      SELECT ur.role, ur.grupo_ids, ur.hospital_ids, ur.setor_ids
      FROM houston.user_roles ur
      WHERE ur.user_id = ${session.user.id}::uuid
    `

    // Buscar permissões baseadas nas roles
    const permissions = await this.prisma.$queryRaw`
      SELECT DISTINCT rp.permission
      FROM houston.role_permissions rp
      WHERE rp.role = ANY(${userRoles.map(r => r.role)})
    `

    request.user = {
      id: session.user.id,
      email: session.user.email,
      roles: userRoles.map(r => r.role),
      permissions: permissions.map(p => p.permission),
      grupoIds: [...new Set(userRoles.flatMap(r => r.grupo_ids))],
      hospitalIds: [...new Set(userRoles.flatMap(r => r.hospital_ids))],
      setorIds: [...new Set(userRoles.flatMap(r => r.setor_ids))],
    }

    return true
  }
}
```

### 3.5 Permissions Guard (`auth/guards/permissions.guard.ts`)

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<AppPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!requiredPermissions?.length) {
      return true // Nenhuma permissão requerida
    }

    const { user } = context.switchToHttp().getRequest()

    if (!user?.permissions) {
      throw new ForbiddenException('Usuário sem permissões')
    }

    const hasPermission = requiredPermissions.every(
      permission => user.permissions.includes(permission)
    )

    if (!hasPermission) {
      throw new ForbiddenException('Permissão insuficiente')
    }

    return true
  }
}
```

### 3.6 Rate Limiting (`app.module.ts`)

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,    // 1 segundo
        limit: 3,     // 3 requisições
      },
      {
        name: 'medium',
        ttl: 10000,   // 10 segundos
        limit: 20,    // 20 requisições
      },
      {
        name: 'long',
        ttl: 60000,   // 1 minuto
        limit: 100,   // 100 requisições
      },
    ]),
    // ... outros imports
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
```

---

## 4. Exemplo de Uso nos Controllers

```typescript
@Controller('vagas')
@UseGuards(AuthGuard, PermissionsGuard)
export class VagasController {

  @Get()
  @RequirePermissions(AppPermission.VAGAS_SELECT)
  findAll(@CurrentUser() user: AuthenticatedUser) {
    // Filtrar por grupoIds/hospitalIds do usuário
    return this.vagasService.findAll(user.hospitalIds)
  }

  @Post()
  @RequirePermissions(AppPermission.VAGAS_INSERT)
  create(@Body() dto: CreateVagaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.vagasService.create(dto, user)
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.VAGAS_DELETE)
  remove(@Param('id') id: string) {
    return this.vagasService.remove(id)
  }
}
```

---

## 5. Ordem de Implementação

### Fase 1: Infraestrutura Base
1. [ ] Criar `auth/types/auth.types.ts` com enums e interfaces
2. [ ] Criar `auth/services/permissions.service.ts`
3. [ ] Criar `auth/auth.module.ts`

### Fase 2: Decorators e Guards
4. [ ] Criar `auth/decorators/current-user.decorator.ts`
5. [ ] Criar `auth/decorators/permissions.decorator.ts`
6. [ ] Criar `auth/decorators/roles.decorator.ts`
7. [ ] Criar `auth/guards/auth.guard.ts`
8. [ ] Criar `auth/guards/permissions.guard.ts`

### Fase 3: Rate Limiting
9. [ ] Modificar `app.module.ts` - adicionar ThrottlerModule
10. [ ] Modificar `main.ts` - adicionar ThrottlerGuard global

### Fase 4: Aplicar nos Controllers
11. [ ] Adicionar guards e decorators em cada controller:
    - `vagas.controller.ts`
    - `medicos.controller.ts`
    - `hospitais.controller.ts`
    - `grupos.controller.ts`
    - `candidaturas.controller.ts`
    - `escalistas.controller.ts`
    - `relatorios.controller.ts`
    - `pagamentos.controller.ts`
    - `checkin-checkout.controller.ts`
    - `grades.controller.ts`
    - `setores.controller.ts`
    - `especialidades.controller.ts`

---

## 6. FASE 1: Permissões Granulares nos Controllers

### 6.1 Objetivo
Aplicar `@RequirePermissions()` em todos os 76 endpoints para controle granular.

### 6.2 Mapeamento de Endpoints por Controller

| Controller | Endpoints | Permissões |
|------------|-----------|------------|
| **VagasController** | GET, POST, PUT, PATCH, DELETE | VAGAS_SELECT, VAGAS_INSERT, VAGAS_UPDATE, VAGAS_DELETE |
| **MedicosController** | GET, POST, PUT, DELETE | MEDICOS_SELECT, MEDICOS_INSERT, MEDICOS_UPDATE, MEDICOS_DELETE |
| **HospitaisController** | GET, POST, PUT, DELETE | HOSPITAIS_SELECT, HOSPITAIS_INSERT, HOSPITAIS_UPDATE, HOSPITAIS_DELETE |
| **GruposController** | GET, POST, PUT, DELETE | GRUPOS_SELECT, GRUPOS_INSERT, GRUPOS_UPDATE, GRUPOS_DELETE |
| **CandidaturasController** | GET, POST, PATCH, DELETE | CANDIDATURAS_SELECT, CANDIDATURAS_INSERT, CANDIDATURAS_UPDATE, CANDIDATURAS_DELETE |
| **PagamentosController** | GET, POST, PUT, PATCH, DELETE | PAGAMENTOS_SELECT, PAGAMENTOS_INSERT, PAGAMENTOS_UPDATE, PAGAMENTOS_DELETE |
| **CheckinCheckoutController** | GET, POST, PUT, DELETE | CHECKIN_CHECKOUT_SELECT, CHECKIN_CHECKOUT_INSERT, CHECKIN_CHECKOUT_UPDATE, CHECKIN_CHECKOUT_DELETE |
| **GradesController** | GET, POST, PUT, DELETE, publish, generate | VAGAS_SELECT, VAGAS_INSERT, VAGAS_UPDATE, VAGAS_DELETE |
| **RelatoriosController** | GET (4 endpoints) | RELATORIOS_SELECT |
| **EscalistasController** | GET, POST, PUT, DELETE | MEMBROS_SELECT, MEMBROS_INSERT, MEMBROS_UPDATE, MEMBROS_DELETE |
| **SetoresController** | GET, POST, PUT, DELETE | HOSPITAIS_SELECT, HOSPITAIS_INSERT, HOSPITAIS_UPDATE, HOSPITAIS_DELETE |
| **EspecialidadesController** | GET, POST, PUT, DELETE | MEDICOS_SELECT, MEDICOS_INSERT, MEDICOS_UPDATE, MEDICOS_DELETE |

### 6.3 Arquivos a Modificar

```
apps/api/src/vagas/vagas.controller.ts
apps/api/src/medicos/medicos.controller.ts
apps/api/src/hospitais/hospitais.controller.ts
apps/api/src/grupos/grupos.controller.ts
apps/api/src/candidaturas/candidaturas.controller.ts
apps/api/src/pagamentos/pagamentos.controller.ts
apps/api/src/checkin-checkout/checkin-checkout.controller.ts
apps/api/src/grades/grades.controller.ts
apps/api/src/relatorios/relatorios.controller.ts
apps/api/src/escalistas/escalistas.controller.ts
apps/api/src/setores/setores.controller.ts
apps/api/src/especialidades/especialidades.controller.ts
```

### 6.4 Padrão de Implementação

```typescript
import { RequirePermissions } from '../auth/decorators'
import { AppPermission } from '../auth/types/auth.types'

@Controller('vagas')
export class VagasController {
  @Get()
  @RequirePermissions(AppPermission.VAGAS_SELECT)
  findAll() {}

  @Get(':id')
  @RequirePermissions(AppPermission.VAGAS_SELECT)
  findOne() {}

  @Post()
  @RequirePermissions(AppPermission.VAGAS_INSERT)
  create() {}

  @Put(':id')
  @RequirePermissions(AppPermission.VAGAS_UPDATE)
  update() {}

  @Delete(':id')
  @RequirePermissions(AppPermission.VAGAS_DELETE)
  remove() {}
}
```

---

## 7. FASE 2: Testes de Segurança (Guards)

### 7.1 Objetivo
Criar testes específicos para AuthGuard, PermissionsGuard e RolesGuard.

### 7.2 Arquivos a Criar

```
apps/api/src/auth/guards/__tests__/auth.guard.spec.ts
apps/api/src/auth/guards/__tests__/permissions.guard.spec.ts
apps/api/src/auth/guards/__tests__/roles.guard.spec.ts
apps/api/src/auth/services/__tests__/permissions.service.spec.ts
```

### 7.3 Cenários de Teste - AuthGuard

```typescript
describe('AuthGuard', () => {
  describe('canActivate', () => {
    it('should allow access for valid session')
    it('should deny access for missing session')
    it('should deny access for expired session')
    it('should populate user with roles and permissions')
    it('should allow public routes without authentication')
    it('should throw UnauthorizedException for invalid session')
  })
})
```

### 7.4 Cenários de Teste - PermissionsGuard

```typescript
describe('PermissionsGuard', () => {
  describe('canActivate', () => {
    it('should allow access when user has required permission')
    it('should deny access when user lacks required permission')
    it('should allow access when no permissions are required')
    it('should require ALL permissions when multiple specified')
    it('should throw ForbiddenException with missing permissions list')
  })
})
```

### 7.5 Cenários de Teste - RolesGuard

```typescript
describe('RolesGuard', () => {
  describe('canActivate', () => {
    it('should allow access for exact role match')
    it('should allow access for higher role in hierarchy')
    it('should deny access for lower role than required')
    it('should allow access when no roles are required')
    it('should support @RequireMinRole for hierarchy check')
  })
})
```

---

## 8. FASE 3: Testes de Integração

### 8.1 Objetivo
Testar fluxos completos Controller → Service → Repository → Prisma com banco real.

### 8.2 Configuração (Docker PostgreSQL)

**Decisão:** Usar Docker PostgreSQL local para testes isolados e destrutivos.

**Arquivo:** `apps/api/docker-compose.test.yml`
```yaml
version: '3.8'
services:
  postgres-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: houston_test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data
```

**Arquivo:** `apps/api/.env.test`
```env
DATABASE_URL="postgresql://test:test@localhost:5433/houston_test?schema=public"
```

**Arquivo:** `apps/api/vitest.config.integration.ts`
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.integration.spec.ts'],
    setupFiles: ['./src/__tests__/setup.integration.ts'],
    testTimeout: 30000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})
```

**Arquivo:** `apps/api/src/__tests__/setup.integration.ts`
```typescript
import { execSync } from 'child_process'

beforeAll(async () => {
  // Garantir que container está rodando
  execSync('docker compose -f docker-compose.test.yml up -d', { stdio: 'inherit' })

  // Aplicar migrations no banco de teste
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  })
})

afterAll(async () => {
  // Container continua rodando para próximos testes
})

beforeEach(async () => {
  // Limpar dados entre testes (mas manter schema)
})
```

**Scripts em package.json:**
```json
{
  "test:integration": "docker compose -f docker-compose.test.yml up -d && vitest run -c vitest.config.integration.ts",
  "test:integration:watch": "docker compose -f docker-compose.test.yml up -d && vitest -c vitest.config.integration.ts",
  "test:e2e": "docker compose -f docker-compose.test.yml up -d && vitest run -c vitest.config.e2e.ts",
  "test:all": "pnpm test && pnpm test:integration && pnpm test:e2e"
}
```

### 8.3 Arquivos a Criar

```
apps/api/src/__tests__/setup.integration.ts
apps/api/src/__tests__/helpers/test-app.ts
apps/api/src/vagas/__tests__/vagas.integration.spec.ts
apps/api/src/medicos/__tests__/medicos.integration.spec.ts
apps/api/src/candidaturas/__tests__/candidaturas.integration.spec.ts
```

### 8.4 Padrão de Teste de Integração

```typescript
describe('VagasService (Integration)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    prisma = module.get(PrismaService)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await prisma.vaga.deleteMany()
  })

  it('should create and retrieve a vaga', async () => {
    const vaga = await vagasService.create(createVagaDto)
    const found = await vagasService.findOne(vaga.id)
    expect(found).toMatchObject(vaga)
  })
})
```

---

## 9. FASE 4: Testes E2E (End-to-End)

### 9.1 Objetivo
Testar fluxos completos via HTTP incluindo autenticação, autorização e rate limiting.

### 9.2 Configuração

**Arquivo:** `apps/api/vitest.config.e2e.ts`
```typescript
export default defineConfig({
  test: {
    include: ['src/**/*.e2e.spec.ts'],
    setupFiles: ['./src/__tests__/setup.e2e.ts'],
    testTimeout: 60000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})
```

### 9.3 Arquivos a Criar

```
apps/api/vitest.config.e2e.ts
apps/api/src/__tests__/setup.e2e.ts
apps/api/src/__tests__/helpers/auth.helper.ts
apps/api/src/__tests__/e2e/auth.e2e.spec.ts
apps/api/src/__tests__/e2e/vagas.e2e.spec.ts
apps/api/src/__tests__/e2e/rate-limiting.e2e.spec.ts
apps/api/src/__tests__/e2e/rbac.e2e.spec.ts
```

### 9.4 Cenários E2E - Autenticação

```typescript
describe('Auth E2E', () => {
  it('should login and receive session cookie')
  it('should reject requests without session')
  it('should logout and invalidate session')
  it('should refresh session automatically')
})
```

### 9.5 Cenários E2E - RBAC

```typescript
describe('RBAC E2E', () => {
  it('should allow admin to access all endpoints')
  it('should restrict escalista to read-only operations')
  it('should deny access to resources outside user scope')
  it('should validate permission for each CRUD operation')
})
```

### 9.6 Cenários E2E - Rate Limiting

```typescript
describe('Rate Limiting E2E', () => {
  it('should allow requests within limit')
  it('should block after exceeding short limit (3/s)')
  it('should block after exceeding medium limit (20/10s)')
  it('should return 429 Too Many Requests')
  it('should include Retry-After header')
})
```

### 9.7 Helper de Autenticação

```typescript
// apps/api/src/__tests__/helpers/auth.helper.ts
export async function loginAs(role: AppRole): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: `${role}@test.com`, password: 'test123' })
  return response.headers['set-cookie'][0]
}

export async function createTestUsers(prisma: PrismaService) {
  // Criar usuários de teste para cada role
}
```

---

## 10. FASE 5: Auditoria de Ações Críticas

### 10.1 Objetivo
Registrar quem fez o quê (create/update/delete) em cada recurso.

### 10.2 Arquivos a Criar

```
apps/api/src/common/interceptors/audit.interceptor.ts
apps/api/src/common/interceptors/__tests__/audit.interceptor.spec.ts
apps/api/prisma/migrations/XXXX_add_audit_log.sql (ou via Supabase)
```

### 10.3 Estrutura da Tabela de Auditoria

```sql
CREATE TABLE houston.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.user(id),
  user_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  resource TEXT NOT NULL, -- 'vagas', 'medicos', etc.
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  correlation_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON houston.audit_log(user_id);
CREATE INDEX idx_audit_log_resource ON houston.audit_log(resource, resource_id);
CREATE INDEX idx_audit_log_created ON houston.audit_log(created_at);
```

### 10.4 Implementação do Interceptor

```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url, user, ip, headers } = request

    // Ignorar GET requests
    if (method === 'GET') return next.handle()

    const action = this.methodToAction(method)
    const resource = this.extractResource(url)

    return next.handle().pipe(
      tap(async (response) => {
        await this.prisma.$executeRaw`
          INSERT INTO houston.audit_log (
            user_id, user_email, action, resource, resource_id,
            new_value, ip_address, user_agent, correlation_id
          ) VALUES (
            ${user.id}::uuid, ${user.email}, ${action}, ${resource},
            ${response?.id}::uuid, ${JSON.stringify(response)},
            ${ip}, ${headers['user-agent']}, ${headers['x-correlation-id']}
          )
        `
      })
    )
  }
}
```

---

## 11. FASE 6: Documentação Completa

### 11.1 Estrutura de Documentação

```
houston-iv/
├── README.md                    # Visão geral do projeto
├── docs/
│   ├── README.md               # Índice da documentação
│   ├── ARCHITECTURE.md         # Arquitetura do sistema
│   ├── API.md                  # Documentação da API
│   ├── DEVELOPMENT.md          # Guia de desenvolvimento
│   ├── TESTING.md              # Estratégia de testes
│   ├── SECURITY.md             # Políticas de segurança
│   ├── DEPLOYMENT.md           # Guia de deploy
│   ├── CONTRIBUTING.md         # Guia de contribuição
│   └── adr/                    # Architecture Decision Records
│       ├── 001-monorepo-turborepo.md
│       ├── 002-nestjs-backend.md
│       ├── 003-better-auth.md
│       ├── 004-rbac-system.md
│       └── 005-testing-strategy.md
├── apps/
│   ├── api/README.md           # Documentação do backend
│   └── web/README.md           # Documentação do frontend
└── packages/
    └── */README.md             # Documentação de cada package
```

### 11.2 Conteúdo do README.md Principal

```markdown
# Houston IV

Sistema de gestão de escalas médicas.

## Quick Start
## Stack Tecnológico
## Estrutura do Projeto
## Desenvolvimento Local
## Testes
## Deploy
## Documentação
## Contribuindo
```

### 11.3 ADRs (Architecture Decision Records)

| ADR | Título | Status |
|-----|--------|--------|
| 001 | Monorepo com Turborepo | Aceito |
| 002 | NestJS para Backend | Aceito |
| 003 | Better Auth para Autenticação | Aceito |
| 004 | Sistema RBAC com 5 níveis | Aceito |
| 005 | Estratégia de Testes em 3 Camadas | Aceito |

---

## 12. Ordem de Execução (Sprints)

### Sprint 4A: Permissões Granulares ✅ CONCLUÍDO

1. [x] Aplicar @RequirePermissions em vagas.controller.ts
2. [x] Aplicar @RequirePermissions em medicos.controller.ts
3. [x] Aplicar @RequirePermissions em hospitais.controller.ts
4. [x] Aplicar @RequirePermissions em grupos.controller.ts
5. [x] Aplicar @RequirePermissions em candidaturas.controller.ts
6. [x] Aplicar @RequirePermissions em pagamentos.controller.ts
7. [x] Aplicar @RequirePermissions em checkin-checkout.controller.ts
8. [x] Aplicar @RequirePermissions em grades.controller.ts
9. [x] Aplicar @RequirePermissions em relatorios.controller.ts
10. [x] Aplicar @RequirePermissions em escalistas.controller.ts
11. [x] Aplicar @RequirePermissions em setores.controller.ts
12. [x] Aplicar @RequirePermissions em especialidades.controller.ts

### Sprint 4B: Testes de Guards ✅ CONCLUÍDO

1. [x] Criar auth.guard.spec.ts (8 testes)
2. [x] Criar permissions.guard.spec.ts (11 testes)
3. [x] Criar roles.guard.spec.ts (15 testes)
4. [x] Criar permissions.service.spec.ts (32 testes)
5. [x] Verificar 100% cobertura dos guards - **503 testes passando**

### Sprint 4C: Testes de Integração ✅ CONCLUÍDO

1. [x] Criar setup.integration.ts
2. [x] Criar test-app.ts helper
3. [x] Criar grupos.integration.spec.ts (17 testes)
4. [x] Criar especialidades.integration.spec.ts (17 testes)
5. [x] Criar hospitais.integration.spec.ts (18 testes)
6. [x] Configurar vitest.config.integration.ts
7. [x] Criar docker-compose.test.yml
8. [x] Adicionar scripts test:integration ao package.json

### Sprint 4D: Testes E2E ✅ CONCLUÍDO

1. [x] Criar setup.e2e.ts
2. [x] Criar auth.helper.ts
3. [x] Criar rbac.e2e.spec.ts (15+ testes para RBAC)
4. [x] Criar rate-limiting.e2e.spec.ts (5+ testes para throttling)
5. [x] Configurar vitest.config.e2e.ts
6. [x] Adicionar scripts test:e2e ao package.json

### Sprint 4E: Auditoria
1. [ ] Criar migration para audit_log
2. [ ] Criar audit.interceptor.ts
3. [ ] Criar audit.interceptor.spec.ts
4. [ ] Aplicar AuditInterceptor globalmente
5. [ ] Testar logs de auditoria

### Sprint 4F: Documentação
1. [ ] Criar README.md principal
2. [ ] Criar docs/README.md
3. [ ] Criar docs/ARCHITECTURE.md
4. [ ] Criar docs/API.md
5. [ ] Criar docs/DEVELOPMENT.md
6. [ ] Criar docs/TESTING.md
7. [ ] Criar docs/SECURITY.md
8. [ ] Criar docs/DEPLOYMENT.md
9. [ ] Criar docs/CONTRIBUTING.md
10. [ ] Criar ADRs (001-005)
11. [ ] Criar apps/api/README.md
12. [ ] Criar apps/web/README.md

---

## 13. Estimativa Total

| Sprint | Descrição | Arquivos |
|--------|-----------|----------|
| 4A | Permissões Granulares | 12 controllers |
| 4B | Testes de Guards | 4 arquivos |
| 4C | Testes de Integração | 6 arquivos |
| 4D | Testes E2E | 7 arquivos |
| 4E | Auditoria | 3 arquivos |
| 4F | Documentação | 15 arquivos |
| **Total** | | **47 arquivos** |

---

## 14. Métricas de Sucesso

### Segurança 10/10
- [x] 100% endpoints com @RequirePermissions ✅
- [x] 100% cobertura de testes nos guards ✅ (66 testes novos)
- [ ] Auditoria de todas as ações críticas
- [ ] Testes E2E para RBAC e Rate Limiting

### Testes 10/10
- [x] Testes unitários: 437+ (existentes) ✅
- [x] Testes de guards: 66 novos (auth: 8, permissions: 11, roles: 15, service: 32) ✅
- [ ] Testes de integração: 15+ novos
- [ ] Testes E2E: 20+ novos
- [ ] Cobertura total: 100%

### Documentação 10/10
- [ ] README principal completo
- [ ] 8 documentos em /docs
- [ ] 5 ADRs documentados
- [ ] READMEs para api e web
