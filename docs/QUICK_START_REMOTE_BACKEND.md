# 🚀 Quick Start: Frontend Local + Backend Remoto

Guia rápido para rodar apenas o frontend localmente, usando o backend na Render.

## ⚡ Configuração Rápida (5 minutos)

### 1️⃣ **Configure o Frontend**

Crie o arquivo `.env.local` em `apps/web/`:

```bash
cd apps/web
cp .env.local.example .env.local
```

Edite `.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://houston-api.onrender.com
```

### 2️⃣ **Rode o Frontend**

```bash
# Na raiz do projeto
pnpm install
cd apps/web
pnpm dev
```

### 3️⃣ **Acesse a Aplicação**

Abra [http://localhost:3000](http://localhost:3000)

✅ **Pronto!** O frontend está rodando localmente e se comunicando com o backend na Render.

---

## 🔧 Vantagens

✅ **Economia de Recursos:** Sua máquina roda apenas o Next.js
✅ **Mais Rápido:** Não precisa compilar o backend
✅ **Dados Reais:** Testa com o banco de produção
✅ **Sem Docker:** Não precisa rodar PostgreSQL local

---

## 📊 Comparação

| Configuração | RAM | CPU | Velocidade Inicial |
|--------------|-----|-----|--------------------|
| **Backend + Frontend Local** | ~2GB | 60-80% | 30-40s |
| **Apenas Frontend Local** | ~500MB | 20-30% | 5-10s |

---

## 🐛 Problemas Comuns

### ❌ Erro: "Failed to fetch"

**Causa:** Backend na Render ainda não foi deployado ou está hibernando (Free Tier)

**Solução:**
1. Acesse `https://houston-api.onrender.com/api/health`
2. Aguarde 20-30 segundos (primeira requisição)
3. Tente novamente

### ❌ Erro de CORS

**Causa:** Backend não está aceitando requisições do `localhost:3000`

**Solução:** Verifique se as variáveis de ambiente no Render estão corretas:
```bash
CORS_ORIGIN=http://localhost:3000,https://houston-api.onrender.com
TRUSTED_ORIGINS=http://localhost:3000,https://houston-api.onrender.com
```

### ❌ Cookie não persiste

**Causa:** Cookies cross-domain

**Solução:** O proxy do Next.js já resolve isso! Certifique-se de que está usando:
```typescript
// Correto
fetch('/api/candidaturas')  // ✅

// Errado
fetch('https://houston-api.onrender.com/api/candidaturas')  // ❌
```

---

## 🔄 Voltar para Local

Para voltar a rodar backend local:

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

E rode o backend:
```bash
cd apps/api
pnpm dev
```

---

## 📚 Próximos Passos

- [Deploy completo do backend](./DEPLOY_BACKEND_RENDER.md)
- [Configurar OAuth providers](./OAUTH_SETUP.md)
- [Monitoramento e logs](./MONITORING.md)
