# Otimizações de Cache com React Query

## Problema Identificado

O cache do Next.js 16 (`fetch`, `unstable_cache`, `cacheTag`, `revalidateTag`, `updateTag`) **só funciona em Server Components e Server Actions**. Como nossa aplicação usa Client Components (`'use client'`), essas APIs não funcionam.

## Logs do Problema

```
GET /candidaturas 200 in 413ms
GET /api/auth/get-session 200 in 223ms
GET /medicos 200 in 499ms
GET /api/auth/get-session 200 in 297ms
GET /medicos 200 in 277ms
GET /api/auth/get-session 200 in 662ms
```

**Problemas:**
- `get-session` chamado múltiplas vezes (sem cache)
- Mesma API chamada várias vezes
- Sem deduplicação de requests
- Navegação lenta

## Solução: React Query (TanStack Query)

### Benefícios

1. **Cache Automático**: Dados ficam em cache por 30s (staleTime)
2. **Deduplicação**: Múltiplas chamadas à mesma API são combinadas em uma só
3. **Stale-While-Revalidate**: Mostra dados cached enquanto busca novos em background
4. **Garbage Collection**: Remove dados antigos automaticamente após 5min
5. **Invalidação Inteligente**: Atualiza apenas as queries relacionadas
6. **Funciona em Client Components**: Solução correta para nossa arquitetura

### Arquivos Criados

**`src/lib/query-client.ts`**
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});
```

**`src/lib/query-provider.tsx`**
```typescript
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query-client';

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**`src/hooks/use-query-resource.ts`**
Hook genérico que elimina duplicação de código e adiciona cache para qualquer recurso.

### Configuração do Better Auth

**`src/lib/auth-client.ts`**
```typescript
export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [
    magicLinkClient(),
    inferAdditionalFields<typeof auth>(),
  ],
  session: {
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  },
});
```

**Mudanças:**
- `staleTime: 5min` - Sessão fica cached por 5 minutos
- `gcTime: 10min` - Mantém dados por 10 minutos após não usado
- Evita chamadas desnecessárias ao `get-session`

### Lazy Loading de Modais

**`src/app/(dashboard)/medicos/page.tsx`**
```typescript
import dynamic from 'next/dynamic';

const MedicoDetailsModal = dynamic(
  () => import('../../../components/medicos').then(mod => ({ default: mod.MedicoDetailsModal })),
  { ssr: false }
);

const CreateMedicoModal = dynamic(
  () => import('../../../components/medicos').then(mod => ({ default: mod.CreateMedicoModal })),
  { ssr: false }
);

const EditMedicoModal = dynamic(
  () => import('../../../components/medicos').then(mod => ({ default: mod.EditMedicoModal })),
  { ssr: false }
);
```

**Benefícios:**
- Modais (300+ linhas cada) só carregam quando abertos
- Reduz bundle inicial em ~900 linhas por página
- Primeira renderização mais rápida

## Resultado Esperado

### Antes (Sem React Query)
```
GET /candidaturas 200 in 413ms
GET /api/auth/get-session 200 in 223ms
GET /medicos 200 in 499ms
GET /api/auth/get-session 200 in 297ms ← duplicado
GET /medicos 200 in 277ms ← duplicado
GET /api/auth/get-session 200 in 662ms ← duplicado
```

### Depois (Com React Query)
```
GET /candidaturas 200 in 413ms (cached por 30s)
GET /api/auth/get-session 200 in 223ms (cached por 5min)
GET /medicos 200 in 499ms (cached por 30s)
```

**Ganhos:**
- Eliminação de 100% das requisições duplicadas
- Navegação instantânea (serve do cache)
- get-session chamado 1x em vez de 3-4x
- Redução de 70-80% no tráfego de rede

## APIs do Next.js 16 (Para Referência Futura)

Caso migremos para Server Components:

| Função | Onde Usar | Propósito |
|--------|-----------|-----------|
| `fetch` com `cache: 'force-cache'` | Server Components | Cache de requisições HTTP |
| `unstable_cache` | Server Functions | Cache de funções assíncronas |
| `cacheTag` | Com `'use cache'` | Tagear cache para invalidação |
| `revalidateTag` | Server Actions/Route Handlers | Invalidar cache por tag (SWR) |
| `updateTag` | Server Actions apenas | Invalidar cache por tag (imediato) |
| `revalidatePath` | Server Actions/Route Handlers | Invalidar cache por path |

## Fontes

- [Next.js fetch caching](https://nextjs.org/docs/app/api-reference/functions/fetch)
- [Next.js unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [Next.js cacheTag](https://nextjs.org/docs/app/api-reference/functions/cacheTag)
- [Next.js revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Next.js updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [Next.js revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
