# 🚀 Deploy do Backend na Render

Este guia explica como fazer deploy do backend (NestJS) na Render e rodar apenas o frontend localmente.

## 📋 Pré-requisitos

- Conta no [Render](https://render.com)
- Repositório no GitHub
- PostgreSQL na Render (será criado automaticamente)

## 🛠️ Passo a Passo

### 1️⃣ **Configurar Variáveis de Ambiente na Render**

Após criar o serviço, adicione as seguintes variáveis:

```bash
# Database (será preenchido automaticamente pelo Render)
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=seu-secret-aqui-gerado-automaticamente
BETTER_AUTH_URL=https://houston-api.onrender.com

# OAuth (se estiver usando)
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
MICROSOFT_CLIENT_ID=seu-microsoft-client-id
MICROSOFT_CLIENT_SECRET=seu-microsoft-client-secret

# Email (se estiver usando Resend)
RESEND_API_KEY=seu-resend-api-key
EMAIL_FROM=noreply@seudominio.com

# Redis (se estiver usando Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Outras configs
NODE_ENV=production
PORT=3001
```

### 2️⃣ **Deploy na Render**

#### Opção A: Via Dashboard

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em "New" → "Blueprint"
3. Conecte seu repositório GitHub
4. Render detectará o `render.yaml` automaticamente
5. Clique em "Apply"

#### Opção B: Via render.yaml (Recomendado)

O arquivo `render.yaml` já está configurado na raiz do projeto. Basta:

1. Fazer push do código para o GitHub
2. Conectar o repositório no Render
3. O Render criará automaticamente:
   - PostgreSQL database
   - Web service (API)

### 3️⃣ **Executar Migrations**

Após o deploy, execute as migrations:

1. No Render Dashboard → Seu serviço → Shell
2. Execute:
```bash
cd apps/api
pnpm prisma migrate deploy
pnpm prisma db seed  # Opcional: seed inicial
```

### 4️⃣ **Configurar Frontend Local**

Edite o arquivo `.env.local` do frontend:

```bash
# apps/web/.env.local

# Apontar para o backend na Render
NEXT_PUBLIC_API_URL=https://houston-api.onrender.com

# Outras configs locais permanecem iguais
```

### 5️⃣ **Atualizar Configuração do Better Auth**

Edite `apps/api/src/auth.config.ts` para aceitar o frontend local:

```typescript
export const auth = betterAuth({
  // ... outras configs

  trustedOrigins: [
    'http://localhost:3000',           // Frontend local
    'https://houston-api.onrender.com', // Backend produção
    'https://seu-dominio-frontend.com', // Frontend produção (quando fizer deploy)
  ],
})
```

**IMPORTANTE:** Faça commit e push dessa mudança para o Render atualizar.

## 🔧 Configuração de CORS

Certifique-se de que o CORS está configurado no backend para aceitar o frontend local:

```typescript
// apps/api/src/main.ts
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://seu-dominio-frontend.com',
  ],
  credentials: true,
});
```

## ⚡ Rodando Frontend Local

Com o backend na Render, rode apenas o frontend localmente:

```bash
# Na raiz do projeto
cd apps/web
pnpm dev
```

Isso economiza recursos da sua máquina! 🎉

## 🔍 Verificar se Está Funcionando

1. Backend: Acesse `https://houston-api.onrender.com/api/health`
2. Frontend: Acesse `http://localhost:3000`
3. Teste o login

## 🐛 Troubleshooting

### ❌ Erro de CORS

**Problema:** Frontend não consegue se comunicar com backend

**Solução:**
- Verifique `trustedOrigins` em `auth.config.ts`
- Verifique CORS em `main.ts`
- Certifique-se de que `credentials: true` está configurado

### ❌ Erro de Cookie

**Problema:** Sessão não persiste, cookie não é salvo

**Causa:** Cookies cross-domain não funcionam com diferentes domínios

**Soluções:**
1. **Temporária (desenvolvimento):** Use o proxy do Next.js (já configurado)
2. **Produção:** Deploy do frontend no mesmo domínio ou subdomínio

### ❌ Database Connection Error

**Problema:** Backend não conecta ao banco

**Solução:**
- Verifique se `DATABASE_URL` está correta
- No Render, vá em "Connect" → "Internal Database URL"
- Use a URL interna para melhor performance

### ❌ Cold Start Lento

**Problema:** Primeira requisição demora muito (Render Free Tier)

**Causa:** Render Free Tier hiberna após 15 minutos de inatividade

**Solução:**
- Upgrade para Starter Plan ($7/mês)
- Ou implemente um "keep-alive ping"

## 📊 Monitoramento

No Render Dashboard você pode ver:
- Logs em tempo real
- Métricas de CPU/Memória
- Deploy history
- Shell interativo

## 💡 Dicas de Performance

1. **Use Redis/Upstash** para cache
2. **Habilite compressão** no NestJS
3. **Configure logs** adequadamente (não muito verbose em produção)
4. **Use variáveis de ambiente** para todas as configs sensíveis

## 🔐 Segurança

✅ **NUNCA** commite:
- `.env` files
- Secrets ou API keys
- DATABASE_URL

✅ **SEMPRE** use:
- Variáveis de ambiente do Render
- HTTPS em produção
- Secrets gerados automaticamente

## 🎯 Próximos Passos

Quando quiser fazer deploy do frontend também:

1. Crie um novo serviço na Render (ou use Vercel/Netlify)
2. Configure `NEXT_PUBLIC_API_URL` para apontar para o backend
3. Atualize `trustedOrigins` no backend
4. Configure domínio customizado (opcional)

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs no Render Dashboard
2. Teste localmente com as mesmas env vars
3. Verifique a documentação do [Render](https://render.com/docs)
