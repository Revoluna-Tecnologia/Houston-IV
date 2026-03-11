# Roadmap de Implementacao – Houston IV

**Objetivo:** Corrigir problemas identificados no relatorio de analise e completar features faltantes, em fases ordenadas por dependencia e impacto.

**Referencia:** [RELATORIO_ANALISE_COMPLETA.md](./RELATORIO_ANALISE_COMPLETA.md)

**Ultima atualizacao:** Marco 2026

---

## Legenda de Status

| Icone | Significado |
|-------|-------------|
| :white_check_mark: | Concluido |
| :hourglass_flowing_sand: | Em andamento |
| :x: | Pendente |
| :warning: | Bloqueado ou com problema |

---

## Visao geral das fases

| Fase | Nome | Objetivo principal | Status | Duracao estimada |
|------|------|--------------------|--------|------------------|
| **0** | Correcao de Build Frontend | Resolver imports quebrados que impedem build | :white_check_mark: Concluido | 0,5 dia |
| **1** | Desbloqueio da API | Expor Comunicacao, WhatsApp e Storage no AppModule | :white_check_mark: Concluido | 1-2 dias |
| **2** | Upload de midia em mensagens | Implementar `POST /messages/upload` e integrar ao Storage | :white_check_mark: Concluido | 1 dia |
| **3** | Ajustes de configuracao e ambiente | .env, README, logs | :white_check_mark: Concluido | 0,5 dia |
| **4** | TODOs de negocio (backend) | Shift-offers resposta, avatar em conversas | :white_check_mark: Concluido | 1-2 dias |
| **5** | Navegacao e UX (frontend) | Grades detalhe, setores do hospital | :white_check_mark: Concluido | 0,5-1 dia |
| **6** | CI/CD e qualidade | GitHub Actions, alinhamento de docs | :white_check_mark: Concluido | 1-2 dias |
| **7** | Documentacao e relatorios | Relatorios citados, ADRs (opcional) | :white_check_mark: Concluido | 1 dia |

---

## Fase 0 – Correcao de Build Frontend (NOVA)

**Objetivo:** Resolver imports quebrados que impedem o build do frontend.

**Justificativa:** Descoberto na analise de marco/2026 — componentes de notificacao importam hooks e componentes que nao existem no projeto. Sem esta correcao, o frontend nao compila.

### 0.1 Hook `use-toast` inexistente

- [ ] Criar `apps/web/src/hooks/use-toast.ts` (usando Sonner, react-hot-toast, ou implementacao customizada).
- [ ] Ou substituir imports em `notification-toast.tsx` e `notification-preferences.tsx` por alternativa existente.

### 0.2 Componente `ScrollArea` inexistente

- [ ] Instalar `@radix-ui/react-scroll-area` (se nao instalado).
- [ ] Criar `apps/web/src/components/ui/scroll-area.tsx` baseado no primitivo Radix.
- [ ] Ou substituir import em `notification-list.tsx` por alternativa existente.

### 0.3 Validacao

- [ ] Rodar `pnpm build` no workspace web e confirmar que compila sem erros.
- [ ] Verificar que as paginas `/notifications` e `/settings/notifications` renderizam corretamente.

### Entregaveis

- Frontend compila sem erros de import.
- Paginas de notificacoes acessiveis e funcionais.

---

## Fase 1 – Desbloqueio da API

**Objetivo:** ComunicacaoModule, WhatsAppModule e StorageModule registrados e acessiveis; Storage com endpoint de upload se necessario para outros fluxos.

### 1.1 Registrar modulos no AppModule

- [ ] Importar `ComunicacaoModule` em `apps/api/src/app.module.ts`.
- [ ] Importar `WhatsAppModule.forRoot()` em `apps/api/src/app.module.ts`.
- [ ] Importar `StorageModule` em `apps/api/src/app.module.ts`.
- [ ] Rodar a aplicacao e validar que as rotas de comunicacao, whatsapp (e storage, se houver controller) aparecem no Swagger e respondem.

**Detalhes da implementacao existente (referencia):**

| Modulo | Submodulos | Controllers | WebSocket |
|--------|-----------|-------------|-----------|
| ComunicacaoModule | Conversations, Messages, Contacts, ShiftOffers | 4 controllers completos | MessagesGateway (`/chat`) com typing, status, real-time |
| WhatsAppModule | Instances, Webhooks, Providers | 2 controllers | — |
| StorageModule | — | Apenas StorageService (sem controller HTTP) | — |

### 1.2 Storage: controller (opcional nesta fase)

- Se houver contrato no frontend para `/storage/upload` generico: criar `StorageController` com `POST /storage/upload` (multipart), usando `StorageService`, e garantir que o modulo ja exporta o controller.
- Se o uso for apenas em mensagens, pode deixar para a Fase 2.

### Entregaveis

- Rotas `/api/conversations`, `/api/messages`, `/api/contacts`, `/api/shift-offers` (e whatsapp/storage conforme definido) disponiveis.
- WebSocket gateway `/chat` funcional (typing indicators, message status, real-time delivery).
- Testes de integracao existentes dos modulos passando com a API montada.

---

## Fase 2 – Upload de midia em mensagens

**Objetivo:** Frontend conseguir enviar midia no chat; backend persistir e retornar URL.

### 2.1 Backend: endpoint `POST /messages/upload`

- [ ] No `MessagesController` (ou em controller dedicado de mensagens), adicionar rota `POST /upload`.
- [ ] Receber `multipart/form-data` (campo `file`).
- [ ] Usar `StorageService.uploadBuffer` com subdiretorio adequado (ex.: `messages` ou `comunicacao`).
- [ ] Validar tipo/tamanho de arquivo (StorageService ja tem: MIME whitelist, 25MB max).
- [ ] Retornar `{ url, mimeType, fileName }` conforme esperado por `messages-service.ts` no frontend.

### 2.2 Frontend

- [ ] Garantir que `uploadMedia` em `messages-service.ts` continua chamando `POST .../messages/upload` (ja esta).
- [ ] Testar envio de arquivo em um fluxo de mensagem (manual ou E2E).

### 2.3 Testes

- [ ] Teste unitario do controller de mensagens para `POST /upload`.
- [ ] Teste de integracao: upload real (ou mock de filesystem) e verificacao de resposta.

### Entregaveis

- `POST /api/messages/upload` implementado e documentado no Swagger.
- Upload de midia funcionando na tela de comunicacao.

---

## Fase 3 – Ajustes de configuracao e ambiente

**Objetivo:** Ambiente e documentacao coerentes com Better Auth e sem vazamento de configuracao em logs.

### 3.1 Variaveis de ambiente

- [ ] Atualizar `.env.example` na raiz: remover ou substituir `JWT_*` por referencia a Better Auth (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, etc.) e variaveis comuns (ex.: `DATABASE_URL`, `PORT`, `NODE_ENV`).
- [ ] Adicionar variaveis faltantes: `RESEND_API_KEY`, `WHATSAPP_PROVIDER`, credenciais WhatsApp por provider.
- [ ] Incluir comentario apontando para `apps/api/.env.example` e `apps/web` para detalhes por app.

### 3.2 Logs

- [ ] Remover ou condicionar a desenvolvimento o `console.log` de `trustedOrigins` em `auth.config.ts` (ou onde estiver).

### 3.3 README

- [ ] Corrigir mencao de "ESLint" para a ferramenta real (oxlint).
- [ ] Corrigir "21 Prisma Models" para **35 models** (contagem real do schema).
- [ ] Atualizar ou remover links para `RELATORIO_STATUS_ATUAL.md`, `RELATORIO_TECNICO.md`, `OTIMIZACOES_APLICADAS_FINAL.md` ate que os arquivos existam (ver Fase 7).
- [ ] Corrigir mencao "GitHub Actions (pronto)" — diretorio existe mas esta vazio.

### Entregaveis

- `.env.example` alinhado ao uso real; auth sem log desnecessario em producao; README consistente.

---

## Fase 4 – TODOs de negocio (backend)

**Objetivo:** Completar comportamentos pendentes em comunicacao e shift-offers.

**Nota:** Apenas 2 TODOs encontrados no backend (codebase muito limpo).

### 4.1 Shift-offers: mensagem de resposta na conversa

- [ ] Em `shift-offers.service.ts:148`, no fluxo de resposta a oferta (aceitar/recusar), implementar o envio de uma mensagem na conversa correspondente (ex.: "Oferta aceita" / "Oferta recusada") usando o servico de mensagens ou evento que o MessagesService consuma.
- [ ] Teste unitario e/ou de integracao cobrindo o fluxo.

### 4.2 Conversas: avatar

- [ ] Em `conversations.service.ts:479`, onde hoje esta `avatarUrl: undefined`, definir origem do avatar (ex.: primeiro participante, tabela User, ou URL por participante) e preencher `avatarUrl`.
- [ ] Ajustar DTO/response para expor `avatarUrl` quando aplicavel.

### Entregaveis

- Resposta a shift-offer gera mensagem na conversa; lista/detalhe de conversa exibe avatar quando disponivel.

---

## Fase 5 – Navegacao e UX (frontend)

**Objetivo:** Navegacao completa para detalhe de grade e para setores do hospital.

### 5.1 Grade – detalhe

- [ ] Na listagem de grades (`apps/web/src/app/(dashboard)/grades/page.tsx`), implementar navegacao para pagina de detalhe da grade (ex.: `grades/[id]`).
- [ ] Criar rota `grades/[id]` (ou equivalente) com conteudo adequado (dados da grade, slots, etc.).
- [ ] Remover ou implementar o TODO "Implement navigation to grade details page".

### 5.2 Hospitais – setores

- [ ] Na listagem de hospitais (`apps/web/src/app/(dashboard)/hospitais/page.tsx`), implementar navegacao para pagina de setores do hospital (ex.: `hospitais/[id]/setores` ou link para listagem de setores filtrada por hospital).
- [ ] Remover ou implementar o TODO "Implement navigation to hospital sectors page".

### Entregaveis

- Usuario pode ir da listagem de grades para o detalhe da grade; da listagem de hospitais para os setores do hospital.

---

## Fase 6 – CI/CD e qualidade

**Objetivo:** Pipeline automatizado de lint e testes; documentacao de qualidade alinhada.

**Status atual:** Diretorio `.github/workflows/` existe mas esta **vazio**. Nenhum workflow configurado.

### 6.1 GitHub Actions

- [ ] Criar workflow (ex.: `.github/workflows/ci.yml`) que:
  - Rode em push/PR para `main` (e opcionalmente outras branches).
  - Instale dependencias (pnpm).
  - Rode lint (comando de lint do monorepo — oxlint).
  - Rode testes unitarios (`pnpm test` ou equivalente).
  - Opcional: testes de integracao (ex.: com servicos em Docker) e E2E (ex.: Playwright para web).
- [ ] Documentar no README como rodar CI localmente e o que cada job faz.

### 6.2 Qualidade e docs

- [ ] Se o projeto for padronizado em oxlint, garantir que README e guias de contribuicao citem oxlint (nao ESLint), a menos que haja migracao planejada.

### 6.3 Cobertura frontend

- [ ] Cobertura frontend esta em 21,68% — considerar aumentar para pelo menos 50% nos fluxos criticos (auth, comunicacao, tickets).

### Entregaveis

- CI verde para lint e testes; README atualizado com instrucoes de CI.

---

## Fase 7 – Documentacao e relatorios

**Objetivo:** Recuperar ou recriar relatorios referenciados no README e, se desejado, iniciar ADRs.

### 7.1 Relatorios

- [ ] Recriar ou mover para o repositorio os arquivos:
  - `RELATORIO_STATUS_ATUAL.md` (status do projeto, cobertura, metricas).
  - `RELATORIO_TECNICO.md` (arquitetura, decisoes tecnicas).
  - `OTIMIZACOES_APLICADAS_FINAL.md` (otimizacoes de performance).
- [ ] Ou atualizar README removendo links quebrados e apontando para `docs/RELATORIO_ANALISE_COMPLETA.md` e este roadmap como referencia atual.

### 7.2 ADRs (opcional)

- [ ] Criar pasta `docs/adr/` e template de ADR.
- [ ] Registrar decisoes ja tomadas (ex.: Better Auth, RBAC, Prisma, Strategy Pattern WhatsApp, Socket.IO) em ADRs iniciais.

### Entregaveis

- Links do README funcionando ou substituidos por documentacao atual; opcionalmente, primeiros ADRs publicados.

---

## Ordem de execucao sugerida

```text
Fase 0 (Build frontend)  →  Fase 1 (Desbloqueio API)  →  Fase 2 (Upload mensagens)
                                      ↓
                              Fase 3 (Config/ambiente)
                                      ↓
                   Fase 4 (TODOs backend)  →  Fase 5 (Navegacao frontend)
                                      ↓
                   Fase 6 (CI/CD)  →  Fase 7 (Documentacao)
```

- **Fase 0** e bloqueante para qualquer deploy do frontend.
- **Fases 1 e 2** sao bloqueantes para uso completo de Comunicacao no frontend.
- **Fase 3** pode ser feita em paralelo ou logo apos 1.
- **Fases 4 e 5** podem ser feitas em paralelo apos 2.
- **Fases 6 e 7** podem ser feitas em paralelo e apos as entregas de 4 e 5.

---

## Checklist final (pre-producao)

- [ ] **Fase 0:** Frontend compila sem erros (use-toast, ScrollArea resolvidos).
- [ ] **Fase 1:** ComunicacaoModule, WhatsAppModule e StorageModule registrados e testados.
- [ ] **Fase 2:** `POST /messages/upload` implementado e coberto por testes.
- [ ] **Fase 3:** Variaveis de ambiente documentadas; sem logs sensiveis em producao; README consistente.
- [ ] **Fase 4:** TODOs de shift-offers e avatar implementados.
- [ ] **Fase 5:** Navegacao para detalhe de grade e setores do hospital implementada.
- [ ] **Fase 6:** CI (lint + testes) rodando no GitHub Actions.
- [ ] **Fase 7:** README e relatorios atualizados ou links corrigidos.

---

## Inventario de features implementadas

Para referencia, este e o estado atual de todas as features do sistema:

### Backend (API) — 18/21 modulos ativos

| Feature | Modulo | Endpoints | Testes | Status |
|---------|--------|-----------|--------|--------|
| Health Check | HealthModule | 1 | Sim | :white_check_mark: Ativo |
| Autenticacao | AuthController + Better Auth | Multi | Sim | :white_check_mark: Ativo |
| RBAC | RbacModule | Guards | Sim | :white_check_mark: Ativo (5 roles, 40+ perms) |
| Grupos | GruposModule | CRUD | Sim | :white_check_mark: Ativo |
| Especialidades | EspecialidadesModule | CRUD | Sim | :white_check_mark: Ativo |
| Hospitais | HospitaisModule | CRUD | Sim | :white_check_mark: Ativo |
| Setores | SetoresModule | CRUD | Sim | :white_check_mark: Ativo |
| Medicos | MedicosModule | 26+ | Sim | :white_check_mark: Ativo |
| Escalistas | EscalistasModule | CRUD | Sim | :white_check_mark: Ativo |
| Vagas | VagasModule | CRUD + state machine | Sim | :white_check_mark: Ativo |
| Candidaturas | CandidaturasModule | CRUD + workflow | Sim | :white_check_mark: Ativo |
| Grades | GradesModule | CRUD | Sim | :white_check_mark: Ativo |
| Relatorios | RelatoriosModule | Multi | Sim | :white_check_mark: Ativo |
| Checkin/Checkout | CheckinCheckoutModule | CRUD | Sim | :white_check_mark: Ativo |
| Pagamentos | PagamentosModule | CRUD | Sim | :white_check_mark: Ativo |
| Tickets | TicketsModule + Comments + Attachments | CRUD + SLA | Sim | :white_check_mark: Ativo |
| Kanban | KanbanModule | CRUD | Sim | :white_check_mark: Ativo |
| Notificacoes | NotificationsModule | CRUD + real-time + email | Sim | :white_check_mark: Ativo |
| Comunicacao | ComunicacaoModule | 4 controllers + WebSocket | Sim | :warning: Implementado mas NAO registrado |
| WhatsApp | WhatsAppModule | 2 controllers (3 providers) | Sim | :warning: Implementado mas NAO registrado |
| Storage | StorageModule | Service only (sem controller) | Sim | :warning: Implementado mas NAO registrado |

### Frontend (Web) — 17/19 paginas funcionais

| Pagina | Rota | Backend | Status |
|--------|------|---------|--------|
| Login | `/auth/login` | Auth | :white_check_mark: Funcional |
| Forgot Password | `/auth/forgot-password` | Auth | :white_check_mark: Funcional |
| Reset Password | `/auth/reset-password` | Auth | :white_check_mark: Funcional |
| Dashboard | `/` | Multi | :white_check_mark: Funcional |
| Admin Users | `/admin/users` | Auth/RBAC | :white_check_mark: Funcional |
| Medicos | `/medicos` | MedicosModule | :white_check_mark: Funcional |
| Hospitais | `/hospitais` | HospitaisModule | :white_check_mark: Funcional |
| Escalistas | `/escalistas` | EscalistasModule | :white_check_mark: Funcional |
| Vagas | `/vagas` | VagasModule | :white_check_mark: Funcional |
| Candidaturas | `/candidaturas` | CandidaturasModule | :white_check_mark: Funcional |
| Grades | `/grades` | GradesModule | :white_check_mark: Funcional |
| Pagamentos | `/pagamentos` | PagamentosModule | :white_check_mark: Funcional |
| Comunicacao | `/comunicacao` | ComunicacaoModule | :warning: UI pronta, backend nao registrado |
| Kanban | `/kanban` | KanbanModule | :white_check_mark: Funcional |
| Tickets | `/tickets` | TicketsModule | :white_check_mark: Funcional |
| Ticket Analytics | `/tickets/analytics` | TicketsModule | :white_check_mark: Funcional |
| Support | `/support` + `/support/[id]` | TicketsModule | :white_check_mark: Funcional |
| Settings | `/settings` | Auth | :white_check_mark: Funcional |
| Notifications | `/notifications` | NotificationsModule | :x: Build error (imports quebrados) |
| Settings Notifications | `/settings/notifications` | NotificationsModule | :x: Build error (imports quebrados) |

### Funcionalidades Transversais

| Feature | Status | Detalhes |
|---------|--------|----------|
| WebSocket (Socket.IO) | :white_check_mark: Implementado | MessagesGateway + NotificationsGateway |
| Email (Resend) | :white_check_mark: Implementado | Templates HTML, bulk, degradacao graceful |
| Audit Logging | :white_check_mark: Ativo | Interceptor em todas mutacoes, sanitizacao |
| Rate Limiting | :white_check_mark: Ativo | 3 tiers (3/s, 20/10s, 100/min) |
| Swagger/OpenAPI | :white_check_mark: Ativo | `/api/docs` |
| Seguranca (Helmet) | :white_check_mark: Ativo | Headers HTTP |
| Testes | :white_check_mark: 175 arquivos | 73,69% backend / 21,68% frontend |

Quando todos os itens do checklist estiverem concluidos, a aplicacao estara alinhada ao relatorio de analise e pronta para os proximos passos de deploy e monitoramento.
