# Estrategia de Testes - Houston IV

Este documento descreve a estrategia de testes implementada no backend do Houston IV.

## Visao Geral

O sistema utiliza uma estrategia de testes em 3 camadas:

| Camada | Tipo | Objetivo | Dependencias |
|--------|------|----------|--------------|
| 1 | Unitario | Testar componentes isolados | Mocks |
| 2 | Integracao | Testar fluxos com banco real | Docker PostgreSQL |
| 3 | E2E | Testar API via HTTP | Docker PostgreSQL |

## Estrutura de Arquivos

```
apps/api/
├── src/
│   ├── __tests__/
│   │   ├── e2e/                      # Testes E2E
│   │   │   ├── rbac.e2e.spec.ts
│   │   │   └── rate-limiting.e2e.spec.ts
│   │   ├── helpers/                  # Helpers compartilhados
│   │   │   ├── auth.helper.ts        # Helper de autenticacao
│   │   │   └── test-app.ts           # Helper de app de teste
│   │   ├── setup.integration.ts      # Setup integracao
│   │   └── setup.e2e.ts              # Setup E2E
│   └── [modulo]/
│       └── __tests__/
│           ├── *.spec.ts             # Unitarios
│           └── *.integration.spec.ts # Integracao
├── vitest.config.ts                  # Config unitarios
├── vitest.config.integration.ts      # Config integracao
├── vitest.config.e2e.ts              # Config E2E
└── docker-compose.test.yml           # Docker para testes
```

## Configuracao

### vitest.config.ts (Unitarios)

```typescript
export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    exclude: ['src/**/*.integration.spec.ts', 'src/**/*.e2e.spec.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80 },
    },
  },
})
```

### vitest.config.integration.ts

```typescript
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

### vitest.config.e2e.ts

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

## Docker para Testes

### docker-compose.test.yml

```yaml
version: '3.8'
services:
  postgres-test:
    image: postgres:16-alpine
    container_name: houston-test-db
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: houston_test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data
```

O `tmpfs` garante que os dados sao armazenados em memoria, tornando os testes mais rapidos.

## Testes Unitarios

### Caracteristicas

- Executam sem dependencias externas
- Usam mocks para Prisma, services, etc.
- Rapidos (< 5s para toda suite)
- Focam em logica de negocios isolada

### Exemplo: Service

```typescript
describe('GruposService', () => {
  let service: GruposService
  let repository: MockProxy<GruposRepository>

  beforeEach(() => {
    repository = mockDeep<GruposRepository>()
    service = new GruposService(repository)
  })

  it('should create a grupo', async () => {
    const dto = { nome: 'Grupo 1' }
    repository.create.mockResolvedValue({ id: '1', ...dto })

    const result = await service.create(dto)

    expect(result.nome).toBe('Grupo 1')
    expect(repository.create).toHaveBeenCalledWith(dto)
  })
})
```

### Exemplo: Guard

```typescript
describe('PermissionsGuard', () => {
  let guard: PermissionsGuard
  let reflector: Reflector

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn() } as unknown as Reflector
    guard = new PermissionsGuard(reflector)
  })

  it('should allow when user has required permission', () => {
    vi.mocked(reflector.getAllAndOverride)
      .mockReturnValue([AppPermission.VAGAS_SELECT])

    mockRequest.user = { permissions: [AppPermission.VAGAS_SELECT] }

    expect(guard.canActivate(mockContext)).toBe(true)
  })
})
```

## Testes de Integracao

### Caracteristicas

- Usam banco PostgreSQL real (Docker)
- Testam fluxo Service -> Repository -> Prisma
- Verificam queries, transacoes, constraints
- Limpeza de dados entre testes

### Setup

```typescript
// setup.integration.ts
beforeAll(async () => {
  // Aguardar banco estar pronto
  await waitForDatabase()

  // Aplicar migrations
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  })
})

beforeEach(async () => {
  // Limpar dados entre testes
  await prisma.$executeRaw`TRUNCATE TABLE grupos CASCADE`
})
```

### Exemplo

```typescript
describe('GruposService (Integration)', () => {
  let app: INestApplication
  let service: GruposService
  let prisma: PrismaService

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    service = module.get(GruposService)
    prisma = module.get(PrismaService)
    await app.init()
  })

  it('should create and retrieve a grupo', async () => {
    const created = await service.create({ nome: 'Test' })
    const found = await service.findOne(created.id)

    expect(found.nome).toBe('Test')
  })
})
```

## Testes E2E

### Caracteristicas

- Testam API via HTTP (supertest)
- Incluem autenticacao real
- Verificam headers, status codes, body
- Testam RBAC e rate limiting

### Setup

```typescript
// setup.e2e.ts
beforeAll(async () => {
  await waitForDatabase()
  execSync('npx prisma migrate deploy')
})

beforeEach(async () => {
  await cleanDatabase()
})
```

### Helper de Autenticacao

```typescript
// auth.helper.ts
export async function createTestUser(
  prisma: PrismaService,
  role: AppRole
): Promise<TestUser> {
  const userId = crypto.randomUUID()
  const sessionToken = crypto.randomUUID()

  // Criar usuario
  await prisma.user.create({
    data: { id: userId, email: `${role}@test.com`, ... }
  })

  // Criar sessao
  await prisma.session.create({
    data: { userId, token: sessionToken, ... }
  })

  return {
    userId,
    cookie: `better-auth.session_token=${sessionToken}`,
  }
}
```

### Exemplo: RBAC

```typescript
describe('RBAC E2E', () => {
  it('should allow admin to create grupos', async () => {
    const { cookie } = await createTestUser(prisma, AppRole.ADMINISTRADOR)

    const response = await request(app.getHttpServer())
      .post('/grupos')
      .set('Cookie', cookie)
      .send({ nome: 'Novo Grupo' })

    expect(response.status).toBe(201)
  })

  it('should deny escalista to create grupos', async () => {
    const { cookie } = await createTestUser(prisma, AppRole.ESCALISTA)

    const response = await request(app.getHttpServer())
      .post('/grupos')
      .set('Cookie', cookie)
      .send({ nome: 'Novo Grupo' })

    expect(response.status).toBe(403)
  })
})
```

### Exemplo: Rate Limiting

```typescript
describe('Rate Limiting E2E', () => {
  it('should block after exceeding limit', async () => {
    const { cookie } = await createTestUser(prisma, AppRole.ADMINISTRADOR)

    // Fazer muitas requisicoes
    const requests = Array(10).fill(null).map(() =>
      request(app.getHttpServer())
        .get('/grupos')
        .set('Cookie', cookie)
    )

    const responses = await Promise.all(requests)
    const blocked = responses.filter(r => r.status === 429)

    expect(blocked.length).toBeGreaterThan(0)
  })
})
```

## Comandos

```bash
# Unitarios
pnpm test              # Executar
pnpm test:watch        # Watch mode
pnpm test:cov          # Com coverage

# Integracao
pnpm test:integration
pnpm test:integration:watch

# E2E
pnpm test:e2e
pnpm test:e2e:watch

# Todos
pnpm test:all
```

## Metricas de Cobertura

### Minimos Recomendados

| Tipo | Cobertura |
|------|-----------|
| Linhas | 80% |
| Branches | 75% |
| Functions | 80% |

### Exclusoes

```typescript
coveragePathIgnorePatterns: [
  'node_modules',
  'dist',
  '.module.ts',
  '.dto.ts',
  'main.ts',
]
```

## Boas Praticas

1. **Nomeacao**: `*.spec.ts` (unitario), `*.integration.spec.ts`, `*.e2e.spec.ts`

2. **Isolamento**: Cada teste deve ser independente

3. **Limpeza**: Sempre limpar dados entre testes

4. **Mocks Tipados**: Usar `vitest-mock-extended` para mocks com tipos

5. **Helpers**: Centralizar criacao de dados de teste

6. **Assertions**: Ser especifico nas verificacoes

7. **CI/CD**: Executar todos os testes no pipeline
