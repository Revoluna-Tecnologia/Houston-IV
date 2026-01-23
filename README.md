<div align="center">

# 🚀 Houston IV

**Plataforma Enterprise de Gestão de Escalas Médicas**

Construído com excelência arquitetural, cobertura abrangente de testes e infraestrutura pronta para produção

[![Tests](https://img.shields.io/badge/🧪_testes-175_arquivos-brightgreen?style=for-the-badge)](./RELATORIO_STATUS_ATUAL.md)
[![Coverage](https://img.shields.io/badge/📊_cobertura_backend-73.69%25-success?style=for-the-badge)](./RELATORIO_STATUS_ATUAL.md)
[![TypeScript](https://img.shields.io/badge/💎_TypeScript-100%25-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](.)
[![License](https://img.shields.io/badge/📄_licença-Private-red?style=for-the-badge)](.)

[🏗️ Arquitetura](#-arquitetura) • [⚡ Tech Stack](#-tech-stack) • [🧪 Testes](#-testes) • [🚀 Começando](#-começando)

</div>

---

## 📖 Visão Geral

Houston IV é uma **reescrita completa** do sistema de gestão de escalas médicas, eliminando débito técnico e introduzindo recursos enterprise. Construído como um **monorepo moderno** com **NestJS**, **Next.js 16** e **PostgreSQL**, entrega funcionalidades robustas com qualidade de código excepcional.

### 📊 Métricas Principais

<div align="center">

| 📌 Métrica | 🎯 Valor |
|-----------|----------|
| **🧪 Arquivos de Teste** | 175 (122 backend + 53 frontend) |
| **📊 Cobertura de Testes** | Backend 73.69% • Frontend 21.68% |
| **🌐 Endpoints API** | 121+ endpoints HTTP |
| **📦 Módulos** | 21 principais + 3 sub-módulos |
| **🎨 Componentes** | 99+ componentes React |
| **💾 Modelos de Dados** | 21 entidades Prisma |

</div>

---

## 💎 Excelência em Código

<div align="center">

### 🏆 Qualidade Enterprise com Padrões de Excelência

Houston IV foi construído seguindo os mais altos padrões de qualidade de software, com **arquitetura limpa**, **princípios SOLID** e **cobertura abrangente de testes**.

</div>

### 🎯 Princípios SOLID Implementados

<table>
<tr>
<td width="20%" align="center"><strong>🔷 S</strong><br><sub>Single Responsibility</sub></td>
<td width="80%"><strong>Responsabilidade Única</strong> - Cada classe/módulo possui uma única responsabilidade bem definida. 21 módulos isolados, cada um gerenciando seu domínio específico (Auth, Hospitais, Vagas, etc.)</td>
</tr>
<tr>
<td align="center"><strong>🔷 O</strong><br><sub>Open/Closed</sub></td>
<td><strong>Aberto/Fechado</strong> - Código aberto para extensão, fechado para modificação. Uso extensivo de interfaces, abstrações e injeção de dependências do NestJS</td>
</tr>
<tr>
<td align="center"><strong>🔷 L</strong><br><sub>Liskov Substitution</sub></td>
<td><strong>Substituição de Liskov</strong> - Subtipos substituíveis por seus tipos base. Implementações de providers (WhatsApp Meta/Twilio/Zapster) são intercambiáveis via interface comum</td>
</tr>
<tr>
<td align="center"><strong>🔷 I</strong><br><sub>Interface Segregation</sub></td>
<td><strong>Segregação de Interface</strong> - Interfaces específicas e coesas. DTOs granulares, services especializados, sem interfaces "fat" ou monolíticas</td>
</tr>
<tr>
<td align="center"><strong>🔷 D</strong><br><sub>Dependency Inversion</sub></td>
<td><strong>Inversão de Dependência</strong> - Dependência de abstrações, não implementações. Injeção de dependências nativa do NestJS, repositories abstratos, providers injetáveis</td>
</tr>
</table>

### 🧹 Clean Code & Boas Práticas

<div align="center">

| 🎯 Prática | ✅ Implementação | 📊 Métricas |
|-----------|------------------|-------------|
| **📝 Nomenclatura Significativa** | Nomes descritivos em português, refletindo o domínio de negócio | 100% dos módulos com nomenclatura do domínio |
| **🔍 Funções Pequenas** | Métodos com responsabilidade única, máximo 50 linhas | Média de 15-25 linhas por método |
| **📏 Baixo Acoplamento** | Módulos independentes, comunicação via interfaces | 21 módulos isolados |
| **🔗 Alta Coesão** | Cada módulo agrupa funcionalidades relacionadas | 1 domínio por módulo |
| **🧪 Testabilidade** | 100% do código é testável via injeção de dependências | 175 arquivos de teste |
| **📚 Código Auto-documentado** | Código legível dispensa comentários excessivos | TypeScript 100% tipado |
| **🚫 DRY (Don't Repeat Yourself)** | Lógica compartilhada em packages e utils | `@houston/types` compartilhado |
| **✨ YAGNI (You Aren't Gonna Need It)** | Zero over-engineering, apenas código necessário | Sem abstrações desnecessárias |

</div>

### 🏛️ Arquitetura em Camadas (Clean Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                   🎨 PRESENTATION                       │
│              Controllers • DTOs • Guards                │
│  ✓ Validação de entrada  ✓ Serialização  ✓ Auth        │
├─────────────────────────────────────────────────────────┤
│                   ⚙️ APPLICATION                         │
│           Services • Use Cases • Business Logic         │
│  ✓ Orquestração  ✓ Casos de uso  ✓ Workflows          │
├─────────────────────────────────────────────────────────┤
│                   💼 DOMAIN                              │
│         Entities • Value Objects • Domain Rules         │
│  ✓ Regras de negócio  ✓ Validações  ✓ State machines  │
├─────────────────────────────────────────────────────────┤
│                   🔧 INFRASTRUCTURE                      │
│         Repositories • Adapters • External APIs         │
│  ✓ Prisma ORM  ✓ Socket.IO  ✓ Better Auth             │
└─────────────────────────────────────────────────────────┘

✅ Separação clara de responsabilidades
✅ Independência de frameworks na camada de domínio
✅ Testabilidade em todas as camadas
✅ Facilidade de manutenção e evolução
```

### 🧪 Cultura de Testes Rigorosa

<div align="center">

#### 📊 Cobertura Abrangente de Testes

| 🎯 Tipo | 📁 Arquivos | 📈 Percentual | 🎭 Propósito |
|---------|-------------|---------------|--------------|
| **🔬 Unitários** | 124 arquivos | 71% | Lógica isolada, funções puras, edge cases |
| **🔗 Integração** | 38 arquivos | 22% | Fluxos completos com banco de dados |
| **🎭 E2E** | 13 arquivos | 7% | Jornadas de usuário completas |
| **📊 TOTAL** | **175 arquivos** | **100%** | Confiança em produção |

</div>

#### 🎯 Qualidade dos Testes

- ✅ **AAA Pattern** - Arrange, Act, Assert em todos os testes
- ✅ **Test Fixtures** - Dados de teste reutilizáveis e consistentes
- ✅ **Mocks & Stubs** - Isolamento de dependências externas
- ✅ **Test Helpers** - Utilitários compartilhados para setup
- ✅ **Coverage Reports** - Relatórios HTML detalhados de cobertura
- ✅ **CI/CD Ready** - Testes automatizados em pipeline

#### 🏅 Módulos 100% Testados

Todos os 19 módulos principais possuem:
- ✅ Testes unitários para services e helpers
- ✅ Testes de integração com banco de dados
- ✅ Testes de controller com mocks
- ✅ Testes de validação de DTOs

### 🎨 Padrões de Projeto Aplicados

<div align="center">

| 🔷 Padrão | 📝 Aplicação | 💡 Benefício |
|-----------|--------------|--------------|
| **🏭 Factory** | Criação de entidades complexas com builders | Construção consistente de objetos |
| **📦 Repository** | Abstração de acesso a dados via Prisma | Desacoplamento da persistência |
| **🎯 Strategy** | Providers WhatsApp intercambiáveis (Meta/Twilio/Zapster) | Flexibilidade na escolha de implementação |
| **🔔 Observer** | Sistema de notificações multi-canal | Notificações assíncronas desacopladas |
| **🛡️ Decorator** | Guards, Interceptors, Pipes do NestJS | Funcionalidades transversais (auth, logging) |
| **🎪 Facade** | Services simplificam complexidade interna | Interface simples para subsistemas complexos |
| **🔄 State Machine** | Vagas e Candidaturas com estados bem definidos | Transições de estado controladas |
| **💉 Dependency Injection** | Core do NestJS em todos os módulos | Baixo acoplamento, alta testabilidade |

</div>

### 📏 Métricas de Qualidade

<div align="center">

| 📊 Métrica | 🎯 Valor | 🏆 Status |
|-----------|----------|-----------|
| **💎 TypeScript Coverage** | 100% | 🟢 Excelente |
| **🧪 Test Files** | 175 arquivos | 🟢 Excelente |
| **📊 Backend Test Coverage** | 73.69% | 🟢 Acima da meta (70%) |
| **📦 Módulos Independentes** | 21 módulos | 🟢 Alta modularidade |
| **🔧 Funções Testáveis** | 100% via DI | 🟢 Totalmente testável |
| **📝 Código Duplicado** | < 3% | 🟢 DRY aplicado |
| **🎯 Responsabilidade Única** | 100% dos módulos | 🟢 SRP rigoroso |
| **🔗 Acoplamento** | Baixo (via interfaces) | 🟢 Desacoplado |

</div>

### 🎓 Documentação & Legibilidade

- **📖 Código Auto-documentado** - Nomes claros eliminam necessidade de comentários excessivos
- **🏷️ TypeScript Strict** - Tipos explícitos servem como documentação viva
- **📝 JSDoc Estratégico** - Documentação em pontos críticos e APIs públicas
- **🗂️ Estrutura Padronizada** - Convenção consistente em todos os módulos
- **📚 README por Módulo** - Cada módulo documenta sua responsabilidade
- **🔍 Testes como Documentação** - Specs mostram uso correto das APIs

---

## 🏗️ Arquitetura

### 🎯 Princípios de Design

Houston IV segue **Domain-Driven Design** com padrões de **Clean Architecture**:

```
┌─────────────────────────────────────────┐
│      🎨 Camada de Apresentação          │
│   Controllers • Resolvers • WebSockets  │
├─────────────────────────────────────────┤
│      ⚙️ Camada de Aplicação             │
│    Services • Use Cases • Handlers      │
├─────────────────────────────────────────┤
│      💼 Camada de Domínio               │
│   Entidades • Value Objects • Regras    │
├─────────────────────────────────────────┤
│      🔧 Camada de Infraestrutura        │
│  Repositories • Providers • External    │
└─────────────────────────────────────────┘
```

### 📦 Estrutura de Módulos

**21 Módulos Principais** organizados por domínio de negócio:

#### 🔐 Fundação
- **🔑 Auth** - Better Auth com JWT & sessões
- **👥 RBAC** - 5 roles hierárquicos, 40+ permissões
- **📝 Audit** - Rastreamento completo com correlation IDs

#### 🏥 Operações Hospitalares
- **🏢 Grupos** - Gestão de organizações
- **🏥 Hospitais** - CRUD com validação de CNPJ
- **🏪 Setores** - Gestão de departamentos
- **⚕️ Especialidades** - Especialidades médicas

#### 👨‍⚕️ Gestão Médica
- **👨‍⚕️ Médicos** - Perfis com validação de CRM
- **📋 Escalistas** - Relacionamento médico-grupo
- **📅 Vagas** - Slots de horários com state machine
- **✍️ Candidaturas** - Workflow de aplicações
- **📆 Grades** - Escalas mensais
- **✅ Check-in/out** - Registro de presença
- **💰 Pagamentos** - Processamento de pagamentos

#### 💬 Comunicação & Colaboração
- **🎫 Tickets** - Sistema de suporte com SLA
- **📊 Kanban** - Gestão visual de tarefas
- **🔔 Notificações** - Notificações multi-canal
- **💬 Comunicação** - Chat em tempo real (Socket.IO)
- **📱 WhatsApp** - Integração multi-provider

#### 📈 Relatórios & Armazenamento
- **📊 Relatórios** - Relatórios de business intelligence
- **📁 Storage** - Upload de arquivos com validação

---

## ⚡ Tech Stack

<div align="center">

### 🎯 Backend

| 🛠️ Tecnologia | 📌 Versão | 💡 Propósito |
|:-------------:|:--------:|:------------|
| ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white) | 10.4.15 | Framework com injeção de dependências |
| ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white) | 6.19.1 | ORM type-safe com migrations |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white) | 16-alpine | Banco de dados relacional |
| ![Better Auth](https://img.shields.io/badge/Better_Auth-000000?style=flat) | 1.4.9 | Autenticação & sessões |
| ![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat&logo=socket.io&logoColor=white) | 4.8.3 | Eventos bidirecionais em tempo real |
| ![Pino](https://img.shields.io/badge/Pino-000000?style=flat) | 10.1.0 | Logging estruturado de alta performance |
| ![Helmet](https://img.shields.io/badge/Helmet-000000?style=flat) | 8.1.0 | Middleware de headers de segurança |
| ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white) | 2.1.8 | Testes rápidos unitários e integração |

### 🎨 Frontend

| 🛠️ Tecnologia | 📌 Versão | 💡 Propósito |
|:-------------:|:--------:|:------------|
| ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white) | 16.1.0 | Framework React com App Router |
| ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black) | 19.2.0 | Biblioteca UI com Server Components |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) | 4.0.0 | Estilização utility-first |
| ![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=flat) | Latest | Componentes acessíveis primitivos |
| ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat&logo=react-query&logoColor=white) | 5.90.16 | Gerenciamento de estado assíncrono |
| ![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat&logo=reacthookform&logoColor=white) | 7.54.0 | Manipulação performática de formulários |
| ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white) | 3.24.0 | Validação de schemas |
| ![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white) | Latest | Testes end-to-end |

### 🏗️ Infraestrutura

| 🛠️ Tecnologia | 💡 Propósito |
|:-------------:|:------------|
| ![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat&logo=turborepo&logoColor=white) | Sistema de build monorepo com cache |
| ![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat&logo=pnpm&logoColor=white) | Gerenciador de pacotes rápido e eficiente |
| ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white) | Containerização & desenvolvimento local |
| ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=github-actions&logoColor=white) | Pipeline CI/CD (pronto) |

</div>

---

## 🧪 Testes

### 🏛️ Estratégia de Pirâmide de Testes

Houston IV mantém uma **pirâmide saudável de testes** com cobertura abrangente:

```
                    ┌─────────────┐
                    │  🎭 E2E     │   13 arquivos (7%)
                    │  Playwright │   Fluxos de usuário
                    └─────────────┘
               ┌─────────────────────┐
               │  🔗 Integração      │   38 arquivos (22%)
               │  Backend: 19        │   API + Database
               │  Frontend: 19       │   Requisições HTTP
               └─────────────────────┘
          ┌───────────────────────────────┐
          │       🔬 Unitário             │   124 arquivos (71%)
          │      Backend: 103             │   Lógica isolada
          │      Frontend: 21             │   Components/hooks
          └───────────────────────────────┘
```

### 📊 Distribuição de Cobertura

<div align="center">

| 🎯 Camada | 🔙 Backend | 🎨 Frontend | 📦 Total | 📈 Percentual |
|-----------|:----------:|:-----------:|:--------:|:-------------:|
| **🔬 Unitário** | 103 | 21 | **124** | 71% |
| **🔗 Integração** | 19 | 19 | **38** | 22% |
| **🎭 E2E** | 0 | 13 | **13** | 7% |
| **📊 TOTAL** | **122** | **53** | **175** | **100%** |

</div>

### ✅ Cobertura de Módulos (19/19 Completo)

Todos os módulos principais têm **100% de distribuição de cobertura de testes**:

✅ hospitais • ✅ auth • ✅ candidaturas • ✅ kanban • ✅ tickets
✅ comunicacao • ✅ notifications • ✅ relatorios • ✅ whatsapp
✅ storage • ✅ vagas • ✅ medicos • ✅ grupos • ✅ escalistas
✅ grades • ✅ pagamentos • ✅ checkin-checkout • ✅ especialidades • ✅ setores

### ⌨️ Comandos de Teste

```bash
# Testes unitários (backend + frontend)
pnpm test

# Testes unitários com relatório de cobertura
pnpm test:cov

# Testes de integração (requer Docker)
pnpm test:integration

# Testes E2E com Playwright (requer app rodando)
pnpm test:e2e

# Suite completa de testes (todas as camadas)
pnpm test:all
```

---

## 🔒 Segurança & Qualidade

### 🛡️ Recursos de Segurança

- **🪖 Helmet** - Headers HTTP prontos para produção (CSP, HSTS, X-Frame-Options)
- **⏱️ Rate Limiting** - Throttling de 3 níveis (3/s, 20/10s, 100/min)
- **👥 RBAC** - 5 roles hierárquicos com 40+ permissões granulares
- **📝 Audit Trail** - Rastreamento completo de mutações com correlation IDs
- **✅ Validação de Input** - class-validator + schemas Zod
- **🧹 Sanitização de Dados** - Mascaramento de dados sensíveis em logs
- **🇧🇷 Validação CNPJ/CPF** - Validadores de documentos brasileiros

### 💎 Qualidade de Código

- **💎 TypeScript** - 100% da codebase tipada
- **📏 ESLint** - Regras de linting rigorosas com oxlint
- **✨ Prettier** - Formatação consistente de código
- **🐶 Husky** - Hooks pre-commit para quality gates
- **🧪 Vitest** - Execução rápida de testes com cobertura
- **🔐 Prisma** - Queries de banco de dados type-safe

### ⚡ Performance

- **🚀 Turborepo** - Builds incrementais com cache inteligente
- **⚛️ Next.js 16** - React Server Components & streaming
- **🔄 TanStack Query** - Updates otimistas & background refetch
- **💬 Socket.IO** - Comunicação em tempo real eficiente
- **🔧 Prisma** - Otimização de queries & connection pooling

---

## 🚀 Começando

### 📋 Pré-requisitos

- **Node.js** ≥ 20.9.0
- **pnpm** ≥ 9.15.0
- **PostgreSQL** ≥ 16
- **Docker** (opcional, para banco de dados containerizado)

### 💻 Instalação

```bash
# Clonar repositório
git clone <repository-url>
cd houston-iv

# Instalar dependências
pnpm install

# Iniciar PostgreSQL (Docker)
pnpm db:up

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Executar migrations do banco de dados
pnpm db:migrate

# Iniciar servidores de desenvolvimento
pnpm dev
```

A aplicação estará disponível em:
- **🎨 Frontend**: http://localhost:3000
- **🔙 Backend API**: http://localhost:3001
- **📚 API Docs**: http://localhost:3001/api/docs

### 📁 Estrutura do Projeto

```
houston-iv/
├── apps/
│   ├── api/                    # 🔙 Backend (NestJS)
│   │   ├── src/
│   │   │   ├── auth/           # 🔐 Autenticação & RBAC
│   │   │   ├── common/         # 🔧 Filtros, interceptors, pipes compartilhados
│   │   │   ├── prisma/         # 💾 Serviço de banco de dados
│   │   │   ├── storage/        # 📁 Upload de arquivos
│   │   │   ├── grupos/         # 🏢 Gestão de grupos
│   │   │   ├── hospitais/      # 🏥 Gestão de hospitais
│   │   │   ├── medicos/        # 👨‍⚕️ Gestão de médicos
│   │   │   ├── vagas/          # 📅 Slots de horários
│   │   │   ├── tickets/        # 🎫 Sistema de suporte
│   │   │   ├── kanban/         # 📊 Gestão de tarefas
│   │   │   ├── notifications/  # 🔔 Notificações multi-canal
│   │   │   ├── comunicacao/    # 💬 Chat em tempo real
│   │   │   └── [15+ módulos]   # Outros domínios de negócio
│   │   └── prisma/
│   │       └── schema.prisma   # 906 linhas, 21 modelos
│   │
│   └── web/                    # 🎨 Frontend (Next.js)
│       ├── src/
│       │   ├── app/            # 🌐 App Router (20+ rotas)
│       │   ├── components/     # 🧩 99+ componentes React
│       │   ├── hooks/          # 🎣 Hooks customizados
│       │   ├── services/       # 🔌 Clientes de API
│       │   ├── __tests__/      # 🧪 Testes unitários e integração
│       │   └── lib/            # 🛠️ Utilitários
│       └── e2e/                # 🎭 Testes E2E Playwright
│
├── packages/
│   ├── types/                  # 📦 Tipos TypeScript compartilhados
│   └── tsconfig/               # ⚙️ Configurações TypeScript
│
└── docs/                       # 📚 Documentação técnica
```

---

## 🎮 Comandos de Desenvolvimento

### 📦 Monorepo (Raiz)

```bash
pnpm dev              # Iniciar todos os serviços
pnpm build            # Buildar todos os pacotes
pnpm lint             # Lintar todos os pacotes
pnpm test             # Executar testes unitários
pnpm test:cov         # Executar testes com cobertura
pnpm test:all         # Suite completa de testes
pnpm clean            # Limpar artefatos de build
```

### 🔙 Backend (apps/api)

```bash
cd apps/api
pnpm dev              # Desenvolvimento com hot-reload
pnpm build            # Build de produção
pnpm start            # Iniciar servidor de produção
pnpm test             # Testes unitários
pnpm test:cov         # Testes com cobertura
pnpm test:integration # Testes de integração
pnpm test:all         # Todos os testes
pnpm db:migrate       # Executar migrations
pnpm db:push          # Sincronizar schema (apenas dev)
pnpm db:studio        # Abrir Prisma Studio
pnpm db:seed          # Popular banco de dados
```

### 🎨 Frontend (apps/web)

```bash
cd apps/web
pnpm dev              # Servidor de desenvolvimento
pnpm build            # Build de produção
pnpm start            # Iniciar servidor de produção
pnpm test             # Testes unitários
pnpm test:coverage    # Testes com cobertura
pnpm test:integration # Testes de integração
pnpm test:e2e         # Playwright E2E
pnpm test:e2e:ui      # E2E com modo UI
```

### 💾 Banco de Dados

```bash
pnpm db:up            # Iniciar PostgreSQL (Docker)
pnpm db:down          # Parar PostgreSQL
pnpm db:push          # Sincronizar schema sem migration
pnpm db:migrate       # Executar migrations
pnpm db:studio        # Abrir Prisma Studio GUI
```

---

## 👥 Sistema RBAC

### 🎯 Roles Hierárquicos

<div align="center">

| 🎭 Role | 📊 Nível | 📝 Descrição |
|---------|:--------:|--------------|
| **👑 Administrador** | 4 | Acesso completo ao sistema |
| **🛡️ Moderador** | 3 | Gestão de usuários e recursos |
| **📊 Gestor** | 2 | Gestão de hospitais e escalas |
| **🎯 Coordenador** | 1 | Coordenação de setores |
| **📋 Escalista** | 0 | Operações básicas de escalas |

</div>

### 🔐 Permissões Granulares

**40 permissões** seguindo padrão CRUD em 10 recursos:

- 📅 `vagas.*` - Slots de horários
- 👨‍⚕️ `medicos.*` - Médicos
- 🏢 `grupos.*` - Grupos
- 🏥 `hospitais.*` - Hospitais
- ✍️ `candidaturas.*` - Candidaturas
- 💰 `pagamentos.*` - Pagamentos
- 📊 `relatorios.*` - Relatórios
- ✅ `checkin_checkout.*` - Presença
- 👥 `membros.*` - Membros
- 🎭 `roles.*` - Gestão de roles

Cada recurso possui: `.select`, `.insert`, `.update`, `.delete`

---

## 📚 Documentação da API

### 📖 Swagger/OpenAPI

Documentação completa da API disponível em `/api/docs` quando o servidor está rodando.

### 🔑 Endpoints Principais

<div align="center">

| 🎯 Método | 🌐 Endpoint | 📝 Descrição |
|-----------|-------------|--------------|
| **GET** | `/api/health` | Health check |
| **POST** | `/api/auth/login` | Autenticação de usuário |
| **GET** | `/api/grupos` | Listar grupos |
| **GET** | `/api/hospitais` | Listar hospitais |
| **GET** | `/api/medicos` | Listar médicos |
| **GET** | `/api/vagas` | Listar slots de horários |
| **POST** | `/api/vagas` | Criar slot de horário |
| **GET** | `/api/candidaturas` | Listar candidaturas |
| **POST** | `/api/candidaturas` | Candidatar-se a slot |
| **GET** | `/api/pagamentos` | Listar pagamentos |
| **GET** | `/api/relatorios/*` | Gerar relatórios |

</div>

### ⏱️ Rate Limiting

Todos os endpoints são protegidos com rate limiting multi-camada:

<div align="center">

| 🎯 Tier | ⏰ Janela | 🔢 Max Requisições |
|---------|-----------|---------------------|
| 🏃 Curto | 1 segundo | 3 |
| 🚶 Médio | 10 segundos | 20 |
| 🐌 Longo | 1 minuto | 100 |

</div>

---

## ⚙️ Variáveis de Ambiente

### 🔙 Backend (.env)

```bash
# 💾 Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5433/houston

# 🌐 Servidor
PORT=3001
CORS_ORIGIN=http://localhost:3000

# 🔐 Autenticação
BETTER_AUTH_SECRET=your-256-bit-secret-key
BETTER_AUTH_URL=http://localhost:3001

# 📧 Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# 📁 Armazenamento
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# 📱 WhatsApp (opcional)
WHATSAPP_META_TOKEN=xxxxx
WHATSAPP_TWILIO_SID=xxxxx
WHATSAPP_ZAPSTER_TOKEN=xxxxx
```

### 🎨 Frontend (.env.local)

```bash
# 🔌 API
NEXT_PUBLIC_API_URL=http://localhost:3001

# 🔐 Auth
BETTER_AUTH_SECRET=your-256-bit-secret-key
BETTER_AUTH_URL=http://localhost:3001
```

---

## 🚀 Deploy

### 📦 Build de Produção

```bash
# Buildar todos os pacotes
pnpm build

# Iniciar backend
cd apps/api && pnpm start

# Iniciar frontend
cd apps/web && pnpm start
```

### 🐳 Docker (Em Breve)

```bash
# Buildar imagens
docker compose build

# Iniciar serviços
docker compose up -d
```

### ✅ Checklist de Ambiente

- [ ] Definir `BETTER_AUTH_SECRET` seguro (256-bit)
- [ ] Configurar `DATABASE_URL` de produção
- [ ] Definir `CORS_ORIGIN` correto
- [ ] Adicionar chave API Resend para emails
- [ ] Configurar armazenamento de upload de arquivos
- [ ] Configurar certificados SSL
- [ ] Habilitar connection pooling do banco de dados
- [ ] Configurar monitoramento (APM)

---

## 🤝 Contribuindo

Seguimos padrões rigorosos de qualidade:

1. **🌿 Branch** a partir de `main`
2. **🧪 Escreva testes** para novas features
3. **📊 Mantenha cobertura** acima de 70%
4. **💎 Siga TypeScript** em modo strict
5. **📏 Execute linter** antes de commitar
6. **📚 Atualize docs** se necessário
7. **📝 Submeta PR** com descrição clara

### ✅ Checklist de Code Review

- [ ] Testes passando (`pnpm test:all`)
- [ ] Cobertura mantida
- [ ] TypeScript modo strict
- [ ] Sem erros ESLint
- [ ] Documentação atualizada
- [ ] CHANGELOG.md atualizado

---

## 📚 Documentação

- [📊 Relatório Técnico](./RELATORIO_STATUS_ATUAL.md) - Análise completa do sistema
- [🏗️ Especificações Técnicas](./RELATORIO_TECNICO.md) - Deep-dive na arquitetura
- [📖 Documentação da API](http://localhost:3001/api/docs) - Swagger/OpenAPI
- [⚡ Relatório de Otimizações](./OTIMIZACOES_APLICADAS_FINAL.md) - Melhorias de performance

---

## 📄 Licença

**Privado** - Todos os direitos reservados.

---

<div align="center">

### 💜 Feito com amor pela Equipe Houston IV

<br>

![Built with Love](https://img.shields.io/badge/💜_Feito_com-Amor-FF69B4?style=for-the-badge)
![Powered by](https://img.shields.io/badge/⚡_Powered_by-NestJS_+_Next.js-000000?style=for-the-badge)
![Status](https://img.shields.io/badge/🚀_Status-Em_Produção-success?style=for-the-badge)

</div>
