# @houston/api

Backend da aplicacao Houston IV desenvolvido com NestJS.

## Arquitetura

```
src/
├── auth/                    # Sistema de autenticacao e autorizacao
│   ├── decorators/          # @CurrentUser, @RequirePermissions, @RequireRoles
│   ├── guards/              # AuthGuard, PermissionsGuard, RolesGuard
│   ├── services/            # PermissionsService
│   ├── types/               # Tipos e enums (AppRole, AppPermission)
│   └── rbac/                # Modulo RBAC
├── common/                  # Recursos compartilhados
│   ├── decorators/          # @Public
│   ├── filters/             # HttpExceptionFilter
│   ├── interceptors/        # TransformInterceptor, AuditInterceptor
│   ├── pipes/               # ValidationPipe customizado
│   └── validators/          # Validadores customizados
├── prisma/                  # Modulo Prisma
├── health/                  # Health check
├── grupos/                  # Modulo de grupos
├── hospitais/               # Modulo de hospitais
├── setores/                 # Modulo de setores
├── especialidades/          # Modulo de especialidades
├── medicos/                 # Modulo de medicos
├── escalistas/              # Modulo de escalistas
├── vagas/                   # Modulo de vagas
├── candidaturas/            # Modulo de candidaturas
├── grades/                  # Modulo de grades
├── pagamentos/              # Modulo de pagamentos
├── checkin-checkout/        # Modulo de check-in/check-out
├── relatorios/              # Modulo de relatorios
├── app.module.ts            # Modulo raiz
├── auth.config.ts           # Configuracao Better Auth
└── main.ts                  # Bootstrap da aplicacao
```

## Sistema RBAC

### Roles (5 niveis hierarquicos)

```typescript
enum AppRole {
  ADMINISTRADOR = 'administrador',  // Nivel 4
  MODERADOR = 'moderador',          // Nivel 3
  GESTOR = 'gestor',                // Nivel 2
  COORDENADOR = 'coordenador',      // Nivel 1
  ESCALISTA = 'escalista',          // Nivel 0
}
```

### Permissoes (36 granulares)

```typescript
enum AppPermission {
  // Vagas
  VAGAS_SELECT = 'vagas.select',
  VAGAS_INSERT = 'vagas.insert',
  VAGAS_UPDATE = 'vagas.update',
  VAGAS_DELETE = 'vagas.delete',

  // Medicos
  MEDICOS_SELECT = 'medicos.select',
  MEDICOS_INSERT = 'medicos.insert',
  MEDICOS_UPDATE = 'medicos.update',
  MEDICOS_DELETE = 'medicos.delete',

  // ... demais recursos
}
```

### Uso nos Controllers

```typescript
@Controller('vagas')
@UseGuards(AuthGuard, PermissionsGuard)
export class VagasController {
  @Get()
  @RequirePermissions(AppPermission.VAGAS_SELECT)
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.vagasService.findAll(user.hospitalIds);
  }

  @Post()
  @RequirePermissions(AppPermission.VAGAS_INSERT)
  create(@Body() dto: CreateVagaDto) {
    return this.vagasService.create(dto);
  }
}
```

## Interceptors

### AuditInterceptor

Registra todas as acoes de modificacao:

- Acionado em: POST, PUT, PATCH, DELETE
- Ignorado em: GET, HEAD, OPTIONS
- Dados registrados: userId, action, resource, resourceId, oldValue, newValue, ip, userAgent

### TransformInterceptor

Padroniza respostas da API:

```json
{
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Rate Limiting

Configurado via `@nestjs/throttler`:

```typescript
ThrottlerModule.forRoot([
  { name: 'short', ttl: 1000, limit: 3 },
  { name: 'medium', ttl: 10000, limit: 20 },
  { name: 'long', ttl: 60000, limit: 100 },
])
```

## Testes

### Estrutura

```
src/
├── __tests__/
│   ├── e2e/                     # Testes E2E
│   │   ├── rbac.e2e.spec.ts
│   │   └── rate-limiting.e2e.spec.ts
│   ├── helpers/                 # Helpers de teste
│   │   ├── auth.helper.ts
│   │   └── test-app.ts
│   ├── setup.integration.ts     # Setup testes integracao
│   └── setup.e2e.ts             # Setup testes E2E
├── [modulo]/
│   └── __tests__/
│       ├── *.spec.ts            # Testes unitarios
│       └── *.integration.spec.ts # Testes integracao
└── auth/
    └── guards/
        └── __tests__/           # Testes dos guards
```

### Comandos

```bash
# Unitarios
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# Integracao (requer Docker)
pnpm test:integration

# E2E (requer Docker)
pnpm test:e2e

# Todos
pnpm test:all
```

### Configuracoes Vitest

- `vitest.config.ts` - Testes unitarios
- `vitest.config.integration.ts` - Testes integracao
- `vitest.config.e2e.ts` - Testes E2E

## Banco de Dados

### Prisma Schema

Modelos principais:

- `User` - Usuarios (Better Auth)
- `Session` - Sessoes
- `Grupo` - Grupos de hospitais
- `Hospital` - Hospitais
- `Setor` - Setores de hospitais
- `Especialidade` - Especialidades medicas
- `Medico` - Medicos
- `Escalista` - Vinculo medico-grupo
- `Vaga` - Vagas de plantao
- `Candidatura` - Candidaturas a vagas
- `Grade` - Grades de horarios
- `TimeSlot` - Slots de tempo
- `Pagamento` - Pagamentos
- `CheckinCheckout` - Registros de presenca
- `AuditLog` - Logs de auditoria

### Comandos Prisma

```bash
# Gerar client
pnpm db:generate

# Migrations desenvolvimento
pnpm db:migrate

# Push direto (sem migration)
pnpm db:push

# Abrir Prisma Studio
pnpm db:studio

# Seed
pnpm db:seed
```

## Seguranca

### Headers (Helmet)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
    },
  },
}))
```

### Validacao

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Remove campos nao decorados
  forbidNonWhitelisted: true, // Erro se campos extras
  transform: true,            // Transforma tipos automaticamente
}))
```

## Variaveis de Ambiente

```env
# Banco de dados
DATABASE_URL=postgresql://user:pass@localhost:5433/houston

# Servidor
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3001

# Logs
LOG_LEVEL=info
NODE_ENV=development
```

## Docker

### Testes

```yaml
# docker-compose.test.yml
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

## Swagger

Disponivel em `/api/docs` quando o servidor esta rodando.

```typescript
const config = new DocumentBuilder()
  .setTitle('Houston IV API')
  .setDescription('API para gerenciamento de escalas medicas')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
```
