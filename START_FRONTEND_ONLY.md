# 🚀 Rodar Apenas Frontend (Backend na Render)

## ⚡ Início Rápido

```bash
# 1. Configure variável de ambiente
echo "NEXT_PUBLIC_API_URL=https://houston-api.onrender.com" > apps/web/.env.local

# 2. Rode o frontend
cd apps/web
pnpm dev
```

**Acesse:** http://localhost:3000

---

## 📌 Por Que Isso?

✅ **Economia de Recursos**
- Frontend: ~500MB RAM vs ~2GB com tudo local
- CPU: 20-30% vs 60-80%

✅ **Desenvolvimento Mais Rápido**
- Não precisa compilar backend
- Não precisa rodar PostgreSQL local
- Não precisa Docker

✅ **Dados Reais**
- Testa com banco de produção
- Vê dados atualizados

---

## 🔧 Configuração Completa

Ver documentação completa:
- [Quick Start](./docs/QUICK_START_REMOTE_BACKEND.md)
- [Deploy Backend](./docs/DEPLOY_BACKEND_RENDER.md)

---

## 🐛 Problemas?

### Backend lento na primeira requisição?

**Normal!** Render Free Tier hiberna após 15 minutos.
- Primeira requisição: 20-30 segundos
- Próximas: < 1 segundo

### Erro de CORS?

Verifique se `CORS_ORIGIN` e `TRUSTED_ORIGINS` estão configurados no Render:
```
CORS_ORIGIN=http://localhost:3000,https://houston-api.onrender.com
TRUSTED_ORIGINS=http://localhost:3000,https://houston-api.onrender.com
```

---

**Dúvidas?** Veja a [documentação completa](./docs/QUICK_START_REMOTE_BACKEND.md)
