# 🔥 Configuração do Firebase

## Por que Firebase?

O Firebase foi escolhido para substituir os dados mockados do dashboard por dados reais, oferecendo:

✅ **Firestore Database**: Banco de dados NoSQL em tempo real  
✅ **Authentication**: Autenticação segura (substituindo localStorage)  
✅ **Analytics**: Métricas de uso automáticas  
✅ **Hosting**: Deploy gratuito  
✅ **Grátis**: Até 50K leituras/dia e 20K escritas/dia  

---

## 📋 Passo a Passo: Criar Projeto Firebase

### 1. Criar conta no Firebase Console

1. Acesse: **https://console.firebase.google.com/**
2. Faça login com sua conta Google
3. Clique em **"Adicionar projeto"** (ou "Create a project")

### 2. Configurar o projeto

1. **Nome do projeto**: `fernanda-psicologia` (ou outro de sua escolha)
2. **Google Analytics**: Ative (recomendado)
3. **Conta do Analytics**: Crie uma nova ou use existente
4. Clique em **"Criar projeto"** e aguarde ~30 segundos

### 3. Adicionar app Web

1. No painel do projeto, clique no ícone **"</>** (Web)
2. **Nome do app**: `Dashboard Marketing`
3. ✅ Marque **"Configurar também o Firebase Hosting"**
4. Clique em **"Registrar app"**
5. **IMPORTANTE**: Copie o código de configuração que aparece

### 4. Configurar Firestore Database

1. No menu lateral, vá em **"Build" → "Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. **Modo**: Escolha **"Iniciar no modo de teste"** (por enquanto)
4. **Local**: `southamerica-east1` (São Paulo) - mais rápido para o Brasil
5. Clique em **"Ativar"**

### 5. Configurar regras de segurança (IMPORTANTE)

No Firestore, vá em **"Regras"** e substitua por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita apenas para usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Clique em **"Publicar"**.

### 6. Configurar Authentication

1. No menu lateral, vá em **"Build" → "Authentication"**
2. Clique em **"Vamos começar"**
3. Na aba **"Sign-in method"**, ative:
   - ✅ **E-mail/senha**
4. Clique em **"Salvar"**

### 7. Adicionar usuário admin

1. Na aba **"Users"**, clique em **"Adicionar usuário"**
2. **E-mail**: `admin@fernandapsicologia.com`
3. **Senha**: (escolha uma senha forte)
4. Clique em **"Adicionar usuário"**

---

## 🔧 Configurar no Projeto

### 1. Criar arquivo `.env`

Na raiz do projeto, crie o arquivo `.env` (copie de `.env.example`):

```bash
cp .env.example .env
```

### 2. Preencher credenciais

Abra `.env` e cole as credenciais do Firebase Console:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=fernanda-psicologia.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fernanda-psicologia
VITE_FIREBASE_STORAGE_BUCKET=fernanda-psicologia.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

⚠️ **IMPORTANTE**: Adicione `.env` ao `.gitignore` para não expor suas credenciais!

### 3. Criar estrutura de coleções

No Firestore Console, crie manualmente as coleções (ou deixe o código criar automaticamente):

- `posts` - Armazena posts publicados/agendados
- `metrics` - Métricas por canal (Instagram, GMB, Blog, Email)
- `ideas` - Banco de ideias de conteúdo

---

## 📊 Estrutura do Banco de Dados

### Coleção: `posts`

```typescript
{
  title: string,           // "5 sinais de TDAH em adultos"
  channel: string,         // "Instagram" | "GMB" | "Blog" | "Email"
  status: string,          // "published" | "scheduled" | "draft"
  date: timestamp,         // Data de publicação/agendamento
  content: string,         // Conteúdo completo do post
  engagement: number,      // Total de curtidas/cliques
  createdAt: timestamp,    // Data de criação
  updatedAt: timestamp     // Última atualização
}
```

### Coleção: `metrics`

```typescript
{
  channel: string,         // "Instagram" | "GMB" | "Blog" | "Email"
  value: number,           // 1247 (visualizações/cliques)
  change: number,          // 12.5 (variação percentual)
  date: timestamp,         // Data da métrica
  icon: string            // "📱" | "📍" | "📝" | "📧"
}
```

### Coleção: `ideas`

```typescript
{
  category: string,        // "TDAH" | "Ansiedade" | "Memória"
  title: string,           // "Como lidar com procrastinação"
  used: boolean,           // false (ainda não usada)
  createdAt: timestamp     // Data de criação
}
```

---

## 🚀 Como Usar no Código

### Importar serviços

```typescript
import { postsService, metricsService, ideasService } from './services/firebaseService';
```

### Exemplos de uso

```typescript
// Criar post
await postsService.create({
  title: "5 sinais de TDAH",
  channel: "Instagram",
  status: "scheduled",
  date: new Date("2026-03-10"),
  content: "Conteúdo do post..."
});

// Buscar posts recentes
const { data: posts } = await postsService.getRecent(10);

// Salvar métrica
await metricsService.save({
  channel: "Instagram",
  value: 1247,
  change: 12.5,
  date: new Date(),
  icon: "📱"
});

// Buscar métricas
const { data: metrics } = await metricsService.getLatest();
```

---

## 🔄 Próximos Passos

1. ✅ Substituir dados mockados no Dashboard.tsx
2. ✅ Implementar autenticação real (substituir AuthContext)
3. ✅ Adicionar formulário de criação de posts
4. ✅ Conectar calendário ao Firestore
5. ✅ Implementar analytics em tempo real

---

## 💰 Custos (Plano Gratuito "Spark")

- **Firestore**: 50K leituras/dia, 20K escritas/dia
- **Authentication**: Ilimitado
- **Hosting**: 10GB transferência/mês
- **Storage**: 5GB armazenamento

**Estimativa para seu uso**: R$ 0/mês (bem dentro do limite gratuito)

Se ultrapassar, o plano "Blaze" cobra por uso:
- R$ 0,36 por 100K leituras adicionais
- R$ 1,08 por 100K escritas adicionais

---

## 🆘 Solução de Problemas

### Erro: "Missing or insufficient permissions"

**Solução**: Verifique as regras do Firestore (passo 5) e se o usuário está autenticado.

### Erro: "Firebase: Error (auth/wrong-password)"

**Solução**: Senha incorreta. Redefina a senha no Console → Authentication → Users.

### Erro: "Module not found: firebase"

**Solução**: Execute `npm install firebase`

### Dados não aparecem no Dashboard

**Solução**: 
1. Verifique se `.env` está configurado corretamente
2. Reinicie o servidor: `npm run dev`
3. Verifique o Console do navegador (F12) para erros

---

## 📞 Suporte

- **Documentação oficial**: https://firebase.google.com/docs
- **Firebase Console**: https://console.firebase.google.com/
- **Status do Firebase**: https://status.firebase.google.com/

---

**Última atualização**: 5 de março de 2026
