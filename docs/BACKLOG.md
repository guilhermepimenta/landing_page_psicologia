# Backlog — Dashboard Marketing Fernanda Psicologia

> Última atualização: 13/04/2026
> Legenda: 🔴 Não iniciado · 🟡 Em progresso · ✅ Concluído

---

## Fase 1 — Funcionalidades Core (sem novas APIs)
> Base do dia a dia operacional — tudo usa Firestore já configurado

| Status | ID | Funcionalidade | Descrição |
|---|---|---|---|
| ✅ | 1.1 | **Formulário de Posts** | Criar/editar post com título, canal, conteúdo, data de publicação, status (rascunho/agendado/publicado) |
| ✅ | 1.2 | **Lista de Posts** | Tabela com filtro por canal e status, ações de editar/excluir/publicar |
| ✅ | 1.3 | **Calendário de Conteúdo** | Visualização mensal dos posts agendados, clique para editar |
| ✅ | 1.4 | **Banco de Ideias UI** | Listar ideias por categoria, marcar como usada, criar nova ideia manualmente |
| ✅ | 1.5 | **Configurações do Perfil** | Editar nome, especialidade, CRP, foto — dados usados nos posts gerados por IA |

---

## Fase 2 — Google Ecosystem (mesma service account)
> Baixo esforço — credenciais da service account `ga4-dashboard` já existem

| Status | ID | Funcionalidade | Descrição |
|---|---|---|---|
| ✅ | 2.1 | **Google Search Console** | Cliques orgânicos, impressões, posição média, páginas mais visitadas |
| ✅ | 2.2 | **Google My Business API** | Visualizações do perfil, buscas, ligações, solicitações de rota |
| ✅ | 2.3 | **Painel Unificado** | Analytics com GA4 + Search Console + GMB lado a lado |

---

## Fase 3 — Instagram Integration
> Requer Facebook App — processo de aprovação pode levar dias

| Status | ID | Funcionalidade | Descrição |
|---|---|---|---|
| ✅ | 3.1 | **Instagram Graph API** | Seguidores, alcance, impressões, engajamento por post |
| ✅ | 3.2 | **Top Posts** | Ranking dos posts com melhor desempenho |
| ✅ | 3.3 | **Melhor Horário** | Análise de quando o público está mais ativo |

---

## Fase 4 — Automações e IA Avançada
> Multiplicadores de produtividade

| Status | ID | Funcionalidade | Descrição |
|---|---|---|---|
| ✅ | 4.1 | **Agendamento Automático** | Post criado no dashboard → publicado automaticamente no horário definido |
| 🔴 | 4.2 | **Sugestão Inteligente por IA** | IA analisa GA4 + Instagram e sugere o próximo post ideal |
| ✅ | 4.3 | **Relatório Semanal Automático** | Email toda segunda com resumo de desempenho da semana via Resend |
| ✅ | 4.4 | **Alertas Proativos** | Notificação se engajamento cair >20% ou se ficou >5 dias sem post |

---

## Já Implementado ✅

| ID | Funcionalidade |
|---|---|
| — | Login com Firebase Auth |
| — | Dashboard com sidebar fixa |
| — | Visão Geral com métricas e resumo semanal |
| — | Analytics com Recharts (BarChart, AreaChart, PieChart) |
| — | Integração GA4 Data API via Vercel Function |
| — | Geração de conteúdo com IA (Gemini 2.0 Flash) |
| — | Modal de geração de conteúdo (canal, tom, tópico) |
| — | Banco de Ideias (serviço Firestore) |
| — | Serviço de Posts (serviço Firestore) |
| 1.1 | Formulário de Posts (criar/editar com modal) |
| 1.2 | Lista de Posts com filtros por canal/status + ações publicar/editar/excluir |
| 1.3 | Calendário de Conteúdo (visualização mensal, clique para editar) |
| 1.4 | Banco de Ideias UI (listar, filtrar, criar, marcar como usada, excluir) |
| 1.5 | Configurações do Perfil (nome, especialidade, CRP, foto, bio) |
| 2.1 | Google Search Console — API Vercel Function + serviço frontend + painel com cliques, impressões, CTR, posição, top páginas e queries |
| 2.2 | Google My Business API — API Vercel Function + serviço frontend + painel com visualizações, ligações, rotas, cliques no site |
| 2.3 | Painel Unificado Google — aba "Google" no Dashboard com sub-tabs Search Console e GMB |
| 3.1 | Instagram Graph API — endpoint de métricas + conta conectada em produção |
| 3.2 | Top Posts — ranking por engajamento na aba Instagram |
| 3.3 | Melhor Horário — análise de engajamento por hora na aba Instagram |
| 4.1 | Agendamento Automático — cron de publicação + trigger manual + indicador visual no calendário |
| 4.3 | Relatório Semanal Automático — cron semanal + envio por Resend + logs em `weekly_reports_logs` |
| 4.4 | Alertas Proativos — engine backend + collection `alerts` + badge na aba Analytics |

---

## Dependências Técnicas por Fase

### Fase 1
- Firestore já configurado ✅
- Nenhuma nova API necessária

### Fase 2
- **Search Console:** habilitar "Google Search Console API" no Google Cloud Console (projeto `fernanda-psicologia`) — service account já tem acesso
- **GMB:** habilitar "Google My Business API" no Google Cloud Console + adicionar service account como gerente da localização

### Fase 3
- Criar **Facebook App** em developers.facebook.com
- Solicitar permissões: `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`
- Passar por revisão da Meta (pode levar 3-7 dias)
- Obter `INSTAGRAM_ACCESS_TOKEN` e `INSTAGRAM_BUSINESS_ACCOUNT_ID`

### Fase 4
- **Agendamento:** Vercel Cron Jobs (já disponível no plano Hobby)
- **Relatório por email:** SendGrid ou Resend API (gratuito até 100 emails/dia)
- **Alertas:** Vercel Cron Job diário + lógica de comparação no Firestore
