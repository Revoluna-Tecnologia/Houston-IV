<div align="center">

# Houston IV

**Enterprise-grade medical scheduling platform**

Built with architectural excellence, comprehensive test coverage, and production-ready infrastructure

[![Tests](https://img.shields.io/badge/tests-175%20files-brightgreen)](./RELATORIO_STATUS_ATUAL.md)
[![Coverage](https://img.shields.io/badge/backend%20coverage-73.69%25-green)](./RELATORIO_STATUS_ATUAL.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](.)
[![License](https://img.shields.io/badge/license-Private-red)](.)

[Architecture](#architecture) • [Tech Stack](#tech-stack) • [Testing](#testing) • [Getting Started](#getting-started)

</div>

---

## Overview

Houston IV is a complete rewrite of the medical scheduling system, eliminating technical debt and introducing enterprise-grade features. Built as a modern monorepo with **NestJS**, **Next.js 16**, and **PostgreSQL**, it delivers robust functionality with exceptional code quality.

### Key Metrics

| Metric | Value |
|--------|-------|
| **Test Files** | 175 (122 backend + 53 frontend) |
| **Test Coverage** | Backend 73.69% • Frontend 21.68% |
| **API Endpoints** | 121+ HTTP endpoints |
| **Modules** | 21 core + 3 sub-modules |
| **Components** | 99+ React components |
| **Data Models** | 21 Prisma entities |

---

## Architecture

### Design Principles

Houston IV follows **Domain-Driven Design** with **Clean Architecture** patterns:

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│   Controllers • Resolvers • WebSockets  │
├─────────────────────────────────────────┤
│           Application Layer             │
│    Services • Use Cases • Handlers      │
├─────────────────────────────────────────┤
│            Domain Layer                 │
│     Entities • Value Objects • Rules    │
├─────────────────────────────────────────┤
│          Infrastructure Layer           │
│  Repositories • Providers • External    │
└─────────────────────────────────────────┘
```

### Module Structure

**21 Core Modules** organized by business domain:

#### Foundation
- **Auth** - Better Auth with JWT & sessions
- **RBAC** - 5 hierarchical roles, 40+ permissions
- **Audit** - Complete action tracking with correlation IDs

#### Hospital Operations
- **Grupos** - Organization management
- **Hospitais** - Hospital CRUD with CNPJ validation
- **Setores** - Department management
- **Especialidades** - Medical specialties

#### Medical Management
- **Médicos** - Doctor profiles with CRM validation
- **Escalistas** - Doctor-group relationships
- **Vagas** - Schedule slots with state machine
- **Candidaturas** - Application workflow
- **Grades** - Monthly schedules
- **Check-in/out** - Attendance tracking
- **Pagamentos** - Payment processing

#### Communication & Collaboration
- **Tickets** - Support system with SLA tracking
- **Kanban** - Visual task management
- **Notificações** - Multi-channel notifications
- **Comunicação** - Real-time chat (Socket.IO)
- **WhatsApp** - Multi-provider integration

#### Reporting & Storage
- **Relatórios** - Business intelligence reports
- **Storage** - File upload with validation

---

## Tech Stack

<div align="center">

### Backend

| Technology | Version | Purpose |
|:----------:|:-------:|:--------|
| **NestJS** | 10.4.15 | Framework with dependency injection |
| **Prisma** | 6.19.1 | Type-safe ORM with migrations |
| **PostgreSQL** | 16-alpine | Relational database |
| **Better Auth** | 1.4.9 | Authentication & sessions |
| **Socket.IO** | 4.8.3 | Real-time bidirectional events |
| **Pino** | 10.1.0 | High-performance structured logging |
| **Helmet** | 8.1.0 | Security headers middleware |
| **Vitest** | 2.1.8 | Fast unit & integration testing |

### Frontend

| Technology | Version | Purpose |
|:----------:|:-------:|:--------|
| **Next.js** | 16.1.0 | React framework with App Router |
| **React** | 19.2.0 | UI library with Server Components |
| **Tailwind CSS** | 4.0.0 | Utility-first styling |
| **Radix UI** | Latest | Accessible component primitives |
| **TanStack Query** | 5.90.16 | Async state management |
| **React Hook Form** | 7.54.0 | Performant form handling |
| **Zod** | 3.24.0 | Schema validation |
| **Playwright** | Latest | End-to-end testing |

### Infrastructure

| Technology | Purpose |
|:----------:|:--------|
| **Turborepo** | Monorepo build system with caching |
| **pnpm** | Fast, disk-efficient package manager |
| **Docker** | Containerization & local development |
| **GitHub Actions** | CI/CD pipeline (ready) |

</div>

---

## Testing

### Test Pyramid Strategy

Houston IV maintains a **healthy test pyramid** with comprehensive coverage:

```
                    ┌─────────────┐
                    │    E2E      │   13 files (7%)
                    │  Playwright │   User flows
                    └─────────────┘
               ┌─────────────────────┐
               │    Integration      │   38 files (22%)
               │  Backend: 19        │   API + Database
               │  Frontend: 19       │   HTTP requests
               └─────────────────────┘
          ┌───────────────────────────────┐
          │           Unit                │   124 files (71%)
          │      Backend: 103             │   Isolated logic
          │      Frontend: 21             │   Components/hooks
          └───────────────────────────────┘
```

### Coverage Distribution

| Layer | Backend | Frontend | Total | Percentage |
|-------|:-------:|:--------:|:-----:|:----------:|
| **Unit** | 103 | 21 | **124** | 71% |
| **Integration** | 19 | 19 | **38** | 22% |
| **E2E** | 0 | 13 | **13** | 7% |
| **TOTAL** | **122** | **53** | **175** | **100%** |

### Module Coverage (19/19 Complete)

All core modules have **100% test coverage distribution**:

✅ hospitais • ✅ auth • ✅ candidaturas • ✅ kanban • ✅ tickets
✅ comunicacao • ✅ notifications • ✅ relatorios • ✅ whatsapp
✅ storage • ✅ vagas • ✅ medicos • ✅ grupos • ✅ escalistas
✅ grades • ✅ pagamentos • ✅ checkin-checkout • ✅ especialidades • ✅ setores

### Test Commands

```bash
# Unit tests (backend + frontend)
pnpm test

# Unit tests with coverage report
pnpm test:cov

# Integration tests (requires Docker)
pnpm test:integration

# E2E tests with Playwright (requires running app)
pnpm test:e2e

# Complete test suite (all layers)
pnpm test:all
```

---

## Security & Quality

### Security Features

- **Helmet** - Production-ready HTTP headers (CSP, HSTS, X-Frame-Options)
- **Rate Limiting** - 3-tier throttling (3/s, 20/10s, 100/min)
- **RBAC** - 5 hierarchical roles with 40+ granular permissions
- **Audit Trail** - Complete mutation tracking with correlation IDs
- **Input Validation** - class-validator + Zod schemas
- **Data Sanitization** - Sensitive data masking in logs
- **CNPJ/CPF Validation** - Brazilian document validators

### Code Quality

- **TypeScript** - 100% typed codebase
- **ESLint** - Strict linting rules with oxlint
- **Prettier** - Consistent code formatting
- **Husky** - Pre-commit hooks for quality gates
- **Vitest** - Fast test execution with coverage
- **Prisma** - Type-safe database queries

### Performance

- **Turborepo** - Incremental builds with smart caching
- **Next.js 16** - React Server Components & streaming
- **TanStack Query** - Optimistic updates & background refetch
- **Socket.IO** - Efficient real-time communication
- **Prisma** - Query optimization & connection pooling

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.9.0
- **pnpm** ≥ 9.15.0
- **PostgreSQL** ≥ 16
- **Docker** (optional, for containerized database)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd houston-iv

# Install dependencies
pnpm install

# Start PostgreSQL (Docker)
pnpm db:up

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs

### Project Structure

```
houston-iv/
├── apps/
│   ├── api/                    # Backend (NestJS)
│   │   ├── src/
│   │   │   ├── auth/           # Authentication & RBAC
│   │   │   ├── common/         # Shared filters, interceptors, pipes
│   │   │   ├── prisma/         # Database service
│   │   │   ├── storage/        # File uploads
│   │   │   ├── grupos/         # Group management
│   │   │   ├── hospitais/      # Hospital management
│   │   │   ├── medicos/        # Doctor management
│   │   │   ├── vagas/          # Schedule slots
│   │   │   ├── tickets/        # Support system
│   │   │   ├── kanban/         # Task management
│   │   │   ├── notifications/  # Multi-channel notifications
│   │   │   ├── comunicacao/    # Real-time chat
│   │   │   └── [15+ modules]   # Other business domains
│   │   └── prisma/
│   │       └── schema.prisma   # 906 lines, 21 models
│   │
│   └── web/                    # Frontend (Next.js)
│       ├── src/
│       │   ├── app/            # App Router (20+ routes)
│       │   ├── components/     # 99+ React components
│       │   ├── hooks/          # Custom hooks
│       │   ├── services/       # API clients
│       │   ├── __tests__/      # Unit & integration tests
│       │   └── lib/            # Utilities
│       └── e2e/                # Playwright E2E tests
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   └── tsconfig/               # TypeScript configurations
│
└── docs/                       # Technical documentation
```

---

## Development Commands

### Monorepo (Root)

```bash
pnpm dev              # Start all services
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm test             # Run unit tests
pnpm test:cov         # Run tests with coverage
pnpm test:all         # Complete test suite
pnpm clean            # Clean build artifacts
```

### Backend (apps/api)

```bash
cd apps/api
pnpm dev              # Development with hot-reload
pnpm build            # Production build
pnpm start            # Start production server
pnpm test             # Unit tests
pnpm test:cov         # Tests with coverage
pnpm test:integration # Integration tests
pnpm test:all         # All tests
pnpm db:migrate       # Run migrations
pnpm db:push          # Sync schema (dev only)
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database
```

### Frontend (apps/web)

```bash
cd apps/web
pnpm dev              # Development server
pnpm build            # Production build
pnpm start            # Start production server
pnpm test             # Unit tests
pnpm test:coverage    # Tests with coverage
pnpm test:integration # Integration tests
pnpm test:e2e         # Playwright E2E
pnpm test:e2e:ui      # E2E with UI mode
```

### Database

```bash
pnpm db:up            # Start PostgreSQL (Docker)
pnpm db:down          # Stop PostgreSQL
pnpm db:push          # Sync schema without migration
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio GUI
```

---

## RBAC System

### Hierarchical Roles

| Role | Level | Description |
|------|:-----:|-------------|
| **Administrador** | 4 | Full system access |
| **Moderador** | 3 | User & resource management |
| **Gestor** | 2 | Hospital & schedule management |
| **Coordenador** | 1 | Sector coordination |
| **Escalista** | 0 | Basic schedule operations |

### Granular Permissions

**40 permissions** following CRUD pattern across 10 resources:

- `vagas.*` - Schedule slots
- `medicos.*` - Doctors
- `grupos.*` - Groups
- `hospitais.*` - Hospitals
- `candidaturas.*` - Applications
- `pagamentos.*` - Payments
- `relatorios.*` - Reports
- `checkin_checkout.*` - Attendance
- `membros.*` - Members
- `roles.*` - Role management

Each resource has: `.select`, `.insert`, `.update`, `.delete`

---

## API Documentation

### Swagger/OpenAPI

Complete API documentation available at `/api/docs` when server is running.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | User authentication |
| GET | `/api/grupos` | List groups |
| GET | `/api/hospitais` | List hospitals |
| GET | `/api/medicos` | List doctors |
| GET | `/api/vagas` | List schedule slots |
| POST | `/api/vagas` | Create schedule slot |
| GET | `/api/candidaturas` | List applications |
| POST | `/api/candidaturas` | Apply to slot |
| GET | `/api/pagamentos` | List payments |
| GET | `/api/relatorios/*` | Generate reports |

### Rate Limiting

All endpoints are protected with multi-tier rate limiting:

| Tier | Window | Max Requests |
|------|--------|--------------|
| Short | 1 second | 3 |
| Medium | 10 seconds | 20 |
| Long | 1 minute | 100 |

---

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5433/houston

# Server
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Authentication
BETTER_AUTH_SECRET=your-256-bit-secret-key
BETTER_AUTH_URL=http://localhost:3001

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# WhatsApp (optional)
WHATSAPP_META_TOKEN=xxxxx
WHATSAPP_TWILIO_SID=xxxxx
WHATSAPP_ZAPSTER_TOKEN=xxxxx
```

### Frontend (.env.local)

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Auth
BETTER_AUTH_SECRET=your-256-bit-secret-key
BETTER_AUTH_URL=http://localhost:3001
```

---

## Deployment

### Production Build

```bash
# Build all packages
pnpm build

# Start backend
cd apps/api && pnpm start

# Start frontend
cd apps/web && pnpm start
```

### Docker (Coming Soon)

```bash
# Build images
docker compose build

# Start services
docker compose up -d
```

### Environment Checklist

- [ ] Set secure `BETTER_AUTH_SECRET` (256-bit)
- [ ] Configure production `DATABASE_URL`
- [ ] Set correct `CORS_ORIGIN`
- [ ] Add Resend API key for emails
- [ ] Configure file upload storage
- [ ] Set up SSL certificates
- [ ] Enable database connection pooling
- [ ] Configure monitoring (APM)

---

## Contributing

We follow strict quality standards:

1. **Branch** from `main`
2. **Write tests** for new features
3. **Maintain coverage** above 70%
4. **Follow TypeScript** strict mode
5. **Run linter** before commit
6. **Update docs** if needed
7. **Submit PR** with clear description

### Code Review Checklist

- [ ] Tests passing (`pnpm test:all`)
- [ ] Coverage maintained
- [ ] TypeScript strict mode
- [ ] No ESLint errors
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

---

## Documentation

- [Technical Report](./RELATORIO_STATUS_ATUAL.md) - Complete system analysis
- [Technical Specifications](./RELATORIO_TECNICO.md) - Architecture deep-dive
- [API Documentation](http://localhost:3001/api/docs) - Swagger/OpenAPI
- [Optimization Report](./OTIMIZACOES_APLICADAS_FINAL.md) - Performance improvements

---

## License

**Private** - All rights reserved.

---

<div align="center">

**Built with ❤️ by the Houston IV Team**



</div>
#   H o u s t o n - I V  
 