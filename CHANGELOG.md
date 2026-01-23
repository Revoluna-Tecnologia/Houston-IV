# Changelog

All notable changes to Houston IV will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-01-13

Comprehensive test coverage expansion and quality improvements.

### Added

#### Testing Infrastructure
- **Frontend Integration Tests**: Expansão massiva de 4 para 19 arquivos de testes de integração
  - Tickets integration tests (CRUD, status transitions, filtering, assignment)
  - Comunicacao integration tests (contacts CRUD, favorites, blocking, conversations)
  - Notifications integration tests (listing, mark as read, preferences)
  - Relatorios integration tests (folha pagamento, grades, produtividade)
  - Vagas integration tests (CRUD, status transitions, filtering)
  - Médicos integration tests (CRUD, activate/deactivate, filtering)
  - Grupos integration tests (CRUD, activate/deactivate, filtering)
  - Escalistas integration tests (CRUD, role management, filtering)
  - Grades integration tests (CRUD, timeslots, status transitions)
  - Pagamentos integration tests (CRUD, status transitions, batch operations)
  - WhatsApp integration tests (instances, messages, contacts)
  - Storage integration tests (upload, validation, file management)
  - Checkin-checkout integration tests (registration, validation)
  - Especialidades integration tests (CRUD, filtering)
  - Setores integration tests (CRUD, hospital relationship, filtering)

- **Test Commands**: Novos comandos no monorepo para execução de testes
  - `pnpm test:integration` - Executa testes de integração (backend + frontend)
  - `pnpm test:e2e` - Executa testes E2E com Playwright
  - `pnpm test:all` - Executa toda a pirâmide de testes (unit + integration + e2e)

- **Turbo.json Configuration**: Configuração de tasks para testes de integração e E2E
  - `test:integration` task com cache desabilitado
  - `test:e2e` task com cache desabilitado

#### Documentation
- **README.md**: Reescrita completa com design moderno e elegante
  - Badges de qualidade (175 testes, 73.69% coverage)
  - Arquitetura Clean Architecture com diagramas visuais
  - Tech stack detalhado (backend, frontend, infraestrutura)
  - Pirâmide de testes completa (71% unit, 22% integration, 7% E2E)
  - 21 módulos documentados organizados por domínio
  - Tabela de cobertura de integração (19/19 módulos completos)
  - Security features destacados (RBAC, Rate Limiting, Audit Trail)
  - Comandos completos incluindo test:all
  - Guia de instalação passo a passo
  - Deployment checklist para produção
  - Seção de RBAC com 40 permissões
  - API documentation com rate limiting
  - Environment variables completas

- **RELATORIO_STATUS_ATUAL.md**: Atualização para versão 1.1.0
  - Data atualizada: 13 de Janeiro de 2026
  - Métricas atualizadas: 175 arquivos de teste (122 backend + 53 frontend)
  - Pirâmide de testes visual atualizada
  - Tabela completa de cobertura por módulo (19/19)
  - Comandos de teste atualizados
  - Lista dos 13 arquivos E2E Playwright
  - Score atualizado: 9.2/10 (de 9.0/10)
  - Seção de comandos de teste expandida
  - Resumo de comandos com comparação

### Changed

- **Test Coverage Distribution**: Pirâmide de testes agora saudável
  - Unit: 124 arquivos (71%) - backend 103, frontend 21
  - Integration: 38 arquivos (22%) - backend 19, frontend 19
  - E2E: 13 arquivos (7%) - Playwright frontend
  - Total: 175 arquivos de teste

- **Frontend Integration Coverage**: Aumento de 375% (de 4 para 19 arquivos)
  - Cobertura completa de todos os módulos core
  - Paridade com backend (19/19 módulos)
  - Testes organizados por fluxos de negócio

### Fixed

- Write tool errors ao criar testes backend (descoberto que já existiam)
- Documentação de comandos de teste incompleta
- Falta de paridade entre cobertura backend/frontend

---

## [1.0.0] - 2025-12-31

Production-ready release with complete feature set for medical shift management platform.

### Added

#### Core Features
- **Tickets de Suporte**: Sistema completo com status, prioridade, atribuição e SLA tracking. Suporte a comentários aninhados, anexos e dashboard de analytics
- **Kanban Visual**: Gerenciamento de tarefas com colunas customizáveis, drag-and-drop entre cards, tags e filtros avançados
- **Notificações em Tempo Real**: Sistema unificado via WebSockets com suporte a múltiplos canais (email via Resend, push, toast). Preferências configuráveis por usuário
- **Integração WhatsApp**: Suporte a múltiplos provedores (Meta, Twilio, Zapster) com chat em tempo real, ofertas de escala via WhatsApp e histórico de conversas
- **Sistema de Relatórios**: Três tipos (folha de pagamento, grades, produtividade) com filtros avançados e agregação de dados

#### Autenticação e Autorização
- **RBAC Completo**: 5 roles hierárquicos (Administrador, Moderador, Gestor, Coordenador, Escalista)
- **Permissões Granulares**: 40 permissões em 10 recursos (vagas, médicos, grupos, hospitais, candidaturas, pagamentos, relatórios, check-in/check-out, membros, roles)
- **Guards Globais**: AuthGuard, PermissionsGuard, RolesGuard com decorators customizados (@RequirePermissions, @RequireRoles, @RequireMinRole, @Public, @CurrentUser)
- **Interface de Gerenciamento**: Página de administração para atribuição de roles e permissões com validação de permissões na UI

#### Segurança
- **Rate Limiting**: Três níveis de proteção (short: 3 req/s, medium: 20 req/10s, long: 100 req/min) com headers informativos
- **Headers de Segurança**: Helmet com Content-Security-Policy, X-Content-Type-Options, X-Frame-Options
- **Auditoria**: Interceptor global que registra todas as ações críticas (CREATE, UPDATE, DELETE) com IP, User-Agent e Correlation ID
- **Validadores Brasileiros**: CPF e CNPJ com validação de dígitos verificadores
- **Logging Estruturado**: Pino logger com redação automática de dados sensíveis

#### Gestão de Médicos e Vagas
- **Módulo de Médicos**: CRUD completo com validação de CRM único por UF, especialidades e status ativo/inativo
- **Módulo de Vagas**: Workflow de status (aberta, fechada, cancelada, anunciada) com máquina de estados, cálculo automático de valores, validação de conflitos de horário
- **Módulo de Grades**: Escalas mensais com status (rascunho, publicada, encerrada) e geração automática de vagas
- **Módulo de Candidaturas**: Workflow de aprovação com validação de candidaturas únicas
- **Módulo de Escalistas**: Gerenciamento da relação médico-grupo com status (pendente, ativo, inativo)

#### Operações
- **Check-in/Check-out**: Registro de presença em escalas com validação contra vagas existentes
- **Pagamentos**: Módulo completo com status (pendente, autorizado, pago, cancelado) e controle de valores por vaga
- **Gerenciamento de Hospitais**: CRUD com endereço completo, contatos, validação de CNPJ único e relacionamento com grupos
- **Gerenciamento de Setores**: Validação de setores únicos por hospital com relacionamento hierárquico

#### Frontend
- **Dashboard Principal**: Métricas em tempo real por período e hospital com filtros avançados
- **Páginas Funcionais**: Completas para tickets, Kanban, notificações, comunicação (chat), vagas, grades, médicos, hospitais, pagamentos, candidaturas, escalistas, relatórios e admin
- **Componentes Reutilizáveis**: DataTable, Filters, Modal, EmptyState, LoadingSpinner, DoctorSelector, HospitalSelector com suporte a múltiplas seleções
- **Formulários**: React Hook Form + Zod com máscaras (CPF, CNPJ) e validação em tempo real
- **Gateway WebSocket**: Cliente em tempo real para notificações, chat e atualizações de Kanban

#### Infraestrutura e Qualidade
- **Testes Automatizados**:
  - Backend: 103 unit tests, 19 integration tests
  - Frontend: 21 unit tests, 4 integration tests, 13 E2E tests (Playwright)
  - Total: 160 arquivos de teste
  - Coverage: Backend 73.69%, Frontend 21.68%
- **Documentação**: Segurança, testes, README técnico detalhado, exemplos de uso e guia de contribuição
- **API Documentation**: Swagger/OpenAPI completo
- **Armazenamento**: Módulo centralizado com suporte a upload, validação de tipos/tamanhos e URLs assinadas
- **Arquitetura**: Padrão Repository, DTOs com validação, paginação, filtros e ordenação em todas as listagens

### Changed

- **RelatoriosService**: Refatoração completa reduzindo 269 para 164 linhas (-39%) com extração de helpers e aplicação de SRP
- **Estrutura de Testes**: Reorganização por tipo (unit, integration, e2e) com configurações separadas no Vitest
- **Validação de Segurança**: BETTER_AUTH_SECRET agora obrigatório no startup sem fallback inseguro
- **Logging**: Proteção de console.log apenas para desenvolvimento com prefixo [DEV]
- **ApiClient**: Melhorias no tratamento de erros HTTP com suporte a rate limiting

### Fixed

- Tratamento adequado de erros 403 (Forbidden) no frontend
- Visualização de status de entrega e leitura em mensagens WhatsApp
- Validação de transições de status com máquina de estados em vagas

---

## [0.19.0] - 2025-12-30

### Added

- **WhatsApp Business API**: Integração completa com suporte a múltiplos provedores e instâncias por grupo
- **Sistema de Chat**: Comunicação em tempo real com suporte a texto, imagens, áudio, vídeo, documentos e localização
- **Gestão de Contatos**: Vinculação de contatos a médicos com ofertas de escala via WhatsApp

### Changed

- Arquitetura de comunicação com módulos separados por funcionalidade

---

## [0.18.0] - 2025-12-29

### Added

- **Módulo de Storage**: Gerenciamento centralizado de arquivos com suporte a upload, validação de tipos/tamanhos e URLs assinadas
- **Upload no Frontend**: Hook useFileUpload com validação e feedback visual

---

## [0.17.0] - 2025-12-28

### Added

- Documentação completa (Segurança, Testes, README técnico, Guia de Contribuição)
- API Documentation com Swagger/OpenAPI

---

## [0.16.0] - 2025-12-27

### Added

- **Testes Automatizados**: E2E para RBAC e rate limiting, testes de integração com PostgreSQL via Docker, testes unitários React
- **Fixtures Reutilizáveis**: Para criação de dados de teste
- **Cobertura Expandida**: 49 arquivos de teste no backend com mocks completos

### Changed

- Estrutura de testes reorganizada por tipo (unit, integration, e2e)

---

## [0.15.0] - 2025-12-26

### Added

- **Auditoria Global**: AuditInterceptor que registra todas as ações críticas com IP, User-Agent e Correlation ID
- **Modelo AuditLog**: Rastreamento de CREATE, UPDATE, DELETE com valores antigos e novos
- **Sanitização**: Campos sensíveis (senhas, tokens) automaticamente removidos dos logs

---

## [0.14.0] - 2025-12-25

### Added

- **Proteção Granular**: Decorator @RequirePermissions em 121 endpoints de 19 controllers
- **Guards de Autorização**: 66 testes específicos para AuthGuard, PermissionsGuard e RolesGuard
- **Interface**: Ocultação de ações baseada em permissões do usuário com validação antes de exibir botões

---

## [0.13.0] - 2025-12-24

### Added

- **RBAC Completo**: 5 roles hierárquicos com 40 permissões em 10 recursos
- **PermissionsService**: Gerenciamento centralizado de permissões
- **Decorators Customizados**: @RequirePermissions, @RequireRoles, @RequireMinRole, @Public, @CurrentUser
- **Interface de Administração**: Página de gerenciamento de usuários com atribuição de roles
- **Proteção de Rotas**: Validação de roles no frontend

---

## [0.12.0] - 2025-12-23

### Added

- **Rate Limiting**: Três níveis (short, medium, long) com headers informativos
- **Headers de Segurança**: Helmet com CSP e proteção contra clickjacking
- **Logger Estruturado**: Pino com pretty printing em desenvolvimento
- **Validação de Ambiente**: Obrigatória no startup

### Changed

- Console.log protegido apenas para desenvolvimento com prefixo [DEV]

---

## [0.11.0] - 2025-12-22

### Added

- **Validadores Brasileiros**: CPF e CNPJ com validação de dígitos verificadores
- **Máscaras de Entrada**: CPF e CNPJ nos formulários com validação em tempo real

### Changed

- **RelatoriosService**: Refatoração (-39%) com extração de helpers (filtros, cálculos, formatação)
- **Validação de Senha**: Aumentada de 6 para 8 caracteres
- **BETTER_AUTH_SECRET**: Agora obrigatório no startup

---

## [0.10.0] - 2025-12-21

### Added

- **Módulo de Relatórios**: Três tipos (folha de pagamento, grades, produtividade) com agregação de dados
- **Filtros Avançados**: Por período, hospital, setor e médico
- **Endpoint de Filtros**: Listagem de hospitais, setores, médicos e meses disponíveis

---

## [0.9.0] - 2025-12-20

### Added

- **Módulo de Pagamentos**: Múltiplos status (pendente, autorizado, pago, cancelado) com controle de valores
- **Módulo de Check-in/Check-out**: Registro de presença com validação contra vagas existentes
- **Interface de Pagamentos**: Tabela com filtros por status, médico e período

---

## [0.8.0] - 2025-12-19

### Added

- **Módulo de Grades**: Gerenciamento de escalas mensais com status (rascunho, publicada, encerrada)
- **TimeSlots**: Definição de períodos dentro de grades
- **Geração Automática**: De vagas a partir de grades publicadas
- **Interface de Grades**: Cards com status visual, grid de timeslots e modal de geração de vagas

---

## [0.7.0] - 2025-12-18

### Added

- **Módulo de Candidaturas**: Workflow de aprovação com validação de candidaturas únicas por vaga e médico
- **Interface de Candidaturas**: Tabela com ações de aprovação/rejeição direto

---

## [0.6.0] - 2025-12-17

### Added

- **Módulo de Vagas**: Workflow de status com máquina de estados, cálculo automático de valores
- **Validação de Conflitos**: Detecção automática de horários conflitantes para médicos
- **Interface de Vagas**: Tabela com filtros avançados, modais de criação/edição/detalhes
- **Formulários Completos**: Validação de datas, horários, valores com React Hook Form + Zod

---

## [0.5.0] - 2025-11-30

### Added

- **Módulo de Escalistas**: Gerenciamento da relação médico-grupo com status (pendente, ativo, inativo)
- **Interface de Escalistas**: Tabela com filtros e gerenciamento de status

---

## [0.4.0] - 2025-11-28

### Added

- **Módulo de Médicos**: CRUD completo com validação de CRM único por UF, especialidades e status ativo/inativo
- **Interface de Médicos**: Tabela, filtros, modais de criação/edição/detalhes
- **Seletor de Médicos**: Componente reutilizável para uso em outros formulários

---

## [0.3.0] - 2025-11-25

### Added

- **Módulo de Setores**: Gerenciamento com relacionamento hierárquico hospital-setor
- **Seletores Reutilizáveis**: HospitalSelector e MultiHospitalSelector
- **Integração**: De setores na página de hospitais

---

## [0.2.0] - 2025-11-20

### Added

- **Módulo de Hospitais**: CRUD completo com endereço, contato, validação de CNPJ único
- **Interface de Hospitais**: Tabela com filtros, modais de criação/edição/detalhes
- **Service Integrado**: Com cache e gerenciamento de estado via hook customizado

---

## [0.1.0] - 2025-11-15

### Added

#### Project Setup
- Inicialização do projeto Houston IV com Turborepo + pnpm
- Backend NestJS 10.x com arquitetura modular
- Frontend Next.js 16.1 com App Router
- PostgreSQL com Prisma ORM
- Monorepo workspace structure com packages compartilhados

#### Core Infrastructure
- Vitest com threshold de 100% de cobertura
- Oxlint para code quality
- Docker Compose para desenvolvimento local
- Turborepo com pipeline de build otimizado

#### TypeScript & Config
- Package de tipos compartilhados (@houston/types)
- Package de configurações TypeScript (@houston/tsconfig)

#### Frontend Foundation
- Design system com 25+ componentes shadcn/ui
- Better Auth para autenticação
- ApiClient customizado com interceptors
- Tailwind CSS 4.0 com design tokens personalizados
- Layout base com Sidebar, Header e navegação responsiva
- Rotas protegidas com autenticação
- Hooks customizados (useAuth, usePagination, useTableSort)
- React Hook Form + Zod para validação
- Componentes reutilizáveis (DataTable, Filters, Modal, EmptyState, LoadingSpinner)

#### Backend Foundation
- Módulo de grupos e especialidades
- Health check endpoint
- Swagger/OpenAPI documentado
- Padrão Repository para isolamento de dados
- DTOs com validação (class-validator)
- Paginação em todas as listagens
- Filtros e ordenação em queries
- HttpExceptionFilter global com tratamento padronizado
- TransformInterceptor para respostas padronizadas
- ValidationPipe global no NestJS

---

## Semantic Versioning

Este projeto segue [Semantic Versioning](https://semver.org/):
- **MAJOR** version (X.0.0): Breaking changes
- **MINOR** version (0.X.0): New features (backwards-compatible)
- **PATCH** version (0.0.X): Bug fixes (backwards-compatible)

## Types of Changes

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
