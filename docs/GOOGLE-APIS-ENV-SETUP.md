# Google APIs — Vercel Environment Variables Setup

> **Data**: 15/04/2026  
> **Projeto GCP**: 1001654113817  
> **Status**: Pendente de configuração

## Variáveis Faltantes no Vercel

### 1. Corrigir typo
- [ ] **GBC_SITE_URL** → renomear para **GSC_SITE_URL**
  - Valor: URL da propriedade no Google Search Console (ex: `https://fernandamangia.com.br`)

### 2. Adicionar Google Business Profile
- [ ] **GMB_ACCOUNT_ID**
  - Formato: `accounts/XXXXXXXXXXXXXX`
  - Como obter:
    1. Google Cloud Console → APIs → Business Profile Performance API
    2. Execute: `curl -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" https://businessprofileperformance.googleapis.com/v1/accounts`
    3. Copie o valor do campo `name`

- [ ] **GMB_LOCATION_ID**
  - Formato: `locations/YYYYYYYYYYYYYY`
  - Como obter:
    1. Abra Google Business Profile do site
    2. URL contém `/g/YYYYYYYYYYYYYY/`
    3. Ou via API para listar locations

### 3. Reuso de fallback (Opcional – já existem no Vercel)
- ✅ **GA4_CLIENT_EMAIL** (usado como fallback para GSC e GMB)
- ✅ **GA4_PRIVATE_KEY** (usado como fallback para GSC e GMB)

---

## Checklist — Implementação

### Passo 1: Validar Conta de Serviço
- [ ] Google Cloud Console → IAM e administração → Contas de serviço
- [ ] Localize a service account usada (confirme email em GA4_CLIENT_EMAIL)
- [ ] Chaves → Crie/baixe JSON se necessário

### Passo 2: Adicionar Permissões

#### Google Search Console
1. [ ] Acesse Google Search Console (search.google.com/search-console)
2. [ ] Vá para Configurações → Usuários e permissões
3. [ ] Clique "Adicionar usuário"
4. [ ] Cole o `client_email` da service account
5. [ ] Selecione "Proprietário" (permissão total)
6. [ ] Confirme

#### Google Business Profile
1. [ ] Acesse Google Business Profile
2. [ ] Configurações → Usuários e acesso
3. [ ] Adicione o email da service account como "Gerente" ou "Proprietário"
4. [ ] Confirme acesso

### Passo 3: Configurar Variáveis no Vercel
1. [ ] Acesse Vercel → Projeto → Settings → Environment Variables
2. [ ] Localize **GBC_SITE_URL** → renomeie para **GSC_SITE_URL** (ou delete e recrie)
   - Valor: `https://fernandamangia.com.br` (sem trailing slash)
3. [ ] Clique "Add Environment Variable"
   - Nome: `GMB_ACCOUNT_ID`
   - Valor: `accounts/XXXXXXXXXXXXXX`
   - Ambientes: Production (e Preview se desejar testar)
4. [ ] Clique "Add Environment Variable"
   - Nome: `GMB_LOCATION_ID`
   - Valor: `locations/YYYYYYYYYYYYYY`
   - Ambientes: Production (e Preview se desejar testar)

### Passo 4: Verificar Habilitação de APIs no GCP
- [ ] Google Cloud Console → APIs e serviços → Biblioteca
- [ ] Pesquise e habilite:
  - [ ] **Google Search Console API**
  - [ ] **Business Profile Performance API**
  - [ ] **Business Profile Business Information API**
- [ ] Aguarde 5-10 minutos para propagação

### Passo 5: Redeploy e Teste
1. [ ] Vercel → Deployments → Redeploy current
   - Ou aguarde novo push para main que acionará build automaticamente
2. [ ] Teste os endpoints (quando deploy terminar):
   ```bash
   # Test Search Console
   curl https://fernandamangia.com.br/api/search-console
   
   # Test GMB
   curl https://fernandamangia.com.br/api/gmb
   ```
3. [ ] Esperado: HTTP 200 com dados reais (não erro de API desabilitada)
4. [ ] Dashboard → aba "Google" deve exibir banner verde ✅

---

## Troubleshooting

| Erro | Causa | Solução |
|------|-------|--------|
| `API has not been used in project` | API não habilitada no GCP | Habilite no Google Cloud Console |
| `Permission denied / Forbidden` | Service account sem acesso | Adicione em Search Console + GMB |
| `Not found` | ID incorreto | Confirme GSC_SITE_URL, GMB_ACCOUNT_ID, GMB_LOCATION_ID |
| `Could not deserialize key data` | Private key mal formatada | Verifique quebras de linha em GA4_PRIVATE_KEY |

---

## Referências de Código

- Backend Search Console: [api/search-console.ts](../api/search-console.ts)
- Backend GMB: [api/gmb.ts](../api/gmb.ts)
- Frontend Panel: [components/SearchConsoleGMBPanel.tsx](../components/SearchConsoleGMBPanel.tsx)
