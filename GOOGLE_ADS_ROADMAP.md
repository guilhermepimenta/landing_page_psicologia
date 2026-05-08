# Cronograma de Implementação — Google Ads API no Dashboard

---

## Fase 0 — Pré-requisitos (fora do código) `~5–10 dias`

> Burocracia do Google. Pode correr em paralelo com outras tarefas de desenvolvimento.

| Tarefa | Responsável | Observação |
|---|---|---|
| Solicitar **Developer Token** no Google Ads API Center | Guilherme | Aprovação básica: 1–3 dias; nível produção: 5–10 dias |
| Criar **OAuth 2.0 Client ID** no Google Cloud Console | Guilherme | Mesmo projeto GCP que já usa GA4 |
| Anotar o **Customer ID** da conta Google Ads da Fernanda | Guilherme | Formato `XXX-XXX-XXXX`, visível no painel Google Ads |
| Definir redirect URI para o fluxo OAuth | Dev | `https://seu-site.vercel.app/api/google-ads-oauth/callback` |

**Entregável:** credenciais em mãos para iniciar o desenvolvimento.

---

## Fase 1 — Listagem e Gerenciamento de Campanhas `~4–5 dias de dev`

> Menor risco, maior valor imediato. Substitui o proxy via GA4 por dados reais de campanha.

### Backend
- Novo endpoint `api/google-ads-campaigns.ts` usando Google Ads API direta (REST via `googleapis`)
- Listar campanhas com: nome, status, orçamento diário, impressões, cliques, CTR, CPC
- Endpoints `PATCH` para pausar / ativar campanha

### Frontend
- Tabela de campanhas na seção existente de Google Ads do dashboard
- Badges de status (Ativa / Pausada / Removida) com toggle direto
- Filtro por período (reutilizando padrão do ROIPanel)

**Entregável:** Fernanda vê e gerencia campanhas existentes sem sair do dashboard.

---

## Fase 2 — Autenticação OAuth com a Conta Google Ads `~3 dias de dev`

> Pré-requisito para criação. OAuth é necessário porque a API escreve dados na conta — service account não tem permissão de escrita no Google Ads.

### Backend
- Endpoint `api/google-ads-oauth/auth.ts` — gera URL de autorização
- Endpoint `api/google-ads-oauth/callback.ts` — recebe código, troca por tokens, salva no Firebase
- Refresh automático de token (expira em 1h)

### Frontend
- Botão "Conectar conta Google Ads" nas configurações do dashboard
- Indicador de conexão ativa com data de expiração
- Fluxo de re-autorização quando token expirar

**Entregável:** conta Google Ads da Fernanda conectada de forma segura e persistente.

---

## Fase 3 — Criação de Campanhas (Fluxo Simplificado) `~8–10 dias de dev`

> Núcleo do projeto. Formulário multi-step com template pré-configurado para psicologia.

### Backend — novos endpoints

```
POST   /api/google-ads-campaigns         → cria campanha + grupo de anúncios + anúncio
POST   /api/google-ads-campaigns/draft   → salva rascunho no Firebase
GET    /api/google-ads-keywords/suggest  → sugestões de palavras-chave por tema
```

### Frontend — wizard em 4 etapas

| Etapa | Campos |
|---|---|
| 1. Campanha | Nome, objetivo (leads / tráfego), orçamento diário, data início/fim |
| 2. Segmentação | Cidade(s), raio em km, idioma, horário de exibição |
| 3. Anúncios | 3 headlines + 2 descriptions (responsive search ad), URL final, extensões |
| 4. Palavras-chave | Lista editável com match type, sugestões automáticas por especialidade |

### Template pré-carregado para psicologia
- **Geo:** São Paulo + 30 km (configurável)
- **Keywords sugeridas:** "psicóloga SP", "terapia cognitiva comportamental", "consulta psicológica"
- **Headlines template** baseados na bio da Fernanda

**Entregável:** Fernanda cria uma campanha completa em menos de 10 minutos, sem abrir o Google Ads.

---

## Fase 4 — Integração com ROI e Analytics `~3–4 dias de dev`

> Fecha o ciclo: campanhas criadas aqui aparecem automaticamente nos painéis existentes.

- **ROIPanel:** gasto segmentado por campanha (não só total da conta)
- **AnalyticsPanel:** cliques e conversões por campanha
- **CampaignFunnel:** origem dos leads rastreada até a campanha específica
- **Alertas:** notificação automática quando orçamento diário atingir 90% do limite

**Entregável:** visão unificada de investimento → resultado por campanha.

---

## Fase 5 — IA na Criação de Campanhas `~4–5 dias de dev`

> Diferencial competitivo. Usa o Gemini (já integrado no projeto) para tornar a criação trivial.

- **Gerador de anúncios:** Fernanda descreve o objetivo em linguagem natural → Gemini gera headlines e descriptions otimizadas para o nicho
- **Sugestão de palavras-chave inteligente:** baseada na especialidade (neuropsicologia, TDAH, ansiedade) + localização
- **Estimativa de performance:** alcance estimado e CPC médio antes de publicar
- **Score do anúncio:** avalia se o anúncio atende às boas práticas do Google (diversidade de headlines, keyword insertion)

**Entregável:** criar uma campanha profissional vira uma tarefa de 3 minutos.

---

## Visão Geral do Cronograma

```
Semana 1–2  │ [Fase 0] Aprovação Developer Token + OAuth credentials
            │ [Fase 1] Listagem de campanhas existentes  ← pode iniciar agora
Semana 3    │ [Fase 2] OAuth flow seguro
Semana 4–5  │ [Fase 3] Wizard de criação de campanhas
Semana 6    │ [Fase 4] Integração ROI + Analytics
Semana 7    │ [Fase 5] IA na criação
```

**Total estimado:** 5–7 semanas de desenvolvimento, correndo em paralelo com a aprovação do Developer Token.

---

## Dependências Críticas

```
Fase 0 (credenciais)
    └── Fase 1 (listagem)     ← independente, pode iniciar sem OAuth
    └── Fase 2 (OAuth)
            └── Fase 3 (criação)
                    └── Fase 4 (integração ROI)
                            └── Fase 5 (IA)
```

> A Fase 1 pode ser desenvolvida imediatamente enquanto aguarda a aprovação do Developer Token,
> pois usa as credenciais GA4 já existentes como ponto de partida.
