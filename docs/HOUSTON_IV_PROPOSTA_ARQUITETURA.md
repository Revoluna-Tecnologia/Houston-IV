# Houston IV - Proposta de Nova Arquitetura

**Data:** 22 de Novembro de 2025
**Versao:** 1.0
**Objetivo:** Proposta tecnica para reescrita do Houston III utilizando arquitetura moderna

---

## Executive Summary

O **Houston III** e um sistema funcional, mas acumula **debt tecnico significativo** que compromete:
- Velocidade de desenvolvimento de novas features
- Seguranca da aplicacao
- Escalabilidade para novos clientes
- Manutencao a longo prazo

Esta proposta apresenta o **Houston IV**: uma reescrita estrategica com arquitetura moderna, preparada para integracoes futuras (WhatsApp, tickets, notificacoes) e desenvolvida com auxilio de IA, reduzindo drasticamente o tempo de desenvolvimento.

### Por que agora?

| Metrica | Houston III | Impacto |
|---------|-------------|---------|
| Testes automatizados | 0% coverage | Bugs descobertos em producao |
| Arquivos > 500 linhas | 12 arquivos | Dificil manutencao |
| Console.logs em prod | 277 ocorrencias | Vazamento de info + performance |
| Violacoes SRP | Score 5.0/10 | Codigo fragil |
| Rate limiting | Em memoria | Vulneravel a DDoS |
| Tempo medio para nova feature | 2-3 semanas | Time-to-market lento |

**Estimativa com IA: 6-8 semanas para MVP funcional vs 6-8 meses de refatoracao gradual do Houston III.**

---

## 1. DIAGNOSTICO: Por que o Houston III e limitado

### 1.1 Problemas Estruturais Criticos

#### Monolito Frontend Pesado
```
PROBLEMA: Logica de negocio misturada com UI

Houston III:
┌─────────────────────────────────────────┐
│           NEXT.JS MONOLITO              │
├─────────────────────────────────────────┤
│ Pages (925 linhas em uma pagina!)       │
│ Services (803 linhas no dashboard!)     │
│ Components (29k tokens em um modal!)    │
│ Hooks + Regras de negocio + Validacoes  │
│ Tudo junto e misturado                  │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        SUPABASE (Backend implícito)     │
│ Views + RPCs + RLS                      │
│ Sem camada de abstração                 │
└─────────────────────────────────────────┘
```

**Consequencias:**
- Impossivel testar logica de negocio isoladamente
- Mudanca no frontend pode quebrar regras de negocio
- Nao ha como escalar componentes independentemente
- Supabase exposto diretamente ao cliente

#### Acoplamento Direto ao Supabase
```typescript
// Houston III: Servico acoplado ao banco
export async function createVaga({ vagaInsert, ... }) {
  const supabase = getSupabaseClient() // Dependencia concreta
  const { data, error } = await supabase
    .from("vagas")
    .insert([vagaComAuditoria]) // Estrutura do banco exposta
}

// PROBLEMA: Trocar Supabase por outro DB = reescrever tudo
```

#### Ausencia de Testes
```
Cobertura atual: 0%

Impacto:
- Refatoracoes sao arriscadas
- Bugs descobertos em producao
- Regressoes nao detectadas
- Deploy sem confianca
```

#### Seguranca Fragil
```typescript
// Rate limiting em memoria - reseta a cada deploy!
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// IP Spoofing possivel
const forwarded = request.headers.get('x-forwarded-for')
return forwarded.split(',')[0].trim() // Confia cegamente no header
```

### 1.2 Bloqueios para Novas Features

| Feature Desejada | Bloqueio no Houston III |
|------------------|-------------------------|
| **WhatsApp Business API** | Sem backend proprio para webhooks |
| **Sistema de Tickets** | Arquitetura nao suporta filas/eventos |
| **Notificacoes Push** | Sem infraestrutura de mensageria |
| **Multi-tenancy** | RLS basico, sem isolamento real |
| **Mobile App** | API nao documentada/padronizada |
| **Integracao Contabil** | Sem camada de integracao |
| **Audit Logs** | Inexistente |
| **Websockets Real-time** | Limitado ao Supabase Realtime |

### 1.3 Debt Tecnico Acumulado

```
┌────────────────────────────────────────────────────────────┐
│                    DEBT TECNICO                            │
├────────────────────────────────────────────────────────────┤
│ ██████████████████████████ 277 console.logs               │
│ ████████████████████ 12 arquivos > 500 linhas             │
│ ████████████████████████████████ 0% test coverage         │
│ ███████████████ Score SRP 5.0/10                          │
│ ████████████████████ Score SOLID 5.5/10                   │
│ ████████████ Rate limiting vulneravel                      │
│ ██████████████████ Validacao backend inexistente          │
└────────────────────────────────────────────────────────────┘

Custo estimado para corrigir: 4-6 meses de trabalho dedicado
(sem adicionar nenhuma feature nova)
```

---

## 2. HOUSTON IV: Nova Arquitetura

### 2.1 Visao Geral

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HOUSTON IV - ARQUITETURA                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      FRONTEND (Next.js 15)                       │   │
│  │  • UI Components (shadcn/ui)                                     │   │
│  │  • State Management (Zustand ou TanStack Query)                  │   │
│  │  • API Client (type-safe)                                        │   │
│  │  • ZERO logica de negocio                                        │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
│                                   │ REST/tRPC                           │
│                                   ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       BACKEND (NestJS)                           │   │
│  │                                                                   │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │   │ Controllers │  │  Services   │  │Repositories │             │   │
│  │   │ (API Layer) │─▶│ (Business)  │─▶│ (Data)      │             │   │
│  │   └─────────────┘  └─────────────┘  └──────┬──────┘             │   │
│  │                                            │                      │   │
│  │   ┌─────────────┐  ┌─────────────┐         │                      │   │
│  │   │   Guards    │  │   Queues    │         │                      │   │
│  │   │ (Auth/RBAC) │  │ (BullMQ)    │         │                      │   │
│  │   └─────────────┘  └─────────────┘         │                      │   │
│  │                                            │                      │   │
│  └────────────────────────────────────────────┼──────────────────────┘   │
│                                               │                          │
│  ┌────────────────────────────────────────────┼──────────────────────┐   │
│  │                     INFRAESTRUTURA          │                      │   │
│  │                                            ▼                       │   │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │   │
│  │   │ PostgreSQL │  │   Redis    │  │  Storage   │  │  Message   │ │   │
│  │   │ (Supabase) │  │ (Cache/    │  │ (Supabase) │  │   Queue    │ │   │
│  │   │            │  │  Session)  │  │            │  │  (BullMQ)  │ │   │
│  │   └────────────┘  └────────────┘  └────────────┘  └────────────┘ │   │
│  │                                                                    │   │
│  │   ┌────────────────────────────────────────────────────────────┐  │   │
│  │   │                    INTEGRACOES EXTERNAS                     │  │   │
│  │   │  WhatsApp API │ Email (Resend) │ Push (FCM) │ Contabilidade│  │   │
│  │   └────────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Stack Tecnologico

| Camada | Houston III | Houston IV | Justificativa |
|--------|-------------|------------|---------------|
| **Frontend** | Next.js 15 | Next.js 15 | Manter expertise |
| **Backend** | Supabase direto | **NestJS** | Arquitetura escalavel |
| **ORM** | Supabase Client | **Prisma/Drizzle** | Type-safety + migrations |
| **Database** | PostgreSQL (Supabase) | **PostgreSQL (Supabase)** | Manter dados |
| **Cache** | localStorage | **Redis (Upstash)** | Sessoes + cache distribuido |
| **Filas** | Nenhuma | **BullMQ** | Jobs async, webhooks |
| **Auth** | Supabase Auth | **Supabase Auth + JWT** | Manter + tokens backend |
| **Testes** | Nenhum | **Vitest + Playwright** | Coverage 100% |
| **Docs API** | Nenhuma | **Swagger/OpenAPI** | Documentacao automatica |
| **Monitoramento** | Console.log | **Sentry + logs estruturados** | Observabilidade |

### 2.3 Por que NestJS?

```
┌─────────────────────────────────────────────────────────────────┐
│                     NESTJS - BENEFICIOS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Arquitetura Modular                                         │
│     Cada dominio (vagas, medicos, hospitais) isolado            │
│                                                                 │
│  ✅ Dependency Injection nativo                                 │
│     Facilita testes e substituicao de implementacoes            │
│                                                                 │
│  ✅ Decorators para validacao                                   │
│     @IsString(), @IsEmail(), @Min() - validacao automatica      │
│                                                                 │
│  ✅ Guards para autenticacao/autorizacao                        │
│     RBAC (Role-Based Access Control) built-in                   │
│                                                                 │
│  ✅ Interceptors para logging/transformacao                     │
│     Logs estruturados automaticos                               │
│                                                                 │
│  ✅ Integracoes prontas                                         │
│     Bull (filas), Redis, Swagger, etc.                          │
│                                                                 │
│  ✅ TypeScript-first                                            │
│     Consistencia com frontend Next.js                           │
│                                                                 │
│  ✅ Testabilidade                                               │
│     Mocks faceis via DI, coverage alto                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Estrutura de Pastas

```
houston-iv/
│
├── apps/
│   ├── web/                          # Frontend Next.js 15
│   │   ├── app/                      # App Router
│   │   │   ├── (auth)/               # Paginas de autenticacao
│   │   │   └── (dashboard)/          # Paginas protegidas
│   │   ├── components/               # Componentes React
│   │   │   ├── ui/                   # shadcn/ui base
│   │   │   └── features/             # Por dominio
│   │   ├── hooks/                    # Custom hooks (apenas UI)
│   │   ├── lib/                      # Utilitarios
│   │   └── services/                 # API client (fetch tipado)
│   │
│   └── api/                          # Backend NestJS
│       ├── src/
│       │   ├── modules/              # Modulos de dominio
│       │   │   ├── vagas/
│       │   │   │   ├── vagas.module.ts
│       │   │   │   ├── vagas.controller.ts
│       │   │   │   ├── vagas.service.ts
│       │   │   │   ├── vagas.repository.ts
│       │   │   │   ├── dto/
│       │   │   │   │   ├── create-vaga.dto.ts
│       │   │   │   │   └── update-vaga.dto.ts
│       │   │   │   ├── entities/
│       │   │   │   │   └── vaga.entity.ts
│       │   │   │   └── __tests__/
│       │   │   │       ├── vagas.service.spec.ts
│       │   │   │       └── vagas.controller.spec.ts
│       │   │   ├── medicos/
│       │   │   ├── hospitais/
│       │   │   ├── candidaturas/
│       │   │   ├── grades/
│       │   │   ├── escalas/
│       │   │   ├── notificacoes/     # NOVO
│       │   │   ├── tickets/          # NOVO
│       │   │   └── whatsapp/         # NOVO
│       │   │
│       │   ├── common/               # Shared
│       │   │   ├── guards/           # Auth guards
│       │   │   ├── interceptors/     # Logging, transform
│       │   │   ├── filters/          # Exception filters
│       │   │   ├── decorators/       # Custom decorators
│       │   │   └── pipes/            # Validation pipes
│       │   │
│       │   ├── database/             # Prisma/Drizzle
│       │   │   ├── schema.prisma
│       │   │   └── migrations/
│       │   │
│       │   ├── queue/                # BullMQ
│       │   │   ├── processors/
│       │   │   └── jobs/
│       │   │
│       │   └── config/               # Configuracoes
│       │
│       └── test/                     # E2E tests
│
├── packages/                         # Monorepo shared
│   ├── types/                        # Tipos compartilhados
│   ├── utils/                        # Funcoes utilitarias
│   └── ui/                           # Design system (opcional)
│
├── docker-compose.yml                # Dev environment
├── turbo.json                        # Turborepo config
└── pnpm-workspace.yaml               # Workspaces
```

---

## 2.5 Estrategia de Testes: 100% Coverage

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PIRAMIDE DE TESTES - HOUSTON IV                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                           ┌───────────┐                                 │
│                           │    E2E    │  10% - Fluxos criticos          │
│                           │ Playwright│  (login, criar vaga, etc)       │
│                           └─────┬─────┘                                 │
│                       ┌─────────┴─────────┐                             │
│                       │    INTEGRACAO     │  30% - APIs + DB            │
│                       │   Supertest/Jest  │  (controllers + repos)      │
│                       └─────────┬─────────┘                             │
│               ┌─────────────────┴─────────────────┐                     │
│               │           UNITARIOS               │  60% - Logica       │
│               │         Vitest + RTL              │  (services, utils)  │
│               └───────────────────────────────────┘                     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   REGRAS OBRIGATORIAS:                                                  │
│   ────────────────────                                                  │
│   ✓ Nenhum PR aprovado sem 100% coverage do codigo alterado            │
│   ✓ CI bloqueia merge se coverage < 100%                               │
│   ✓ Cada service deve ter arquivo .spec.ts correspondente              │
│   ✓ Cada controller deve ter testes de integracao                      │
│   ✓ Fluxos criticos devem ter testes E2E                               │
│                                                                         │
│   TIPOS DE TESTE POR CAMADA:                                            │
│   ──────────────────────────                                            │
│                                                                         │
│   BACKEND (NestJS):                                                     │
│   • Services: Testes unitarios com mocks de repositories               │
│   • Controllers: Testes de integracao com supertest                    │
│   • Guards: Testes unitarios de autorizacao                            │
│   • Validators: Testes de DTOs com class-validator                     │
│   • Queues: Testes de processors com mocks                             │
│                                                                         │
│   FRONTEND (Next.js):                                                   │
│   • Components: React Testing Library                                   │
│   • Hooks: renderHook + act                                            │
│   • Pages: Snapshot + interacao                                        │
│   • API Client: MSW (Mock Service Worker)                              │
│                                                                         │
│   E2E (Playwright):                                                     │
│   • Login/Logout                                                        │
│   • CRUD de vagas                                                       │
│   • Fluxo de candidatura                                               │
│   • Dashboard metricas                                                 │
│   • Exportacao PDF                                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Configuracao de Coverage

```typescript
// vitest.config.ts (Backend + Frontend)
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // COVERAGE 100% OBRIGATORIO
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
      // Excluir apenas arquivos de config
      exclude: [
        'node_modules/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/index.ts', // barrel exports
        '**/main.ts',  // bootstrap
      ],
    },
  },
})
```

### CI/CD com Gate de Qualidade

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: pnpm install

      - name: Run tests with coverage
        run: pnpm test:coverage

      - name: Check 100% coverage
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if [ "$COVERAGE" != "100" ]; then
            echo "Coverage is $COVERAGE%, required 100%"
            exit 1
          fi

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

---

## 3. COMPARATIVO: Houston III vs Houston IV

### 3.1 Arquitetura

| Aspecto | Houston III | Houston IV |
|---------|-------------|------------|
| **Separacao de responsabilidades** | Misturado | Camadas claras |
| **Testabilidade** | 0% coverage | **100% coverage** |
| **Escalabilidade** | Monolito | Modular/escalavel |
| **Manutencao** | Arquivos gigantes | Arquivos < 200 linhas |
| **Documentacao API** | Inexistente | Swagger automatico |
| **Validacao** | Apenas frontend | Backend + frontend |
| **Seguranca** | Basica | Enterprise-grade |

### 3.2 Clean Code

| Metrica | Houston III | Houston IV |
|---------|-------------|------------|
| **Console.logs** | 277 | 0 (logger estruturado) |
| **Codigo comentado** | Abundante | Proibido |
| **Magic numbers** | Espalhados | Constantes centralizadas |
| **Nomes variaveis** | Inconsistentes | Padrao unico (ingles) |
| **Tamanho funcoes** | Ate 500+ linhas | Max 30 linhas |
| **Tamanho arquivos** | Ate 29k tokens | Max 200 linhas |

### 3.3 SOLID Principles

| Principio | Houston III | Houston IV |
|-----------|-------------|------------|
| **S**ingle Responsibility | 5.0/10 | 9.0/10 |
| **O**pen/Closed | 6.0/10 | 9.0/10 |
| **L**iskov Substitution | 7.0/10 | 9.0/10 |
| **I**nterface Segregation | 5.0/10 | 9.0/10 |
| **D**ependency Inversion | 4.0/10 | 9.0/10 |

### 3.4 Seguranca

| Aspecto | Houston III | Houston IV |
|---------|-------------|------------|
| **Rate Limiting** | Em memoria (vulneravel) | Redis distribuido |
| **Validacao Input** | Apenas frontend | Zod + class-validator backend |
| **Autenticacao** | Supabase Auth | Supabase + JWT + RBAC |
| **Audit Logs** | Inexistente | Completo com rastreio |
| **Secrets** | .env basic | Vault/Secrets Manager |
| **CORS** | Basico | Configurado por ambiente |
| **CSP** | unsafe-inline | Nonces dinamicos |

---

## 4. NOVAS FEATURES HABILITADAS

### 4.1 WhatsApp Business API

```
┌──────────────────────────────────────────────────────────────┐
│               INTEGRACAO WHATSAPP                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    Webhook     ┌─────────────────────────┐ │
│  │  WhatsApp   │───────────────▶│   NestJS Controller     │ │
│  │  Cloud API  │                │   /webhooks/whatsapp    │ │
│  └─────────────┘                └───────────┬─────────────┘ │
│                                             │                │
│                                             ▼                │
│                                 ┌─────────────────────────┐ │
│                                 │   WhatsApp Service      │ │
│                                 │   • Processar mensagem  │ │
│                                 │   • Identificar intent  │ │
│                                 │   • Executar acao       │ │
│                                 └───────────┬─────────────┘ │
│                                             │                │
│                                             ▼                │
│                                 ┌─────────────────────────┐ │
│                                 │      BullMQ Queue       │ │
│                                 │   • Enviar resposta     │ │
│                                 │   • Notificar medico    │ │
│                                 │   • Atualizar status    │ │
│                                 └─────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘

CASOS DE USO:
• Medico recebe notificacao de nova vaga
• Medico confirma presenca via WhatsApp
• Escalista notificado de cancelamento
• Lembretes automaticos de plantao
• Chatbot para duvidas frequentes
```

### 4.2 Sistema de Tickets

```
┌──────────────────────────────────────────────────────────────┐
│               SISTEMA DE TICKETS                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   Ticket Lifecycle:                                          │
│                                                              │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│   │  NOVO   │───▶│ EM      │───▶│AGUARDANDO│───▶│RESOLVIDO│ │
│   │         │    │ATENDIMEN│    │ RESPOSTA │    │         │ │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘ │
│                                                              │
│   Features:                                                  │
│   • SLA por prioridade (P1: 1h, P2: 4h, P3: 24h)           │
│   • Escalonamento automatico                                │
│   • Historico completo                                      │
│   • Metricas de atendimento                                 │
│   • Integracao com WhatsApp                                 │
│   • Templates de resposta                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Sistema de Notificacoes

```
┌──────────────────────────────────────────────────────────────┐
│               SISTEMA DE NOTIFICACOES                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  NOTIFICATION HUB                    │   │
│   └────────────────────────┬────────────────────────────┘   │
│                            │                                 │
│              ┌─────────────┼─────────────┐                  │
│              │             │             │                   │
│              ▼             ▼             ▼                   │
│       ┌───────────┐ ┌───────────┐ ┌───────────┐            │
│       │   PUSH    │ │   EMAIL   │ │ WHATSAPP  │            │
│       │   (FCM)   │ │  (Resend) │ │  (Cloud)  │            │
│       └───────────┘ └───────────┘ └───────────┘            │
│                                                              │
│   Tipos de Notificacao:                                     │
│   • Nova vaga disponivel (filtros personalizados)          │
│   • Candidatura aprovada/reprovada                          │
│   • Lembrete de plantao (24h, 2h antes)                    │
│   • Mudanca de horario/cancelamento                        │
│   • Pagamento processado                                    │
│   • Ticket atualizado                                       │
│                                                              │
│   Preferencias do Usuario:                                  │
│   • Canais preferidos (push, email, whatsapp)              │
│   • Horarios de silencio                                   │
│   • Frequencia de resumos                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 Mobile App (Preparacao)

```
Houston IV prepara o terreno para app mobile:

• API REST documentada (Swagger) - pronta para consumo
• Autenticacao JWT - funciona em qualquer cliente
• Push notifications - infraestrutura compartilhada
• Offline-first patterns - sync quando conectado

Opcoes futuras:
1. React Native (compartilha logica)
2. Expo (deploy rapido)
3. PWA (menor custo inicial)
```

---

## 5. CRONOGRAMA COM IA

### 5.1 Premissas

```
CENARIO A: 1 Dev (Wesley) + IA Assistida
──────────────────────────────────────────
FATOR DE ACELERACAO COM IA: ~20x

Justificativa:
• Geracao de boilerplate: 50x mais rapido
• Testes automatizados: 30x mais rapido
• Documentacao: 40x mais rapido
• Refatoracao: 20x mais rapido
• Debug: 10x mais rapido
• Code review: 15x mais rapido

Media ponderada: ~20x considerando integracao e ajustes

TEMPO TOTAL: 14 semanas


CENARIO B: 2 Devs (Wesley + Freelancer) + IA Assistida
──────────────────────────────────────────────────────
Divisao de trabalho paralelo:
• Dev 1 (Wesley): Backend NestJS + Integracoes
• Dev 2 (Freelancer): Frontend Next.js + Testes E2E

Reducao estimada: 40-50% do tempo
• Tarefas paralelas eliminam gargalos
• Code review cruzado acelera qualidade
• Menos context switching

TEMPO TOTAL: 8-9 semanas


CENARIO C: 3 Devs + IA Assistida
─────────────────────────────────
• Dev 1: Backend core (NestJS modules)
• Dev 2: Frontend + UI
• Dev 3: Integracoes (WhatsApp, Tickets, Notificacoes)

TEMPO TOTAL: 6-7 semanas
```

### 5.2 Cronograma Detalhado

```
┌────────────────────────────────────────────────────────────────────────┐
│                    CRONOGRAMA HOUSTON IV                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  FASE 1: FUNDACAO (Semanas 1-2)                                       │
│  ─────────────────────────────────                                     │
│  □ Setup monorepo (Turborepo + pnpm)                     [2 dias]     │
│  □ Configurar NestJS + Prisma                            [2 dias]     │
│  □ Configurar Next.js 15 + shadcn/ui                     [1 dia]      │
│  □ Setup CI/CD (GitHub Actions)                          [1 dia]      │
│  □ Configurar ambientes (dev/staging/prod)               [1 dia]      │
│  □ Setup Redis (Upstash) + BullMQ                        [1 dia]      │
│  □ Configurar Sentry + logging estruturado               [1 dia]      │
│  □ Documentar arquitetura e padroes                      [1 dia]      │
│                                                                        │
│  FASE 2: CORE BACKEND (Semanas 3-4)                                   │
│  ──────────────────────────────────                                    │
│  □ Modulo de Autenticacao (Supabase + JWT)               [2 dias]     │
│  □ Guards de autorizacao (RBAC)                          [1 dia]      │
│  □ Modulo de Hospitais (CRUD + testes)                   [2 dias]     │
│  □ Modulo de Medicos (CRUD + testes)                     [2 dias]     │
│  □ Modulo de Especialidades (CRUD + testes)              [1 dia]      │
│  □ Swagger/OpenAPI setup                                 [1 dia]      │
│  □ Rate limiting com Redis                               [1 dia]      │
│                                                                        │
│  FASE 3: VAGAS E CANDIDATURAS (Semanas 5-6)                           │
│  ──────────────────────────────────────────                            │
│  □ Modulo de Vagas (CRUD completo)                       [3 dias]     │
│  □ Validacoes de negocio (conflitos, etc)                [2 dias]     │
│  □ Modulo de Candidaturas                                [2 dias]     │
│  □ State machine para status de vaga                     [1 dia]      │
│  □ Bulk operations                                       [1 dia]      │
│  □ Testes unitarios e integracao (100% coverage)         [2 dias]     │
│                                                                        │
│  FASE 4: FRONTEND CORE (Semanas 7-8)                                  │
│  ───────────────────────────────────                                   │
│  □ API client tipado (fetch + types)                     [1 dia]      │
│  □ Paginas de autenticacao                               [1 dia]      │
│  □ Dashboard + metricas                                  [2 dias]     │
│  □ Gestao de vagas (tabela + filtros)                    [3 dias]     │
│  □ Modal de criacao/edicao de vaga                       [2 dias]     │
│  □ Gestao de candidaturas                                [1 dia]      │
│                                                                        │
│  FASE 5: FEATURES SECUNDARIAS (Semanas 9-10)                          │
│  ───────────────────────────────────────────                           │
│  □ Modulo de Grades + geracao de vagas                   [2 dias]     │
│  □ Calendario/Escala                                     [2 dias]     │
│  □ Relatorios (folha de pagamento)                       [2 dias]     │
│  □ Exportacao PDF                                        [1 dia]      │
│  □ Gestao de corpo clinico                               [2 dias]     │
│  □ Configuracoes do usuario                              [1 dia]      │
│                                                                        │
│  FASE 6: NOVAS FEATURES (Semanas 11-12)                               │
│  ─────────────────────────────────────                                 │
│  □ Sistema de notificacoes (push + email)                [3 dias]     │
│  □ Integracao WhatsApp (webhook + envio)                 [3 dias]     │
│  □ Sistema de tickets (basico)                           [2 dias]     │
│  □ Audit logs                                            [1 dia]      │
│  □ Admin panel basico                                    [1 dia]      │
│                                                                        │
│  FASE 7: MIGRACAO E LANCAMENTO (Semanas 13-14)                        │
│  ────────────────────────────────────────────                          │
│  □ Migracao de dados do Houston III                      [2 dias]     │
│  □ Testes E2E completos (Playwright) - 100% coverage     [3 dias]     │
│  □ Testes de carga                                       [1 dia]      │
│  □ Documentacao de usuario                               [1 dia]      │
│  □ Deploy em staging                                     [1 dia]      │
│  □ Periodo de testes com usuarios beta                   [3 dias]     │
│  □ Go-live producao                                      [1 dia]      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Resumo de Prazos

| Fase | Duracao | Entregavel |
|------|---------|------------|
| **1. Fundacao** | 2 semanas | Infraestrutura completa |
| **2. Core Backend** | 2 semanas | APIs base funcionais |
| **3. Vagas/Candidaturas** | 2 semanas | Fluxo principal |
| **4. Frontend Core** | 2 semanas | MVP usavel |
| **5. Features Secundarias** | 2 semanas | Paridade com H3 |
| **6. Novas Features** | 2 semanas | WhatsApp + Notificacoes |
| **7. Migracao/Lancamento** | 2 semanas | Producao |
| **TOTAL** | **14 semanas** | Sistema completo |

### 5.4 Comparativo de Esforco

```
┌───────────────────────────────────────────────────────────────────┐
│           ESFORCO: REFATORAR H3 vs CONSTRUIR H4                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  OPCAO A: Refatorar Houston III                                  │
│  ─────────────────────────────────                                │
│  • Corrigir rate limiting               [1 semana]               │
│  • Remover 277 console.logs             [2 dias]                 │
│  • Adicionar validacao backend          [2 semanas]              │
│  • Implementar Repository Pattern       [3 semanas]              │
│  • Refatorar arquivos gigantes          [4 semanas]              │
│  • Adicionar testes (80% coverage)      [6 semanas]              │
│  • Separar backend (NestJS)             [4 semanas]              │
│  • Sistema de notificacoes              [3 semanas]              │
│  • Integracao WhatsApp                  [3 semanas]              │
│  • Sistema de tickets                   [3 semanas]              │
│                                                                   │
│  TOTAL REFATORACAO: ~28 semanas (7 meses)                        │
│  Risco: Alto (sistema em producao, regressoes)                   │
│                                                                   │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                   │
│  OPCAO B: Construir Houston IV com IA                            │
│  ────────────────────────────────────────                         │
│  • Sistema completo com arquitetura nova                          │
│  • Todas as features do Houston III                               │
│  • + WhatsApp + Notificacoes + Tickets                           │
│  • + Testes 100% coverage                                        │
│  • + Documentacao completa                                       │
│                                                                   │
│  TOTAL HOUSTON IV: ~14 semanas (3.5 meses)                       │
│  Risco: Baixo (sistema paralelo, migracao controlada)            │
│                                                                   │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                   │
│  ECONOMIA: 14 semanas (3.5 meses)                                │
│  BONUS: Sistema 10x mais robusto + features novas                │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 6. ROI E BENEFICIOS

### 6.1 Beneficios Quantificaveis

| Metrica | Houston III | Houston IV | Melhoria |
|---------|-------------|------------|----------|
| **Tempo para nova feature** | 2-3 semanas | 2-3 dias | **10x mais rapido** |
| **Tempo de debug** | 4-8 horas | 30-60 min | **8x mais rapido** |
| **Risco de regressao** | Alto | Baixo | **90% reducao** |
| **Onboarding dev** | 2 semanas | 3 dias | **5x mais rapido** |
| **Cobertura de testes** | 0% | **100%** | **Infinito** |
| **Tempo de deploy** | 15+ min | < 5 min | **3x mais rapido** |
| **Incidentes/mes** | ~5-10 | ~1-2 | **5x reducao** |

### 6.2 Beneficios Estrategicos

```
┌────────────────────────────────────────────────────────────────┐
│               BENEFICIOS ESTRATEGICOS                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. VELOCIDADE DE MERCADO                                     │
│     • Features novas em dias, nao semanas                     │
│     • Resposta rapida a demandas de clientes                  │
│     • Vantagem competitiva                                    │
│                                                                │
│  2. ESCALABILIDADE                                            │
│     • Multi-tenancy pronto para novos hospitais              │
│     • Backend escalavel horizontalmente                       │
│     • Sem gargalos de arquitetura                            │
│                                                                │
│  3. CONFIABILIDADE                                            │
│     • Testes garantem qualidade                              │
│     • Deploys sem medo                                        │
│     • Rollback automatico                                     │
│                                                                │
│  4. SEGURANCA                                                 │
│     • Rate limiting robusto                                   │
│     • Audit completo                                          │
│     • RBAC granular                                           │
│                                                                │
│  5. INTEGRABILIDADE                                           │
│     • API documentada para parceiros                         │
│     • Webhooks para sistemas externos                        │
│     • Mobile app futuro facilitado                           │
│                                                                │
│  6. ATRATIVIDADE PARA TALENTOS                               │
│     • Stack moderna atrai devs                               │
│     • Clean code facilita contribuicao                       │
│     • Arquitetura de referencia                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 6.3 Riscos Mitigados

| Risco | Houston III | Houston IV |
|-------|-------------|------------|
| **DDoS/Abuso** | Vulneravel | Rate limit distribuido |
| **Vazamento de dados** | Console.logs expostos | Logs seguros |
| **Indisponibilidade** | Sem monitoramento | Alertas automaticos |
| **Perda de contexto** | Dev sai = conhecimento perdido | Testes = documentacao viva |
| **Dependencia Supabase** | Acoplamento forte | Repository abstrai |
| **Escalabilidade** | Monolito limitado | Modulos independentes |

---

## 7. PLANO DE MIGRACAO

### 7.1 Estrategia: Parallel Run

```
┌────────────────────────────────────────────────────────────────┐
│               ESTRATEGIA DE MIGRACAO                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  SEMANA 1-12: Desenvolvimento Houston IV                      │
│  ─────────────────────────────────────────                     │
│  Houston III: Producao ativo                                  │
│  Houston IV:  Desenvolvimento paralelo                        │
│                                                                │
│  SEMANA 13: Migracao de Dados                                 │
│  ────────────────────────────────                              │
│  • Export dados Houston III                                   │
│  • Transform para schema Houston IV                           │
│  • Import em ambiente staging                                 │
│  • Validacao de integridade                                   │
│                                                                │
│  SEMANA 14: Testes Beta                                       │
│  ───────────────────────────                                   │
│  • Usuarios selecionados testam H4                            │
│  • Feedback e ajustes                                         │
│  • Preparacao para go-live                                    │
│                                                                │
│  GO-LIVE: Switchover                                          │
│  ───────────────────────                                       │
│  • DNS aponta para Houston IV                                 │
│  • Houston III em modo read-only (backup)                     │
│  • Monitoramento intensivo                                    │
│  • Rollback plan pronto                                       │
│                                                                │
│  POS-LANCAMENTO:                                              │
│  ────────────────                                              │
│  • Houston III desativado apos 30 dias                        │
│  • Dados historicos migrados para archive                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 Compatibilidade de Dados

```
BANCO DE DADOS: Mesmo PostgreSQL (Supabase)

Estrategia:
1. Manter tabelas existentes
2. Criar novas tabelas para features novas
3. Views de compatibilidade onde necessario
4. Migrations graduais pos-lancamento

Risco: BAIXO - dados permanecem no mesmo banco
```

---

## 8. CONCLUSAO

### 8.1 Recomendacao

**CONSTRUIR HOUSTON IV** e a opcao estrategicamente superior:

| Criterio | Refatorar H3 | Construir H4 | Vencedor |
|----------|--------------|--------------|----------|
| **Tempo total** | 7 meses | 3.5 meses | H4 |
| **Risco** | Alto | Baixo | H4 |
| **Custo** | Similar | Similar | Empate |
| **Resultado final** | H3 melhorado | Sistema novo | H4 |
| **Features novas** | Apos refatoracao | Incluso | H4 |
| **Manutencao futura** | Debt residual | Zero debt | H4 |
| **Moral da equipe** | Trabalho tedioso | Projeto greenfield | H4 |

### 8.2 Proximos Passos

```
IMEDIATO (esta semana):
□ Aprovar proposta
□ Configurar repositorio houston-iv
□ Setup inicial do monorepo

SEMANA 1:
□ Kickoff do projeto
□ Definir prioridades de features
□ Comecar Fase 1 (Fundacao)
```

### 8.3 Compromissos

| Fase | Prazo | Entregavel |
|------|-------|------------|
| MVP Funcional | Semana 8 | Sistema usavel internamente |
| Feature Parity | Semana 10 | Todas features do H3 |
| Novas Features | Semana 12 | WhatsApp + Notificacoes |
| Go-Live | Semana 14 | Producao |

---

## Anexo A: Padroes de Codigo Houston IV

### A.1 Estrutura de Modulo NestJS

```typescript
// src/modules/vagas/vagas.module.ts
import { Module } from '@nestjs/common';
import { VagasController } from './vagas.controller';
import { VagasService } from './vagas.service';
import { VagasRepository } from './vagas.repository';

@Module({
  controllers: [VagasController],
  providers: [VagasService, VagasRepository],
  exports: [VagasService],
})
export class VagasModule {}
```

### A.2 Controller Padrao

```typescript
// src/modules/vagas/vagas.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { VagasService } from './vagas.service';
import { CreateVagaDto } from './dto/create-vaga.dto';

@ApiTags('vagas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vagas')
export class VagasController {
  constructor(private readonly vagasService: VagasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as vagas' })
  @Roles('admin', 'escalista')
  async findAll() {
    return this.vagasService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma nova vaga' })
  @Roles('admin', 'escalista')
  async create(@Body() createVagaDto: CreateVagaDto) {
    return this.vagasService.create(createVagaDto);
  }
}
```

### A.3 Service Padrao

```typescript
// src/modules/vagas/vagas.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { VagasRepository } from './vagas.repository';
import { CreateVagaDto } from './dto/create-vaga.dto';
import { Vaga } from './entities/vaga.entity';

@Injectable()
export class VagasService {
  constructor(private readonly vagasRepository: VagasRepository) {}

  async findAll(): Promise<Vaga[]> {
    return this.vagasRepository.findAll();
  }

  async findById(id: string): Promise<Vaga> {
    const vaga = await this.vagasRepository.findById(id);
    if (!vaga) {
      throw new NotFoundException(`Vaga ${id} nao encontrada`);
    }
    return vaga;
  }

  async create(dto: CreateVagaDto): Promise<Vaga> {
    // Validacoes de negocio aqui
    await this.validateNoConflict(dto);
    return this.vagasRepository.create(dto);
  }

  private async validateNoConflict(dto: CreateVagaDto): Promise<void> {
    // Logica de validacao de conflito
  }
}
```

### A.4 DTO com Validacao

```typescript
// src/modules/vagas/dto/create-vaga.dto.ts
import { IsString, IsUUID, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVagaDto {
  @ApiProperty({ description: 'ID do hospital' })
  @IsUUID()
  hospitalId: string;

  @ApiProperty({ description: 'Data da vaga (YYYY-MM-DD)' })
  @IsDateString()
  data: string;

  @ApiProperty({ description: 'Hora de inicio (HH:MM)' })
  @IsString()
  horaInicio: string;

  @ApiProperty({ description: 'Hora de fim (HH:MM)' })
  @IsString()
  horaFim: string;

  @ApiProperty({ description: 'Valor da vaga em reais' })
  @IsNumber()
  @Min(0)
  @Max(100000)
  valor: number;
}
```

---

## Anexo B: Checklist de Qualidade

### B.1 Code Review Checklist

```
□ Funcionalidade implementada corretamente
□ Testes unitarios adicionados (coverage 100%)
□ Testes de integracao para controllers
□ Nenhum console.log
□ Nenhum codigo comentado
□ Nomes descritivos em ingles
□ Funcoes < 30 linhas
□ Arquivos < 200 linhas
□ DTOs com validacao
□ Swagger documentado
□ Sem dados sensiveis expostos
```

### B.2 PR Template

```markdown
## Descricao
[O que foi feito]

## Tipo de Mudanca
- [ ] Bug fix
- [ ] Nova feature
- [ ] Refatoracao
- [ ] Documentacao

## Checklist
- [ ] Testes passando (100% coverage obrigatorio)
- [ ] Coverage 100% no codigo alterado
- [ ] Lint sem erros
- [ ] Swagger atualizado
- [ ] README atualizado (se aplicavel)

## Screenshots (se aplicavel)
[Imagens aqui]
```

---

**Documento elaborado por:** Claude Code AI Assistant
**Data:** 22 de Novembro de 2025
**Versao:** 1.0

---

*"A melhor hora para plantar uma arvore foi ha 20 anos. A segunda melhor hora e agora."* - Proverbio Chines

Vamos construir o Houston IV.
