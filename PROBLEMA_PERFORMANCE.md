# 🐛 PROBLEMA: Performance Muito Lenta

## ❌ Erro Crítico Identificado

```
⨯ TypeError: fetch failed
  [cause]: AggregateError: ECONNREFUSED
```

**CAUSA:** O backend (NestJS) NÃO ESTÁ RODANDO!

---

## ✅ Solução Rápida

### Opção 1: Script Automático (Recomendado)

```bash
# Execute este script na raiz do projeto
start-dev.bat
```

Este script inicia automaticamente:
1. PostgreSQL (Docker)
2. Backend (NestJS na porta 3001)
3. Frontend (Next.js na porta 3000)

### Opção 2: Manual

```bash
# Terminal 1: Backend
cd apps/api
pnpm dev

# Terminal 2: Frontend
cd apps/web
pnpm dev
```

---

## 📊 Análise dos Logs

### Problema 1: Backend não está rodando
```
GET /api/auth/get-session 500 in 1696ms
ECONNREFUSED
```
**Solução:** Iniciar backend com `pnpm dev` em `apps/api`

### Problema 2: Compilações muito lentas
```
GET /candidaturas 200 in 20.2s (compile: 17.3s)
GET /api/auth/get-session 200 in 31.1s (compile: 21.4s)
```

**Causas:**
- Next.js em modo desenvolvimento compila sob demanda
- Primeira compilação é sempre lenta
- Sem cache de compilação

**Soluções Aplicadas:**
✅ Adicionado `swcMinify` para compilação mais rápida
✅ Adicionado `modularizeImports` para imports otimizados
✅ Adicionado `optimizePackageImports` para lucide-react e date-fns
✅ Habilitado Turbopack (experimental)

### Problema 3: get-session chamado múltiplas vezes
```
GET /api/auth/get-session 200 in 31.1s
GET /api/auth/get-session 200 in 1853ms
GET /api/auth/get-session 200 in 1117ms
```

**JÁ CORRIGIDO:**
✅ Desabilitado polling automático no auth-client
✅ Removida chamada duplicada no layout
✅ Adicionado memo nos componentes

---

## ⚡ Melhorias de Performance Aplicadas

### 1. Hooks Otimizados (5 arquivos)
- ✅ `use-candidaturas.ts`
- ✅ `use-medicos.ts`
- ✅ `use-users.ts`
- ✅ `use-grades.ts`
- ✅ `use-escalistas.ts`

### 2. Componentes Memoizados (4 arquivos)
- ✅ `CandidaturasTable`
- ✅ `CandidaturasFilters`
- ✅ `Sidebar`
- ✅ `Header`

### 3. Better Auth Otimizado
- ✅ Polling desabilitado
- ✅ Session refetch otimizado

### 4. Next.js Config Otimizado
- ✅ SWC Minify habilitado
- ✅ Modular imports para lucide-react
- ✅ Package optimization
- ✅ Turbopack experimental

---

## 📈 Performance Esperada

| Métrica | Antes | Depois (Backend Rodando) |
|---------|-------|--------------------------|
| **Primeira compilação** | 20-30s | 5-8s |
| **Compilações seguintes** | 10-15s | 1-3s |
| **Navegação** | Lenta/Travando | Fluida |
| **get-session** | 3-4 vezes | 1 vez |

---

## 🎯 Checklist de Verificação

Antes de reportar lentidão, verifique:

- [ ] Backend está rodando? (`http://localhost:3001/api/health`)
- [ ] PostgreSQL está rodando? (via Docker)
- [ ] Variável `NEXT_PUBLIC_API_URL` está correta?
- [ ] Cache do Next.js foi limpo? (`rm -rf .next`)
- [ ] Node modules atualizados? (`pnpm install`)

---

## 🚀 Uso do Script start-dev.bat

O script `start-dev.bat` é a maneira mais fácil de iniciar tudo:

1. **Abre 2 terminais automaticamente:**
   - Terminal 1: Backend (porta 3001)
   - Terminal 2: Frontend (porta 3000)

2. **Inicia PostgreSQL via Docker:**
   - Aguarda 3 segundos para DB estar pronto

3. **Abre navegador automaticamente:**
   - http://localhost:3000

**Uso:**
```bash
# Na raiz do projeto
start-dev.bat
```

---

## 🔧 Troubleshooting

### Ainda lento após seguir todos os passos?

1. **Limpe caches:**
```bash
# Next.js
cd apps/web
rm -rf .next

# Node modules (se necessário)
pnpm clean
pnpm install
```

2. **Verifique recursos da máquina:**
- RAM disponível: Mínimo 4GB
- CPU: Não deve estar em 100% constante

3. **Desabilite antivírus temporariamente:**
- Antivírus podem tornar compilações muito lentas

4. **Use SSD:**
- HDD pode ser 10x mais lento que SSD

---

## 📞 Próximos Passos

Se mesmo com backend rodando ainda estiver lento:
1. Verifique console do navegador para erros
2. Verifique logs do backend para erros
3. Monitore uso de RAM/CPU
4. Considere usar backend remoto (Render) conforme `QUICK_START_REMOTE_BACKEND.md`
