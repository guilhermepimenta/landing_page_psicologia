# Checklist de Validação Técnica — Sprint 5

> **Status Final**: ✅ **Validado** — itens 2, 3, 4 e 5 concluídos em produção

---

## Item 2: Fazer Deploy da Development no Vercel ✅ **CONCLUÍDO**

- ✅ Branch `development` com Sprint 5 mergeada
- ✅ Deploy em produção: https://www.psicologafernandamangia.com.br
- ✅ Cron configurado em [vercel.json](./vercel.json) — **`schedule: "0 9 * * *"`** (diário a 9h)
  - ⚠️ **Limitação Hobby**: Plano gratuito bloqueia cron de 15 em 15 min; ajustado para diário como workaround temporário
  - 💡 **Upgrade recomendado**: Pro plan para `schedule: "*/15 * * * *"` real
- ✅ Routes `/api/cron/publish-scheduled` e `/api/cron/trigger` estão publicadas

---

## Item 3: Testar Trigger Manual — Modo Dry-Run ✅ **CONCLUÍDO**

### Chamada de Teste Executada:
```bash
POST https://www.psicologafernandamangia.com.br/api/cron/trigger
Authorization: Bearer sprint5-secret-2026
Content-Type: application/json
Body: { "dryRun": true }
```

### Resultado Final:
Execução bem-sucedida:

```json
{
  "success": true,
  "triggeredBy": "manual",
  "dryRun": true,
  "scanned": 0,
  "published": 0,
  "errors": 0,
  "skipped": 0
}
```

### Diagnóstico final:
- ✅ Variáveis Firebase Admin configuradas
- ✅ `FUNCTION_INVOCATION_FAILED` corrigido (fix de imports ESM)
- ✅ Índice Firestore composto ativo (`posts.status ASC` + `posts.date ASC`)

---

## Item 4: Testar Execução Real (sem dry-run) ✅ **CONCLUÍDO**

Execução bem-sucedida:

```json
{
  "success": true,
  "triggeredBy": "manual",
  "dryRun": false,
  "scanned": 0,
  "published": 0,
  "errors": 0,
  "skipped": 0
}
```

---

## Item 5: Auditar Logs de Execução ✅ **CONCLUÍDO**

Validação da coleção `cron_logs`:

```json
{
  "count": 1,
  "logs": [
    {
      "success": true,
      "triggeredBy": "manual",
      "dryRun": false,
      "scanned": 0,
      "published": 0,
      "errors": 0,
      "skipped": 0,
      "createdAt": "2026-04-10T13:27:19.856Z"
    }
  ]
}
```

---

## Próximos Passos

### 1️⃣ Criar/ajustar pelo menos 1 post com `status: "scheduled"` e `date <= now`

Sem posts aptos, o pipeline executa corretamente, porém sem publicar conteúdo.

### 2️⃣ Reexecutar `dryRun: false` para validar publicação real no Instagram

Com post apto, o esperado é `published > 0` e preenchimento de `instagramPostId`/`instagramPermalink`.

---

## Código Testado e Pronto

Todos os arquivos implementados já estão em produção:

| Arquivo | Status | Link |
|---------|--------|------|
| [api/cron/publish-scheduled.ts](./api/cron/publish-scheduled.ts) | ✅ Publicado | Vercel Cron automático |
| [api/cron/trigger.ts](./api/cron/trigger.ts) | ✅ Publicado | POST `/api/cron/trigger` |
| [api/lib/cronPublisher.ts](./api/lib/cronPublisher.ts) | ✅ Publicado | Núcleo com logs detalhados |
| [api/lib/firebaseAdmin.ts](./api/lib/firebaseAdmin.ts) | ✅ Publicado | Singleton Firebase Admin |
| [components/ContentCalendar.tsx](./components/ContentCalendar.tsx) | ✅ Publicado | Indicador ⏰ no calendário |
| [vercel.json](./vercel.json) | ✅ Publicado | Cron config |

---

## Resumo

- **Deploy**: ✅ Sucesso
- **Erro de invocação**: ✅ Resolvido (fix ESM)
- **Firebase Admin envs**: ✅ Configuradas
- **Índice Firestore**: ✅ Ativado
- **Checklist itens 2-5**: ✅ Concluído
- **Próximo Sprint**: Sprint 6 (Métricas Instagram)

