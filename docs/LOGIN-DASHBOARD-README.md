# Sistema de Login e Dashboard - Marketing Hub

## 📋 Visão Geral

Sistema completo de autenticação e dashboard administrativo integrado à landing page da psicóloga Fernanda Abreu Mangia.

---

## 🎯 Funcionalidades

### Autenticação
- ✅ Tela de login responsiva
- ✅ Validação de credenciais
- ✅ Sessão persistente (localStorage)
- ✅ Proteção de rotas privadas
- ✅ Logout com limpeza de sessão

### Dashboard
- ✅ Overview com métricas em tempo real
- ✅ Gerenciamento de posts (Instagram, GMB, Blog, Email)
- ✅ Calendário editorial
- ✅ Banco de ideias (142+ tópicos)
- ✅ Analytics por canal
- ✅ Layout responsivo (mobile-first)

---

## 🚀 Como Usar

### 1. Acessar o Login

**Opção 1: Via Navbar**
- Clique no ícone 🔐 no menu de navegação (desktop)
- Ou acesse "🔐 Acesso Admin" no menu mobile

**Opção 2: URL Direta**
- Acesse: `http://localhost:5173/login`

### 2. Credenciais Demo

```
Email: admin@fernandapsicologia.com
Senha: demo123
```

### 3. Navegação no Dashboard

Após login, você terá acesso a:
- 📊 **Dashboard** - Visão geral e métricas
- 📱 **Conteúdo** - Gerenciar posts
- 📅 **Calendário** - Planejar publicações
- 💡 **Ideias** - Banco com 142+ tópicos
- 📈 **Analytics** - Métricas detalhadas
- ⚙️ **Configurações** - Ajustes do perfil

---

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── Login.tsx              # Tela de login
│   ├── Dashboard.tsx          # Dashboard principal
│   ├── DashboardLayout.tsx    # Layout do dashboard (sidebar, header)
│   ├── ProtectedRoute.tsx     # HOC para proteger rotas
│   └── Navbar.tsx             # Navbar com link de admin
├── contexts/
│   └── AuthContext.tsx        # Context de autenticação
└── App.tsx                    # Rotas principais
```

---

## 🔐 Sistema de Autenticação

### AuthContext

O sistema usa React Context API para gerenciar autenticação:

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string; name: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}
```

### Fluxo de Autenticação

```
1. Usuário insere credenciais
   ↓
2. AuthContext.login() valida
   ↓
3. Se válido: salva no localStorage + redireciona para /dashboard
   ↓
4. Se inválido: mostra erro
```

### Proteção de Rotas

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

Se não estiver autenticado → Redireciona para `/login`

---

## 🎨 Design System

### Cores Principais
- **Primary:** Purple (#7C3AED)
- **Success:** Green (#10B981)
- **Warning:** Yellow (#F59E0B)
- **Danger:** Red (#EF4444)
- **Background:** Gray-50 (#F9FAFB)

### Componentes Reutilizáveis
- Cards com shadow e hover
- Badges de status (Publicado, Agendado, Rascunho, Ideia)
- Botões com estados de loading
- Sidebar colapsável (mobile)

---

## 📊 Métricas do Dashboard

### Dados Exibidos (Exemplo)

```typescript
const metrics = [
  { channel: 'Instagram', value: 1247, change: +12.5% },
  { channel: 'GMB', value: 342, change: +68.2% },
  { channel: 'Blog', value: 89, change: +24.1% },
  { channel: 'Email', value: 47, change: +8.3% },
];
```

**Em produção:** Conectar com Google Analytics API, Meta Graph API, etc.

---

## 🔄 Integrações Futuras

### Fase 1 (Atual): Interface Manual
- ✅ Dashboard funcional
- ✅ Visualização de métricas mockadas
- ✅ Interface para criar posts

### Fase 2: APIs de Dados Reais
- [ ] Google Analytics API
- [ ] Meta Graph API (Instagram/Facebook)
- [ ] Google My Business API
- [ ] SendGrid API (Email)

### Fase 3: Geração de Conteúdo com IA
- [ ] OpenAI API para gerar posts
- [ ] Templates da skill automation
- [ ] Publicação automática via APIs

### Fase 4: Analytics Avançado
- [ ] Dashboards interativos (Chart.js / Recharts)
- [ ] Comparação de períodos
- [ ] Exportação de relatórios PDF
- [ ] Alertas automáticos

---

## 🛠️ Desenvolvimento

### Adicionar Nova Página no Dashboard

1. Crie o componente:
```typescript
// components/Analytics.tsx
const Analytics: React.FC = () => {
  return (
    <DashboardLayout>
      {/* Seu conteúdo aqui */}
    </DashboardLayout>
  );
};
```

2. Adicione a rota no App.tsx:
```typescript
<Route
  path="/dashboard/analytics"
  element={
    <ProtectedRoute>
      <Analytics />
    </ProtectedRoute>
  }
/>
```

3. Adicione no menu do DashboardLayout.tsx:
```typescript
{ icon: '📈', label: 'Analytics', path: '/dashboard/analytics' }
```

---

## 🔒 Segurança

### Implementado
- ✅ Proteção de rotas via ProtectedRoute
- ✅ Sessão no localStorage (persistência)
- ✅ Logout limpa todos os dados

### TODO (Produção)
- [ ] Autenticação JWT com backend
- [ ] Refresh tokens
- [ ] HTTPS obrigatório
- [ ] Rate limiting
- [ ] 2FA (autenticação de dois fatores)
- [ ] Logs de acesso
- [ ] Hash de senhas (bcrypt)
- [ ] Proteção CSRF

---

## 📱 Responsividade

### Breakpoints
- **Mobile:** < 768px
  - Sidebar colapsável
  - Menu hamburger
  - Cards em coluna única
  
- **Tablet:** 768px - 1024px
  - Sidebar fixa
  - 2 colunas de cards
  
- **Desktop:** > 1024px
  - Sidebar fixa
  - 4 colunas de cards
  - Experiência completa

---

## 🧪 Testes

### Testar Autenticação

```bash
# 1. Login correto
Email: admin@fernandapsicologia.com
Senha: demo123
Resultado: Redireciona para /dashboard

# 2. Login incorreto
Email: wrong@email.com
Senha: wrong123
Resultado: Mostra erro

# 3. Acesso direto sem login
URL: http://localhost:5173/dashboard
Resultado: Redireciona para /login

# 4. Logout
Clicar em "Sair" no dashboard
Resultado: Volta para homepage
```

---

## 🚀 Deploy

### Variáveis de Ambiente (Futuro)

Criar `.env`:
```env
VITE_API_URL=https://api.seu-backend.com
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_META_APP_ID=XXXXXXXXXX
VITE_GMB_API_KEY=XXXXXXXXXX
```

### Build de Produção

```bash
npm run build
# ou
yarn build
```

### Deploy na Vercel

```bash
# Já configurado em vercel.json
vercel --prod
```

---

## 📚 Recursos Relacionados

### Skills de Automação
- [.github/skills/automation/SKILL.md](../.github/skills/automation/SKILL.md)
- [.github/skills/automation/dashboard-marketing.md](../.github/skills/automation/dashboard-marketing.md)
- [.github/skills/automation/templates-conteudo.md](../.github/skills/automation/templates-conteudo.md)

### Próximos Passos
1. Conectar APIs reais (Google Analytics, Meta, GMB)
2. Implementar backend NodeJS + MongoDB
3. Adicionar geração de conteúdo com IA (OpenAI)
4. Sistema de agendamento de posts
5. Analytics avançado com gráficos interativos

---

## 💡 FAQ

**P: Como adicionar novos usuários?**  
R: Atualmente é apenas demo. Na produção, criar endpoint `/api/auth/register` no backend.

**P: Os dados são reais?**  
R: Não, são mockados. Conectar APIs reais na Fase 2.

**P: Posso personalizar o dashboard?**  
R: Sim! Edite `Dashboard.tsx` e `DashboardLayout.tsx`.

**P: Como integrar com Google Analytics?**  
R: Usar biblioteca `@react-google-analytics/ga4` e configurar em `utils/analytics.ts`.

---

**Versão:** 1.0  
**Última atualização:** Março 2026  
**Desenvolvido para:** Fernanda Abreu Mangia - Psicologia
