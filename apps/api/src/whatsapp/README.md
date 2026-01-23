# Modulo WhatsApp Multi-Provider

## Visao Geral

O modulo WhatsApp implementa uma arquitetura multi-provider usando o **Strategy Pattern**, permitindo alternar entre diferentes provedores de WhatsApp Business API sem alterar o codigo da aplicacao.

## Providers Suportados

| Provider | Status | Recursos |
|----------|--------|----------|
| **Zapster** | Ativo | Instancias, QR Code, Mensagens, Grupos, Webhooks |
| **Twilio** | Implementado | Mensagens, Templates, Webhooks |
| **Meta** | Implementado | Mensagens, Templates, Grupos, Webhooks |

## Arquitetura

```
whatsapp/
├── whatsapp.module.ts          # Modulo principal
├── whatsapp.service.ts         # Facade que abstrai o provider
├── providers/
│   ├── whatsapp-provider.interface.ts  # Contrato do provider
│   ├── zapster.provider.ts     # Implementacao Zapster
│   ├── twilio.provider.ts      # Implementacao Twilio
│   └── meta.provider.ts        # Implementacao Meta
├── instances/
│   ├── instances.controller.ts # API de instancias
│   ├── instances.service.ts    # Logica de instancias
│   ├── instances.repository.ts # Persistencia
│   └── dto/
├── webhooks/
│   ├── webhooks.controller.ts  # Endpoints de webhook
│   ├── webhooks.service.ts     # Processamento de eventos
│   └── dto/
└── types/
    └── index.ts                # Tipos e enums
```

## Interface do Provider

Todos os providers implementam a interface `IWhatsAppProvider`:

```typescript
interface IWhatsAppProvider {
  readonly providerName: string

  // Instancias
  listInstances(): Promise<ProviderInstance[]>
  getInstance(instanceId: string): Promise<ProviderInstance>
  createInstance(name: string): Promise<ProviderInstance>
  deleteInstance(instanceId: string): Promise<void>
  getConnectionStatus(instanceId: string): Promise<ConnectionStatus>
  getQRCode(instanceId: string): Promise<QRCodeResponse>
  getPairingCode(instanceId: string, phoneNumber: string): Promise<PairingCodeResponse>
  powerOn(instanceId: string): Promise<void>
  powerOff(instanceId: string): Promise<void>
  disconnect(instanceId: string): Promise<void>

  // Mensagens
  sendTextMessage(instanceId: string, to: string, text: string, replyToId?: string): Promise<SendMessageResult>
  sendMediaMessage(instanceId: string, payload: SendMessagePayload): Promise<SendMessageResult>
  sendTemplateMessage(instanceId: string, to: string, templateName: string, params: Record<string, string>): Promise<SendMessageResult>
  sendReaction(instanceId: string, to: string, messageId: string, emoji: string): Promise<void>
  removeReaction(instanceId: string, to: string, messageId: string): Promise<void>

  // Grupos
  listGroups(instanceId: string): Promise<ProviderGroup[]>
  getGroup(instanceId: string, groupId: string): Promise<ProviderGroup>
  createGroup(instanceId: string, payload: CreateGroupPayload): Promise<ProviderGroup>
  addGroupParticipants(instanceId: string, groupId: string, participants: string[]): Promise<void>
  removeGroupParticipants(instanceId: string, groupId: string, participants: string[]): Promise<void>
  leaveGroup(instanceId: string, groupId: string): Promise<void>

  // Webhooks
  listWebhooks(instanceId: string): Promise<WebhookConfig[]>
  createWebhook(instanceId: string, payload: CreateWebhookPayload): Promise<WebhookConfig>
  deleteWebhook(instanceId: string, webhookId: string): Promise<void>
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean

  // Utilitarios
  verifyNumber(instanceId: string, phoneNumber: string): Promise<boolean>
  formatPhoneNumber(phoneNumber: string): string
}
```

## Selecao de Provider

O provider e selecionado via variavel de ambiente `WHATSAPP_PROVIDER`:

```typescript
// whatsapp.module.ts
{
  provide: 'WHATSAPP_PROVIDER',
  useFactory: (config: ConfigService) => {
    const provider = config.get('WHATSAPP_PROVIDER', 'zapster')
    switch (provider) {
      case 'twilio': return new TwilioProvider(...)
      case 'meta': return new MetaProvider(...)
      default: return new ZapsterProvider(...)
    }
  }
}
```

## WhatsAppService (Facade)

O `WhatsAppService` atua como facade, delegando chamadas ao provider ativo:

```typescript
@Injectable()
export class WhatsAppService {
  constructor(
    @Inject('WHATSAPP_PROVIDER')
    private readonly provider: IWhatsAppProvider
  ) {}

  getActiveProvider(): string {
    return this.provider.providerName
  }

  async sendTextMessage(...) {
    return this.provider.sendTextMessage(...)
  }
}
```

## Configuracao por Provider

### Zapster

```env
WHATSAPP_PROVIDER=zapster
ZAPSTER_API_KEY=zapi_xxxxx
ZAPSTER_API_URL=https://api.zapsterapi.com/v1
ZAPSTER_WEBHOOK_SECRET=seu_secret_hmac
```

### Twilio

```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER_SID=PNxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+5511999999999
TWILIO_WEBHOOK_URL=https://seu-dominio.com/webhooks/whatsapp/twilio
```

### Meta (Facebook)

```env
WHATSAPP_PROVIDER=meta
META_APP_ID=123456789
META_APP_SECRET=xxxxxxxx
META_PHONE_NUMBER_ID=123456789012345
META_ACCESS_TOKEN=EAAxxxxxxxx
META_WEBHOOK_VERIFY_TOKEN=meu_token_verificacao
META_API_VERSION=v18.0
```

## Webhooks

### Eventos Suportados

| Evento | Descricao |
|--------|-----------|
| `message.received` | Nova mensagem recebida |
| `message.sent` | Mensagem enviada |
| `message.delivered` | Mensagem entregue |
| `message.read` | Mensagem lida |
| `message.failed` | Falha no envio |
| `connection.update` | Status da conexao |
| `group.update` | Atualizacao de grupo |

### Validacao de Assinatura

Todos os webhooks validam a assinatura HMAC:

```typescript
validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

## Instancias por Grupo

Cada grupo Houston pode ter uma instancia WhatsApp:

```typescript
// Uma instancia por grupo
const instance = await this.instancesService.findByGrupo(grupoId)

// Criar nova instancia para o grupo
const newInstance = await this.instancesService.create({
  name: 'WhatsApp Grupo XYZ',
  grupoId: 'uuid-do-grupo'
})
```

## Limitacoes por Provider

### Zapster
- Suporte completo a todas as operacoes
- Conexao via QR Code ou Pairing Code
- Grupos nativos do WhatsApp

### Twilio
- Nao suporta grupos (API Business)
- Nao suporta QR Code (numero pre-configurado)
- Requer numero verificado no Twilio
- Templates obrigatorios apos 24h

### Meta
- Requer aprovacao do Facebook Business
- Templates obrigatorios apos 24h
- Grupos via API especifica
- Webhooks com verificacao

## Tratamento de Erros

```typescript
class WhatsAppProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly provider?: WhatsAppProvider
  ) {
    super(message)
  }
}

// Uso
throw new WhatsAppProviderError(
  'Instancia nao encontrada',
  'INSTANCE_NOT_FOUND',
  404,
  WhatsAppProvider.ZAPSTER
)
```

## Boas Praticas

1. **Rate Limiting**: Respeitar limites de cada provider
2. **Retry com Backoff**: Implementar retry em falhas temporarias
3. **Idempotencia**: Usar messageId para evitar duplicatas
4. **Logs**: Registrar todas as interacoes com providers
5. **Fallback**: Considerar fallback para outro provider em caso de falha

## Testes

```typescript
describe('ZapsterProvider', () => {
  it('should send text message', async () => {
    const result = await provider.sendTextMessage(
      'instance-id',
      '+5511999999999',
      'Hello World'
    )
    expect(result.messageId).toBeDefined()
    expect(result.status).toBe('sent')
  })
})
```

## Monitoramento

Metricas recomendadas:
- Taxa de sucesso de envio por provider
- Latencia media de resposta
- Numero de webhooks processados
- Taxa de falha por tipo de erro
