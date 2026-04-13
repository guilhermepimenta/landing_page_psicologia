# Plano de Ação — Instagram Completo no Dashboard

> **Objetivo:** Fernanda faz TUDO pelo Dashboard web — da ideia ao post publicado no Instagram.
> **Dashboard:** O existente em `components/Dashboard.tsx` (rota `/dashboard`), já acessível via landing page.
> **Escopo:** Adicionar funcionalidades ao dashboard já construído — NÃO é um sistema novo.
> **Criado em:** 27/03/2026
> **Legenda:** ✅ Concluído · 🟡 Em progresso · 🔴 Não iniciado

---

## Visão Geral do Fluxo

```
┌─────────────────────── DASHBOARD (tudo aqui dentro) ───────────────────────┐
│                                                                             │
│  1. IDEIA          2. COPY           3. VISUAL         4. REVISÃO          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐          │
│  │ Banco de │────▶│ IA gera  │────▶│ IA gera  │────▶│ Preview  │          │
│  │ Ideias   │     │ legenda  │     │ imagem   │     │ completo │          │
│  │ 💡       │     │ ✍️ Gemini│     │ 🎨       │     │ 👁️       │          │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘          │
│       ✅               ✅               🔴               🔴               │
│                                                                             │
│  5. AGENDAMENTO    6. PUBLICAÇÃO    7. MÉTRICAS                            │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                           │
│  │ Calendário│────▶│ Publica  │────▶│ Engajam. │                           │
│  │ 📅       │     │ no Insta │     │ Alcance  │                           │
│  │          │     │ 📱 API   │     │ 📊       │                           │
│  └──────────┘     └──────────┘     └──────────┘                           │
│       ✅               🔴               🔴                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Jornada da Fernanda (passo a passo)

```
1. 💡 Abre "Banco de Ideias" → escolhe tema "TDAH em adultos"
                    ↓
2. ✨ Clica "Gerar Conteúdo" → Gemini cria a legenda
                    ↓
3. 🎨 Clica "Gerar Imagem" → IA cria visual do carrossel
   OU clica "Upload" → sobe imagem do Canva/celular
                    ↓
4. 👁️ Vê o "Preview do Instagram" → como vai ficar no feed
                    ↓
5. ✏️ Edita legenda/imagem se quiser
                    ↓
6. 📅 Escolhe data/hora → "Agendar" OU "Publicar Agora"
                    ↓
7. 📱 Post vai para o Instagram automaticamente
                    ↓
8. 📊 Métricas aparecem no painel Analytics
```

---

## Inventário — O que já existe

| Recurso | Status | Arquivo |
|---|---|---|
| Firebase Auth (login) | ✅ | `contexts/AuthContext.tsx` |
| Firebase Firestore (posts, ideias, métricas) | ✅ | `services/firebaseService.ts` |
| Firebase Storage SDK | ✅ | Incluído no `firebase` (package.json) — falta exportar |
| Gemini 2.0 Flash (gerar copy) | ✅ | `services/aiContentService.ts` |
| AIContentModal (gerar conteúdo) | ✅ | `components/AIContentModal.tsx` |
| PostFormModal (criar/editar post) | ✅ | `components/PostFormModal.tsx` — sem campo de imagem |
| PostsManager (lista de posts) | ✅ | `components/PostsManager.tsx` — sem thumbnails |
| ContentCalendar (calendário) | ✅ | `components/ContentCalendar.tsx` |
| IdeasBank (banco de ideias) | ✅ | `components/IdeasBank.tsx` |
| ProfileSettings (configurações) | ✅ | `components/ProfileSettings.tsx` |
| Dashboard (orquestrador) | ✅ | `components/Dashboard.tsx` |
| Vercel Functions (api/*) | ✅ | `api/analytics.ts`, `api/gmb.ts`, `api/search-console.ts` |
| Analytics GA4 | ✅ | `services/ga4Service.ts` |
| Search Console | ✅ | `services/gscService.ts` |
| Google My Business | ✅ | `services/gmbService.ts` |
| Instagram Graph API | ❌ | — |
| Upload de imagem | ❌ | — |
| Geração de imagem IA | ❌ | — |
| Cron Job de auto-publicação | ❌ | — |
| Preview do Instagram | ❌ | — |
| Métricas do Instagram | ❌ | — |

---

## Diagrama de Dependências entre Sprints

```
Sprint 0 (Facebook App) ─────────────────────────────────────┐
     │                                                        │
     │ (paralelo)                                             │
     ▼                                                        ▼
Sprint 1 (Upload imagens) ──▶ Sprint 2 (IA imagem) ──▶ Sprint 3 (Preview)
                                                              │
                                                              ▼
                                              Sprint 4 (Publicar) ◀── Sprint 0
                                                              │
                                                    ┌─────────┴─────────┐
                                                    ▼                   ▼
                                            Sprint 5 (Cron)    Sprint 6 (Métricas)
                                                    │                   │
                                                    └─────────┬─────────┘
                                                              ▼
                                                    Sprint 7 (IA + Alertas)
```

---

## SPRINT 0 — Pré-requisito Burocrático (Facebook App)

> ⚠️ Iniciar IMEDIATAMENTE — é o bloqueador mais lento (3-7 dias úteis)
> Pode rodar em paralelo com Sprints 1, 2 e 3

| Status | # | Tarefa | Responsável | Entrega |
|---|---|---|---|---|
| 🔴 | 0.1 | Criar Facebook App em developers.facebook.com | Fernanda/Admin | App criado |
| 🔴 | 0.2 | Conectar Instagram Business Account à Facebook Page | Fernanda | Contas vinculadas |
| 🔴 | 0.3 | Solicitar permissões: `instagram_basic`, `instagram_manage_insights`, `instagram_content_publish`, `pages_read_engagement` | Admin | Solicitação enviada |
| 🔴 | 0.4 | Passar pela revisão da Meta (3-7 dias úteis) | Meta | App aprovado |
| 🔴 | 0.5 | Gerar Long-Lived Token e configurar na Vercel: `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_USER_ID` | Admin | Tokens configurados |

### Passo a passo detalhado:

#### 0.1 — Criar Facebook App
1. Acessar https://developers.facebook.com/
2. Clicar em "Meus Apps" → "Criar App"
3. Tipo: "Business" 
4. Nome: "Fernanda Psicologia Dashboard"
5. Conta Business: associar à conta da Fernanda

#### 0.2 — Vincular Instagram Business
1. No Instagram: Configurações → Conta → Mudar para conta profissional (se ainda não for)
2. No Facebook: Configurações da Página → Instagram → Conectar conta
3. Confirmar vinculação no Instagram

#### 0.3 — Permissões necessárias
```
instagram_basic              → Ler perfil e mídia
instagram_manage_insights    → Ler métricas de alcance/engajamento
instagram_content_publish    → Publicar posts/carrosséis
pages_read_engagement        → Ler dados da Página vinculada
```

#### 0.5 — Variáveis na Vercel
```bash
# No painel da Vercel → Settings → Environment Variables
INSTAGRAM_ACCESS_TOKEN=EAAxxxxxxx...
INSTAGRAM_USER_ID=17841400xxxxxx
```

---

## SPRINT 1 — Upload de Imagens no Dashboard

> 🎯 Pode iniciar imediatamente (não depende da Meta)
> Firebase Storage já está disponível no SDK

| Status | # | Tarefa | Tipo | Arquivo | Descrição |
|---|---|---|---|---|---|
| 🔴 | 1.1 | Inicializar Firebase Storage | Config | `firebase.config.ts` | Exportar `storage` com `getStorage(app)` |
| 🔴 | 1.2 | Criar serviço de upload | Serviço | `services/imageService.ts` | `uploadImage(file) → URL`, `deleteImage(url)`, compressão client-side |
| 🔴 | 1.3 | Adicionar `imageUrls` ao tipo Post | Serviço | `services/firebaseService.ts` | Atualizar interface `Post` com `imageUrls?: string[]` |
| 🔴 | 1.4 | Componente de upload | Frontend | `components/ImageUploader.tsx` | Drag-and-drop, preview, múltiplas imagens (carrossel) |
| 🔴 | 1.5 | Integrar upload no PostFormModal | Frontend | `components/PostFormModal.tsx` | Adicionar `ImageUploader` + salvar URLs com o post |
| 🔴 | 1.6 | Thumbnails na lista de posts | Frontend | `components/PostsManager.tsx` | Miniatura da primeira imagem na tabela |

### Detalhes técnicos:

#### 1.1 — firebase.config.ts (alteração)
```typescript
import { getStorage } from 'firebase/storage';
// ... código existente ...
export const storage = getStorage(app);
```

#### 1.2 — services/imageService.ts (novo)
```typescript
// Funções principais:
uploadImage(file: File, path: string): Promise<string>     // → retorna URL pública
uploadMultipleImages(files: File[]): Promise<string[]>      // → carrossel
deleteImage(url: string): Promise<void>                     // → limpar storage
compressImage(file: File, maxWidth: number): Promise<File>  // → otimizar antes do upload
```

#### 1.3 — Interface Post atualizada
```typescript
export interface Post {
  id?: string;
  title: string;
  channel: 'Instagram' | 'GMB' | 'Blog' | 'Email';
  status: 'published' | 'scheduled' | 'draft';
  date: Date;
  content?: string;
  engagement?: number;
  imageUrls?: string[];           // ← NOVO
  instagramPostId?: string;       // ← NOVO (Sprint 4)
  instagramPermalink?: string;    // ← NOVO (Sprint 4)
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Entrega:
> Fernanda consegue criar posts com imagens anexadas, salvar no Firestore, e ver thumbnails na lista.

---

## SPRINT 2 — Geração de Imagem por IA

> 🎯 Depende apenas de chave de API de imagem (OpenRouter, OpenAI DALL-E, etc.)
> Depende do Sprint 1 (upload) para salvar a imagem gerada

| Status | # | Tarefa | Tipo | Arquivo | Descrição |
|---|---|---|---|---|---|
| 🔴 | 2.1 | Vercel Function de geração | Backend | `api/image-generate.ts` | Proxy seguro para API de imagem, recebe prompt → retorna URL |
| 🔴 | 2.2 | Serviço frontend | Serviço | `services/imageGeneratorService.ts` | `generateImage(prompt, style) → imageUrl` |
| 🔴 | 2.3 | Modal de geração de imagem | Frontend | `components/ImageGeneratorModal.tsx` | Escolher estilo, digitar/auto-gerar prompt, preview, "Usar esta imagem" |
| 🔴 | 2.4 | Integrar no PostFormModal | Frontend | `components/PostFormModal.tsx` | Botão "✨ Gerar Imagem com IA" ao lado do upload |

### Detalhes técnicos:

#### 2.1 — api/image-generate.ts (novo)
```typescript
// POST /api/image-generate
// body: { prompt: string, style: string, size: string }
// response: { imageUrl: string }
// Usa OPENROUTER_API_KEY ou OPENAI_API_KEY do server-side
```

#### 2.3 — Estilos disponíveis
```
- Minimalista (fundo clean, tipografia)
- Colorido (gradientes, formas)
- Educativo (infográfico, bullet points)
- Fotográfico (estilo foto real)
- Carrossel (múltiplos slides com mesma identidade)
```

### Entrega:
> Fernanda clica "Gerar Imagem com IA", recebe visual pronto e anexa ao post — sem sair do dashboard.

---

## SPRINT 3 — Preview e Experiência Visual

> 🎯 Aumenta confiança antes de publicar
> Depende dos Sprints 1 e 2 (para ter imagens nos posts)

| Status | # | Tarefa | Tipo | Arquivo | Descrição |
|---|---|---|---|---|---|
| 🔴 | 3.1 | Componente de preview | Frontend | `components/InstagramPreview.tsx` | Simula visual do feed (foto perfil, nome, imagem, legenda, hashtags) |
| 🔴 | 3.2 | Integrar no PostFormModal | Frontend | `components/PostFormModal.tsx` | Aba/painel "Preview" ao lado do formulário, atualiza em tempo real |
| 🔴 | 3.3 | Preview de carrossel | Frontend | `components/InstagramPreview.tsx` | Setas para navegar entre imagens, indicador de posição |

### Entrega:
> Fernanda vê exatamente como o post ficará no Instagram antes de publicar.

---

## SPRINT 4 — Publicação Real no Instagram

> ⚠️ DEPENDE DO SPRINT 0 (Facebook App aprovado)
> Depende do Sprint 1 (imagens no Firestore)

| Status | # | Tarefa | Tipo | Arquivo | Descrição |
|---|---|---|---|---|---|
| 🔴 | 4.1 | Vercel Function de publicação | Backend | `api/instagram.ts` | `POST /api/instagram/publish` → Graph API (single image + carousel) |
| 🔴 | 4.2 | Suporte a carrossel | Backend | `api/instagram.ts` | Múltiplas imagens → endpoint CAROUSEL da Graph API |
| 🔴 | 4.3 | Serviço frontend Instagram | Serviço | `services/instagramService.ts` | `publishPost(imageUrls, caption) → { id, permalink }` |
| 🔴 | 4.4 | Botão "Publicar no Instagram" | Frontend | `components/PostFormModal.tsx` + `PostsManager.tsx` | Confirmação com preview → publica → salva `instagramPostId` no Firestore |
| 🔴 | 4.5 | Status visual diferenciado | Frontend | `components/PostsManager.tsx` | "📱 Publicado no Instagram" vs "✏️ Rascunho local" |

### Detalhes técnicos:

#### 4.1 — api/instagram.ts (novo)
```typescript
// POST /api/instagram/publish
// Flow para imagem única:
//   1. POST /{user-id}/media → { creation_id }
//   2. POST /{user-id}/media_publish → { id }
//
// Flow para carrossel:
//   1. POST /{user-id}/media (cada imagem) → { creation_id } (x N)
//   2. POST /{user-id}/media (carousel container) → { creation_id }
//   3. POST /{user-id}/media_publish → { id }

// GET /api/instagram/post/:id
// Retorna permalink e status da publicação
```

#### 4.3 — services/instagramService.ts (novo)
```typescript
export const instagramService = {
  publishSingle(imageUrl: string, caption: string): Promise<PublishResult>,
  publishCarousel(imageUrls: string[], caption: string): Promise<PublishResult>,
  getPostStatus(postId: string): Promise<PostStatus>,
};
```

### Entrega:
> Fernanda clica "Publicar no Instagram" → post aparece no feed REAL dela.

---

## SPRINT 5 — Agendamento Automático

> 🎯 Depende do Sprint 4 (publicação funcionando)
> Usa Vercel Cron Jobs (disponível no plano Hobby)

| Status | # | Tarefa | Tipo | Arquivo | Descrição |
|---|---|---|---|---|---|
| 🔴 | 5.1 | Vercel Cron Function | Backend | `api/cron/publish-scheduled.ts` | A cada 15 min: busca posts `scheduled` cuja data passou → publica → atualiza Firestore |
| 🔴 | 5.2 | Configurar Cron no vercel.json | Config | `vercel.json` | `crons: [{ path, schedule }]` |
| 🔴 | 5.3 | Indicador visual de auto-publicação | Frontend | `components/ContentCalendar.tsx` | Ícone de relógio + tooltip "Será publicado automaticamente" |

### Detalhes técnicos:

#### 5.2 — vercel.json (alteração)
```json
{
  "crons": [
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

#### 5.1 — Lógica do Cron
```
1. Buscar no Firestore: posts WHERE status == 'scheduled' AND date <= agora
2. Para cada post:
   a. Se channel == 'Instagram' e tem imageUrls → publicar via Graph API
   b. Atualizar status para 'published'
   c. Salvar instagramPostId e instagramPermalink
   d. Logar execução no Firestore (collection 'cron_logs')
3. Se erro → manter como 'scheduled' + logar erro
```

### Entrega:
> Fernanda agenda post para terça 10h → o sistema publica sozinho nesse horário.

---

## SPRINT 6 — Métricas do Instagram

> 🎯 Depende do Sprint 0 (token), independe da publicação
> Pode rodar em paralelo com Sprints 4 e 5

| Status | # | Tarefa | Tipo | Arquivo | Descrição |
|---|---|---|---|---|---|
| ✅ | 6.1 | Vercel Function de métricas | Backend | `api/instagram-metrics.ts` | `GET /api/instagram-metrics` com seguidores, alcance, impressões e fallback por insights de mídia |
| ✅ | 6.2 | Insights por post | Backend | `api/instagram-metrics.ts` | `GET /api/instagram-metrics?mediaId=:id` para likes/comments/saves/reach/impressions |
| ✅ | 6.3 | Painel de métricas | Frontend | `components/InstagramMetrics.tsx` | Cards (seguidores, alcance, engajamento) + gráfico evolução (Recharts) |
| ✅ | 6.4 | Top Posts + Melhor Horário | Frontend | `components/InstagramMetrics.tsx` | Ranking melhores posts + análise por horário |
| ✅ | 6.5 | Integrar na aba Analytics | Frontend | `components/Dashboard.tsx` | Aba dedicada "Instagram" no dashboard |

### Detalhes técnicos:

#### 6.1 — Endpoints de métricas
```typescript
// GET /api/instagram/metrics
// → { followers, reach, impressions, profileViews, websiteClicks }

// GET /api/instagram/media
// → [{ id, caption, timestamp, likeCount, commentsCount, mediaUrl }]

// GET /api/instagram/insights/:mediaId
// → { reach, impressions, engagement, saves, shares }
```

### Entrega:
> Fernanda vê métricas do Instagram no mesmo painel onde já vê GA4 e Search Console.

---

## SPRINT 7 — IA Inteligente + Alertas (Opcional)

> 🎯 Alto impacto mas não é bloqueante
> Depende dos Sprints 4 e 6 (dados para a IA analisar)

| Status | # | Tarefa | Tipo | Arquivo | Descrição |
|---|---|---|---|---|---|
| 🔴 | 7.1 | Sugestão inteligente | Serviço | `services/aiContentService.ts` | IA analisa métricas Instagram + GA4 → sugere próximo tema e horário ideal |
| 🟡 | 7.2 | Alertas proativos | Backend | `api/cron/alerts.ts` + `api/lib/alertsEngine.ts` | Engine criada (sem post 5d, queda de engajamento 20%), trigger manual e badge na aba Analytics |
| 🔴 | 7.3 | Relatório semanal por email | Backend | `api/cron/weekly-report.ts` | Toda segunda: resumo por email (SendGrid/Resend) |

### Detalhes técnicos:

#### 7.2 — vercel.json (adição ao cron)
```json
{
  "crons": [
    { "path": "/api/cron/publish-scheduled", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/alerts", "schedule": "0 9 * * *" },
    { "path": "/api/cron/weekly-report", "schedule": "0 8 * * 1" }
  ]
}
```

### Entrega:
> Dashboard sugere "Publique sobre TDAH terça às 19h — seus 3 últimos posts sobre o tema tiveram 2x mais alcance".

---

## Arquivos Criados ao Final

```
📁 Novos arquivos:
api/
  instagram.ts                  ← Sprint 4 + 6 (publish + metrics)
  image-generate.ts             ← Sprint 2
  cron/
    publish-scheduled.ts        ← Sprint 5
    alerts.ts                   ← Sprint 7
    weekly-report.ts            ← Sprint 7

services/
  imageService.ts               ← Sprint 1 (upload Firebase Storage)
  imageGeneratorService.ts      ← Sprint 2 (gerar imagem IA)
  instagramService.ts           ← Sprint 4 (client para api/instagram)

components/
  ImageUploader.tsx             ← Sprint 1 (drag-and-drop + preview)
  ImageGeneratorModal.tsx       ← Sprint 2 (modal de geração)
  InstagramPreview.tsx          ← Sprint 3 (preview do feed)
  InstagramMetrics.tsx          ← Sprint 6 (painel de métricas)

📝 Arquivos alterados:
firebase.config.ts              ← Sprint 1.1 (exportar Storage)
services/firebaseService.ts     ← Sprint 1.3 (campo imageUrls no Post)
components/PostFormModal.tsx     ← Sprint 1.5, 2.4, 3.2, 4.4
components/PostsManager.tsx      ← Sprint 1.6, 4.5
components/ContentCalendar.tsx   ← Sprint 5.3
components/Dashboard.tsx         ← Sprint 6.5
vercel.json                      ← Sprint 5.2, 7.2
```

---

## Variáveis de Ambiente (Vercel)

| Variável | Sprint | Como Obter |
|---|---|---|
| `INSTAGRAM_ACCESS_TOKEN` | 0 → 4, 6 | Facebook Developer Console após aprovação da Meta |
| `INSTAGRAM_USER_ID` | 0 → 4, 6 | Graph API Explorer ou Business Suite |
| `OPENROUTER_API_KEY` ou `OPENAI_API_KEY` | 2 | Cadastro em openrouter.ai ou platform.openai.com |
| `VITE_GEMINI_API_KEY` | — | ✅ Já configurada |
| `RESEND_API_KEY` | 7 | resend.com (gratuito até 100 emails/dia) |

---

## Resumo Executivo

| Sprint | Descrição | Depende de | Resultado |
|---|---|---|---|
| **0** | Facebook App + aprovação Meta | — | Token de acesso ao Instagram |
| **1** | Upload de imagens no dashboard | — | Posts com fotos no Firestore |
| **2** | Geração de imagem por IA | Sprint 1 | Imagens criadas sem sair do dashboard |
| **3** | Preview do Instagram | Sprint 1 + 2 | Ver como ficará antes de postar |
| **4** | Publicação real no Instagram | Sprint 0 + 1 | Botão que posta de verdade |
| **5** | Agendamento automático (Cron) | Sprint 4 | Posts publicam sozinhos no horário |
| **6** | Painel de métricas Instagram | Sprint 0 | Seguidores, alcance, engajamento |
| **7** | IA inteligente + alertas | Sprint 4 + 6 | Sugestões e avisos automáticos |

---

## Ordem de Execução Recomendada

```
Semana 1:
  ├── [Sprint 0] Criar Facebook App (burocracia em paralelo)
  ├── [Sprint 1] Upload de imagens (1.1 → 1.6)
  └── [Sprint 2] Geração de imagem IA (2.1 → 2.4)

Semana 2:
  ├── [Sprint 3] Preview do Instagram (3.1 → 3.3)
  ├── [Sprint 4] Publicação real (4.1 → 4.5) ← depende Sprint 0 aprovado
  └── [Sprint 6] Métricas Instagram (6.1 → 6.5) ← depende Sprint 0 aprovado

Semana 3:
  ├── [Sprint 5] Agendamento automático (5.1 → 5.3)
  └── [Sprint 7] IA inteligente + alertas (7.1 → 7.3)
```
