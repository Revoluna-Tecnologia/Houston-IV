# Modulo de Comunicacao

## Visao Geral

O modulo de comunicacao implementa um sistema completo de mensagens em tempo real para o Houston IV, incluindo:

- **Conversas**: Suporte a chats diretos (1:1) e grupos
- **Mensagens**: Texto, midia, arquivos, ofertas de plantao
- **WhatsApp Multi-Provider**: Integracao com Zapster, Twilio e Meta
- **WebSocket**: Comunicacao bidirecional em tempo real
- **Webhooks**: Recebimento de eventos dos providers

## Arquitetura

```
comunicacao/
├── comunicacao.module.ts           # Modulo principal
├── conversations/                   # Gerenciamento de conversas
│   ├── conversations.controller.ts  # API REST
│   ├── conversations.service.ts     # Logica de negocio
│   ├── conversations.repository.ts  # Acesso a dados
│   ├── participants.repository.ts   # Participantes
│   └── dto/                         # Data Transfer Objects
├── messages/                        # Gerenciamento de mensagens
│   ├── messages.controller.ts       # API REST
│   ├── messages.service.ts          # Logica de negocio
│   ├── messages.repository.ts       # Acesso a dados
│   ├── messages.gateway.ts          # WebSocket Gateway
│   └── dto/
├── contacts/                        # Contatos salvos
│   ├── contacts.controller.ts
│   ├── contacts.service.ts
│   ├── contacts.repository.ts
│   └── dto/
├── shift-offers/                    # Ofertas de plantao via chat
│   ├── shift-offers.controller.ts
│   ├── shift-offers.service.ts
│   ├── shift-offers.repository.ts
│   └── dto/
├── types/                           # Tipos compartilhados
└── mappers/                         # Mapeadores de dados

whatsapp/
├── whatsapp.module.ts              # Modulo de integracao WhatsApp
├── whatsapp.service.ts             # Servico abstrato (facade)
├── providers/                       # Strategy Pattern para providers
│   ├── whatsapp-provider.interface.ts
│   ├── zapster.provider.ts         # Provider Zapster
│   ├── twilio.provider.ts          # Provider Twilio
│   └── meta.provider.ts            # Provider Meta/Facebook
├── zapster/                         # Cliente Zapster especifico
│   └── zapster.service.ts
├── instances/                       # Instancias WhatsApp por grupo
│   ├── instances.controller.ts
│   ├── instances.service.ts
│   └── instances.repository.ts
└── webhooks/                        # Processamento de webhooks
    ├── webhooks.controller.ts
    ├── webhooks.service.ts
    └── dto/
```

## Padrao Arquitetural

O modulo segue os principios **Clean Code** e **SOLID**:

### Single Responsibility Principle (SRP)
- **Controller**: Recebe requisicoes HTTP, valida entrada, retorna resposta
- **Service**: Logica de negocio, orquestracao, validacoes complexas
- **Repository**: Acesso a dados, queries Prisma

### Dependency Inversion
- Interfaces definem contratos (ex: `IWhatsAppProvider`)
- Implementacoes concretas (Zapster, Twilio, Meta) implementam a interface
- Provider selecionado via variavel de ambiente `WHATSAPP_PROVIDER`

## Entidades do Banco

### Conversation (chat_conversations)
```prisma
model Conversation {
  id                 String           @id @default(uuid())
  type               ConversationType // direct | group
  name               String?
  createdById        String
  grupoId            String
  zapsterGroupId     String?
  isArchived         Boolean          @default(false)
  lastMessageAt      DateTime?
  lastMessagePreview String?
  createdAt          DateTime
  updatedAt          DateTime

  participants       ChatParticipant[]
  messages           ChatMessage[]
}
```

### ChatParticipant (chat_participants)
```prisma
model ChatParticipant {
  id             String          @id @default(uuid())
  conversationId String
  userId         String?
  medicoId       String?
  phoneNumber    String
  role           ParticipantRole // admin | member
  isMuted        Boolean         @default(false)
  unreadCount    Int             @default(0)
  joinedAt       DateTime
  leftAt         DateTime?
  lastReadAt     DateTime?
}
```

### ChatMessage (chat_messages)
```prisma
model ChatMessage {
  id                String        @id @default(uuid())
  conversationId    String
  senderId          String?
  senderPhone       String
  content           String?
  messageType       MessageType   // text | image | file | audio | video | shift_offer | ...
  replyToId         String?
  metadata          Json?
  status            MessageStatus // sending | sent | delivered | read | failed
  whatsappMessageId String?
  createdAt         DateTime
  deliveredAt       DateTime?
  readAt            DateTime?
  deletedAt         DateTime?
}
```

### WhatsAppInstance (whatsapp_instances)
```prisma
model WhatsAppInstance {
  id                 String                  @id @default(uuid())
  grupoId            String                  @unique
  provider           WhatsAppProvider
  providerInstanceId String
  instanceName       String
  status             WhatsAppInstanceStatus  // connected | disconnected | connecting | offline
  phoneNumber        String?
  metadata           Json?
  createdById        String
  createdAt          DateTime
  updatedAt          DateTime
}
```

## API Endpoints

### Conversas

| Metodo | Endpoint | Descricao | Permissao |
|--------|----------|-----------|-----------|
| GET | `/conversations` | Listar conversas | COMUNICACAO_SELECT |
| GET | `/conversations/:id` | Buscar conversa | COMUNICACAO_SELECT |
| POST | `/conversations` | Criar conversa | COMUNICACAO_INSERT |
| PATCH | `/conversations/:id` | Atualizar conversa | COMUNICACAO_UPDATE |
| DELETE | `/conversations/:id` | Deletar conversa | COMUNICACAO_DELETE |
| POST | `/conversations/:id/archive` | Arquivar/desarquivar | COMUNICACAO_UPDATE |
| POST | `/conversations/:id/participants` | Adicionar participante | COMUNICACAO_UPDATE |
| DELETE | `/conversations/:id/participants/:participantId` | Remover participante | COMUNICACAO_UPDATE |

### Mensagens

| Metodo | Endpoint | Descricao | Permissao |
|--------|----------|-----------|-----------|
| GET | `/messages/conversation/:id` | Listar mensagens | COMUNICACAO_SELECT |
| GET | `/messages/:id` | Buscar mensagem | COMUNICACAO_SELECT |
| POST | `/messages` | Enviar mensagem | COMUNICACAO_INSERT |
| POST | `/messages/:id/read` | Marcar como lida | COMUNICACAO_UPDATE |
| DELETE | `/messages/:id` | Deletar mensagem | COMUNICACAO_DELETE |

### Contatos

| Metodo | Endpoint | Descricao | Permissao |
|--------|----------|-----------|-----------|
| GET | `/contacts` | Listar contatos | COMUNICACAO_SELECT |
| GET | `/contacts/:id` | Buscar contato | COMUNICACAO_SELECT |
| POST | `/contacts` | Criar contato | COMUNICACAO_INSERT |
| PATCH | `/contacts/:id` | Atualizar contato | COMUNICACAO_UPDATE |
| DELETE | `/contacts/:id` | Deletar contato | COMUNICACAO_DELETE |

### Ofertas de Plantao

| Metodo | Endpoint | Descricao | Permissao |
|--------|----------|-----------|-----------|
| GET | `/shift-offers` | Listar ofertas | COMUNICACAO_SELECT |
| GET | `/shift-offers/:id` | Buscar oferta | COMUNICACAO_SELECT |
| POST | `/shift-offers` | Criar oferta | COMUNICACAO_INSERT |
| POST | `/shift-offers/:id/respond` | Responder oferta | COMUNICACAO_UPDATE |
| DELETE | `/shift-offers/:id` | Cancelar oferta | COMUNICACAO_DELETE |

### Instancias WhatsApp

| Metodo | Endpoint | Descricao | Permissao |
|--------|----------|-----------|-----------|
| GET | `/whatsapp/instances` | Listar instancias | WHATSAPP_SELECT |
| GET | `/whatsapp/instances/:id` | Buscar instancia | WHATSAPP_SELECT |
| POST | `/whatsapp/instances` | Criar instancia | WHATSAPP_INSERT |
| DELETE | `/whatsapp/instances/:id` | Deletar instancia | WHATSAPP_DELETE |
| GET | `/whatsapp/instances/:id/qr` | Obter QR Code | WHATSAPP_SELECT |
| POST | `/whatsapp/instances/:id/connect` | Conectar instancia | WHATSAPP_UPDATE |
| POST | `/whatsapp/instances/:id/disconnect` | Desconectar | WHATSAPP_UPDATE |

### Webhooks

| Metodo | Endpoint | Descricao | Permissao |
|--------|----------|-----------|-----------|
| POST | `/webhooks/whatsapp/zapster` | Webhook Zapster | Publico (signature) |
| POST | `/webhooks/whatsapp/twilio` | Webhook Twilio | Publico (signature) |
| POST | `/webhooks/whatsapp/meta` | Webhook Meta | Publico (signature) |
| GET | `/webhooks/whatsapp/meta` | Verificacao Meta | Publico |

## WebSocket Gateway

O gateway `/chat` suporta os seguintes eventos:

### Eventos Cliente -> Servidor
- `join:conversation` - Entrar em sala de conversa
- `leave:conversation` - Sair de sala
- `typing:start` - Indicar que esta digitando
- `typing:stop` - Parar indicacao de digitacao

### Eventos Servidor -> Cliente
- `message:new` - Nova mensagem recebida
- `message:status` - Status de mensagem atualizado
- `message:deleted` - Mensagem deletada
- `conversation:update` - Conversa atualizada
- `typing:update` - Status de digitacao

## Configuracao Multi-Provider

O provider WhatsApp e selecionado via variavel de ambiente:

```env
# Provider ativo (zapster | twilio | meta)
WHATSAPP_PROVIDER=zapster

# Configuracao Zapster
ZAPSTER_API_KEY=sua_api_key
ZAPSTER_WEBHOOK_URL=https://seu-dominio.com/webhooks/whatsapp/zapster
ZAPSTER_WEBHOOK_SECRET=seu_secret

# Configuracao Twilio (opcional)
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=+5511999999999
TWILIO_WEBHOOK_URL=https://seu-dominio.com/webhooks/whatsapp/twilio

# Configuracao Meta (opcional)
META_APP_ID=123456789
META_APP_SECRET=xxxxx
META_PHONE_NUMBER_ID=123456789
META_ACCESS_TOKEN=EAAxxxxx
META_WEBHOOK_VERIFY_TOKEN=seu_token
```

## Permissoes RBAC

Novas permissoes adicionadas ao sistema:

```typescript
// Comunicacao
COMUNICACAO_SELECT = 'comunicacao.select'
COMUNICACAO_INSERT = 'comunicacao.insert'
COMUNICACAO_UPDATE = 'comunicacao.update'
COMUNICACAO_DELETE = 'comunicacao.delete'

// WhatsApp
WHATSAPP_SELECT = 'whatsapp.select'
WHATSAPP_INSERT = 'whatsapp.insert'
WHATSAPP_UPDATE = 'whatsapp.update'
WHATSAPP_DELETE = 'whatsapp.delete'
```

### Matriz de Permissoes por Role

| Role | comunicacao.* | whatsapp.* |
|------|---------------|------------|
| administrador | Todas | Todas |
| moderador | Todas | select, update |
| gestor | Todas | select |
| coordenador | select, insert, update | - |
| escalista | select, insert | - |

## Exemplos de Uso

### Criar conversa direta
```typescript
POST /conversations
{
  "type": "direct",
  "participantPhones": ["+5511999999999"]
}
```

### Criar grupo
```typescript
POST /conversations
{
  "type": "group",
  "name": "Plantao UTI",
  "participantPhones": ["+5511999999999", "+5511888888888"]
}
```

### Enviar mensagem de texto
```typescript
POST /messages
{
  "conversationId": "uuid-da-conversa",
  "content": "Ola, tudo bem?",
  "messageType": "text"
}
```

### Enviar oferta de plantao
```typescript
POST /shift-offers
{
  "conversationId": "uuid-da-conversa",
  "vagaId": "uuid-da-vaga",
  "recipientMedicoId": "uuid-do-medico"
}
```

### Responder oferta
```typescript
POST /shift-offers/:id/respond
{
  "action": "accept" | "reject"
}
```

## Consideracoes de Seguranca

1. **Validacao de Webhook**: Todos os webhooks validam assinatura HMAC
2. **Acesso por Grupo**: Usuarios so veem conversas de seus grupos
3. **Permissoes Granulares**: RBAC com verificacao em cada endpoint
4. **Rate Limiting**: Aplicado via ThrottlerGuard global
5. **Auditoria**: Todas as acoes criticas sao logadas

## Proximos Passos

1. [ ] Implementar storage de midia (S3/R2)
2. [ ] Adicionar notificacoes push (FCM/OneSignal)
3. [ ] Implementar busca full-text em mensagens
4. [ ] Adicionar suporte a mencoes (@usuario)
5. [ ] Implementar templates de mensagem para Meta
