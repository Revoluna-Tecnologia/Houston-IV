# Seguranca - Houston IV

Este documento descreve as medidas de seguranca implementadas no sistema Houston IV.

## Autenticacao

### Better Auth

O sistema utiliza Better Auth para gerenciamento de autenticacao:

- Sessions baseadas em cookies HTTP-only
- Suporte a verificacao de email
- Tokens de refresh automaticos
- Protecao contra session hijacking

### Configuracao

```typescript
// auth.config.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24,     // Refresh a cada 24h
  },
})
```

## Autorizacao (RBAC)

### Hierarquia de Roles

```
administrador (nivel 4)
    └── moderador (nivel 3)
        └── gestor (nivel 2)
            └── coordenador (nivel 1)
                └── escalista (nivel 0)
```

### Permissoes Granulares

36 permissoes distribuidas em 10 recursos:

| Recurso | Permissoes |
|---------|------------|
| vagas | select, insert, update, delete |
| medicos | select, insert, update, delete |
| grupos | select, insert, update, delete |
| hospitais | select, insert, update, delete |
| candidaturas | select, insert, update, delete |
| pagamentos | select, insert, update, delete |
| relatorios | select |
| checkin_checkout | select, insert, update, delete |
| membros | select, insert, update, delete |
| roles | select, insert, update, delete |

### Guards

1. **AuthGuard**: Valida sessao e popula `req.user`
2. **PermissionsGuard**: Verifica permissoes especificas
3. **RolesGuard**: Verifica role minimo ou roles especificos

## Rate Limiting

### Configuracao

```typescript
ThrottlerModule.forRoot([
  { name: 'short', ttl: 1000, limit: 3 },    // 3 req/segundo
  { name: 'medium', ttl: 10000, limit: 20 }, // 20 req/10 segundos
  { name: 'long', ttl: 60000, limit: 100 },  // 100 req/minuto
])
```

### Headers de Resposta

- `X-RateLimit-Limit`: Limite total
- `X-RateLimit-Remaining`: Requisicoes restantes
- `Retry-After`: Tempo ate reset (quando bloqueado)

## Headers de Seguranca (Helmet)

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
  crossOriginEmbedderPolicy: false,
}))
```

### Headers Aplicados

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: ...`

## Validacao de Entrada

### ValidationPipe Global

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // Remove campos nao decorados
  forbidNonWhitelisted: true, // Erro se campos extras enviados
  transform: true,            // Transforma tipos automaticamente
}))
```

### DTOs com class-validator

```typescript
export class CreateVagaDto {
  @IsDateString()
  data: string;

  @IsString()
  @Length(5, 5)
  horaInicio: string;

  @IsNumber()
  @Min(0)
  valor: number;
}
```

## Auditoria

### Dados Registrados

Todas as acoes de modificacao (POST, PUT, PATCH, DELETE) sao registradas:

```typescript
interface AuditLogEntry {
  userId: string;       // ID do usuario
  userEmail: string;    // Email do usuario
  action: AuditAction;  // CREATE, UPDATE, DELETE
  resource: string;     // Recurso afetado
  resourceId?: string;  // ID do recurso
  oldValue?: Json;      // Valor anterior
  newValue?: Json;      // Novo valor
  ipAddress?: string;   // IP do cliente
  userAgent?: string;   // User-Agent
  correlationId?: string; // ID de correlacao
  createdAt: DateTime;  // Timestamp
}
```

### Sanitizacao

Campos sensiveis sao automaticamente redacionados:

- password
- token
- secret
- apiKey
- hash

## CORS

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
})
```

## Protecao contra Ataques Comuns

### SQL Injection

- Prisma ORM com queries parametrizadas
- Nenhum uso de SQL raw sem parametrizacao

### XSS (Cross-Site Scripting)

- CSP headers via Helmet
- Validacao de entrada
- Sanitizacao de saida

### CSRF (Cross-Site Request Forgery)

- Cookies HTTP-only
- Same-site cookies
- CORS configurado

## Logs e Monitoramento

### Pino Logger

```typescript
LoggerModule.forRoot({
  pinoHttp: {
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    level: process.env.LOG_LEVEL || 'info',
  },
})
```

### Campos Redacionados

- Authorization header
- Cookies
- Passwords em body

## Recomendacoes para Producao

1. **HTTPS Obrigatorio**
   - Configurar SSL/TLS
   - Redirect HTTP -> HTTPS

2. **Variaveis de Ambiente**
   - Usar secrets manager
   - Nunca commitar .env

3. **Rate Limiting Adicional**
   - WAF/CDN (Cloudflare, AWS WAF)
   - Rate limit por usuario alem de IP

4. **Monitoramento**
   - Alertas para tentativas de login falhas
   - Monitorar rate limit blocks
   - Alertas para erros 500

5. **Backup e Recuperacao**
   - Backup automatico do banco
   - Plano de disaster recovery
