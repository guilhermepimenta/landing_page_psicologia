# Workflows de Automação - Integrações e APIs

## 🎯 Objetivo

Automatizar máximo possível do marketing digital, reduzindo trabalho manual de 6-8h/semana para 2-3h/semana through:
- Agendamento automático de posts
- Publicação cross-platform
- Captura e organização de leads
- Follow-ups automáticos
- Analytics consolidado

---

## 📊 NÍVEIS DE AUTOMAÇÃO

### Nível 1: MANUAL COM TEMPLATES ⭐ (Atual)
**Custo:** R$ 0  
**Tempo:** 3-4h/semana  
**Ferramentas:** Templates copy-paste + publicação manual

✅ Usar templates desta skill  
✅ Publicar manualmente em cada plataforma  
✅ Dashboard manual (Google Sheets)  

---

### Nível 2: SEMI-AUTOMÁTICO ⭐⭐ (Recomendado)
**Custo:** R$ 0-100/mês  
**Tempo:** 2-3h/semana  
**Ferramentas:** Buffer/Hootsuite + Zapier grátis + Google Sheets

✅ Agendar posts uma vez por semana  
✅ Auto-compartilhamento cross-platform  
✅ Leads organizados automaticamente  
✅ Follow-ups semi-automáticos  

---

### Nível 3: TOTALMENTE AUTOMÁTICO ⭐⭐⭐ (Avançado)
**Custo:** R$ 200-500/mês  
**Tempo:** 1-2h/semana  
**Ferramentas:** Make/n8n + APIs + Dashboard customizado

✅ AI gera conteúdo baseado em prompts  
✅ Publicação automática multi-canal  
✅ Lead scoring automático  
✅ Email sequences automáticas  
✅ Analytics em tempo real  

---

## 🔧 FERRAMENTAS POR NÍVEL

### Nível 1 (Grátis - R$ 0/mês)

| Ferramenta | Uso | Limite Grátis |
|------------|-----|---------------|
| **Canva** | Criar imagens | Ilimitado (com marca d'água) |
| **Meta Business Suite** | Agendar Instagram/Facebook | Ilimitado |
| **Google Meu Negócio** | Posts GMB | Ilimitado |
| **Google Sheets** | Dashboard | Ilimitado |
| **Gmail** | Email marketing básico | 500 emails/dia |
| **Google Analytics** | Métricas site | Ilimitado |

**Total:** R$ 0/mês

---

### Nível 2 (Semi-Auto - R$ 0-100/mês)

| Ferramenta | Uso | Custo | Limite |
|------------|-----|-------|--------|
| **Buffer** | Agendar posts multi-canal | R$ 0-50/mês | 3 canais free, 10 posts agendados |
| **Zapier** | Automações básicas | R$ 0-80/mês | 5 Zaps grátis, 100 tasks/mês |
| **Google Forms** | Captura de leads | R$ 0 | Ilimitado |
| **MailChimp** | Email marketing | R$ 0-50/mês | 500 contatos free |
| **Google Calendar** | Agendamentos | R$ 0 | Ilimitado |

**Total:** R$ 0-100/mês (pode começar grátis!)

---

### Nível 3 (Full Auto - R$ 200-500/mês)

| Ferramenta | Uso | Custo |
|------------|-----|-------|
| **Make.com** | Automações avançadas | R$ 80-200/mês |
| **OpenAI API** | Geração de conteúdo | R$ 20-50/mês |
| **Airtable Pro** | Database + Dashboard | R$ 100/mês |
| **SendGrid** | Email transacional | R$ 80/mês |
| **Metricool** | Analytics consolidado | R$ 50/mês |

**Total:** R$ 330-480/mês

---

## 🚀 WORKFLOWS PRONTOS (Copy-Paste)

### Workflow 1: Publicação Cross-Platform (Nível 2)

**Objetivo:** Criar 1 post → Publicar em Instagram, Facebook, GMB automaticamente

**Ferramentas:** Buffer (grátis) ou Meta Business Suite

**Setup (5 min):**
1. Criar conta Buffer: [buffer.com](https://buffer.com)
2. Conectar Instagram + Facebook + Google (GMB via Zapier)
3. Criar post no Buffer com texto + imagem
4. Escolher horários para cada canal
5. Agendar!

**Resultado:** 1 post criado = 3 canais publicados automaticamente ✅

---

### Workflow 2: Lead Capture Automático (Nível 2)

**Objetivo:** Lead preenche formulário → Adiciona no Google Sheets → Email automático

**Ferramentas:** Google Forms + Zapier (grátis) + Gmail

**Setup Zapier:**
```
TRIGGER: Google Forms - New Response
↓
ACTION 1: Google Sheets - Add Row
(Organiza leads em planilha)
↓
ACTION 2: Gmail - Send Email
(Email de boas-vindas automático)
```

**Template de Zap:**
```json
{
  "trigger": "google_forms",
  "actions": [
    {
      "app": "google_sheets",
      "action": "create_row",
      "data": {
        "spreadsheet_id": "SEU_ID",
        "worksheet": "Leads",
        "columns": ["Nome", "Email", "Telefone", "Data"]
      }
    },
    {
      "app": "gmail",
      "action": "send_email",
      "data": {
        "to": "{{form_email}}",
        "subject": "Obrigada pelo contato!",
        "body": "Template de email aqui..."
      }
    }
  ]
}
```

**Resultado:** Lead preencheu formulário → Entra na planilha + Recebe email automático em < 1 min!

---

### Workflow 3: Blog Post → Social Media Auto (Nível 2)

**Objetivo:** Publicou no blog → Automaticamente posta no Instagram + Facebook + GMB

**Ferramentas:** WordPress/Site + Zapier + Buffer

**Setup:**
```
TRIGGER: RSS Feed - New Item
(Detecta novo post no blog)
↓
ACTION 1: AI by Zapier - Summarize Text
(Cria resumo do artigo)
↓
ACTION 2: Buffer - Create Post
(Agenda post nas redes com resumo + link)
```

**Resultado:** Publicou blog → Redes sociais atualizam sozinhas! 🚀

---

### Workflow 4: Follow-up Automático de Leads (Nível 2-3)

**Objetivo:** Lead não respondeu em 3 dias → Enviar email automático

**Ferramentas:** Google Sheets + Zapier + Gmail

**Setup:**
```
TRIGGER: Google Sheets - Updated Row
(Quando status muda para "Sem resposta")
↓
FILTER: Days since contact >= 3
↓
ACTION: Gmail - Send Email
(Email de follow-up template)
```

**Email Templates:**
- **Dia 1:** Confirmação + Informações
- **Dia 3:** "Ainda tem interesse?"
- **Dia 7:** "Última chance" + Oferta

---

### Workflow 5: Monitoramento de Menções (Nível 2)

**Objetivo:** Alguém menciona sua marca → Notificação instantânea

**Ferramentas:** Google Alerts + Zapier + Telegram/WhatsApp

**Setup:**
```
TRIGGER: RSS Feed - New Google Alert
(Detecta menção da marca)
↓
ACTION: Telegram - Send Message
(Notifica você instantaneamente)
```

**Resultado:** Nunca perde uma menção, review ou comentário!

---

## 📱 APPS RECOMENDADOS (Mobile)

### Para Criação de Conteúdo:
1. **Canva** (iOS/Android) - Design rápido
2. **CapCut** (iOS/Android) - Editar Reels
3. **VSCO** (iOS/Android) - Filtros consistentes
4. **Unfold** (iOS/Android) - Templates Stories

### Para Agendamento:
5. **Meta Business Suite** (iOS/Android) - Instagram/Facebook
6. **Buffer** (iOS/Android) - Multi-canal
7. **Later** (iOS/Android) - Visual planning

### Para Gestão:
8. **Google Meu Negócio** (iOS/Android) - GMB posts
9. **Google Analytics** (iOS/Android) - Métricas
10. **Notion** (iOS/Android) - Organização geral

---

## 🎨 SETUP COMPLETO NÍVEL 2 (Passo a Passo)

### Semana 1: Fundação (2-3h)

**Dia 1-2: Contas e Integrações**
- [ ] Criar conta Buffer (grátis)
- [ ] Criar conta Zapier (grátis)
- [ ] Criar conta Canva (grátis)
- [ ] Conectar Instagram ao Buffer
- [ ] Conectar Facebook ao Buffer
- [ ] Conectar Google Meu Negócio (via Zapier)

**Dia 3-4: Templates e Assets**
- [ ] Copiar templates desta skill para Google Docs
- [ ] Criar 5 templates visuais no Canva
- [ ] Tirar 20 fotos do consultório (usar todas semanas)
- [ ] Criar banco de hashtags (copiar desta skill)

**Dia 5-7: Dashboard e Calendário**
- [ ] Copiar dashboard-marketing.md para Google Sheets
- [ ] Preencher banco de ideias (100 temas)
- [ ] Planejar próximo mês (12 temas)

---

### Semana 2: Primeira Automação (2h)

**Segunda:**
- [ ] Escolher 4 temas da semana
- [ ] Gerar conteúdo usando templates (30min)
- [ ] Criar 4 imagens no Canva (30min)

**Terça:**
- [ ] Agendar 4 posts Instagram no Buffer (15min)
- [ ] Agendar 2 posts GMB (10min)
- [ ] Escrever newsletter (30min)

**Quarta-Sexta:**
- [ ] NADA! Deixar automação trabalhar 🎉
- [ ] Apenas responder mensagens (10min/dia)

---

### Semana 3+: Modo Piloto Automático

**Segunda (2h):**
- Planejar semana
- Criar conteúdo em lote
- Agendar tudo

**Terça-Domingo:**
- Apenas monitorar e engajar
- Responder mensagens
- Total: 10-20min/dia

**Resultado:** De 6-8h espalhadas → 2h concentradas + 10min/dia! 🚀

---

## 🔐 SEGURANÇA E BACKUP

### Boas Práticas:

1. **Senhas fortes** - Use gerenciador (1Password, Bitwarden)
2. **2FA ativado** - Em todas contas (Instagram, GMB, Buffer)
3. **Backup semanal** - Exportar dados do Sheets
4. **Revogar acessos** - Apps que não usa mais
5. **LGPD compliance** - Não compartilhar dados de leads

### Checklist de Segurança:
- [ ] Instagram com 2FA
- [ ] Facebook com 2FA
- [ ] Google com 2FA
- [ ] Zapier com acesso limitado (apenas apps necessários)
- [ ] Backup mensal do Google Sheets
- [ ] Política de privacidade no site
- [ ] Consentimento LGPD em formulários

---

## 📊 ROI DA AUTOMAÇÃO

### Investimento Inicial (Nível 2):

**Tempo:**
- Setup: 4-6h (uma vez)
- Manutenção: 2-3h/semana

**Dinheiro:**
- R$ 0-100/mês em ferramentas

### Retorno:

**Tempo economizado:**
- Antes: 6-8h/semana
- Depois: 2-3h/semana
- **Economia: 4-5h/semana = 20h/mês**

**Se seu tempo vale R$ 100/h:**
- Economia mensal: R$ 2.000
- Custo de ferramentas: R$ 100
- **ROI: 1.900%** 🚀

**Leads gerados:**
- Antes (irregular): 2-5/mês
- Depois (consistente): 10-20/mês
- **Aumento: 3-4x**

---

## 🚀 PRÓXIMOS PASSOS

### Hoje (30min):
1. Criar conta Buffer: [buffer.com](https://buffer.com)
2. Conectar Instagram
3. Agendar primeiro post de teste

### Esta semana (2h):
4. Criar conta Zapier
5. Setup "Lead Capture" workflow
6. Copiar templates para Google Docs

### Próximas 2 semanas (4h):
7. Implementar todos workflows deste guia
8. Testar automações
9. Ajustar conforme necessário

### Mês 2+:
10. Otimizar com base em dados
11. Considerar upgrade para Nível 3 (se ROI justificar)

---

## 💡 TROUBLESHOOTING

### Problema: "Buffer não está postando no GMB"
**Solução:** GMB não tem API oficial. Use Zapier como ponte:
```
Buffer → Webhook → Zapier → Google Sheets (manual post)
```

### Problema: "Zapier atingiu limite de tasks"
**Solução:** 
1. Otimizar Zaps (remover triggers desnecessários)
2. Usar filtros para reduzir execuções
3. Ou upgrade para R$ 80/mês (20.000 tasks)

### Problema: "Instagram não aceita agendamento"
**Solução:** Converter para conta Business/Creator:
Settings → Account → Switch to Professional Account

### Problema: "Muito tempo criando imagens"
**Solução:** 
1. Criar 10 templates base no Canva
2. Apenas mudar texto (5min/imagem)
3. Batch creation: 10 imagens de uma vez

---

## 📚 RECURSOS E TUTORIAIS

### Vídeos Úteis:
- [Como usar Buffer](https://youtube.com/buffer)
- [Zapier para iniciantes](https://youtube.com/zapier)
- [Canva para redes sociais](https://youtube.com/canva)

### Documentação Oficial:
- [Buffer Help Center](https://support.buffer.com)
- [Zapier Documentation](https://zapier.com/help)
- [Meta Business Suite](https://business.facebook.com/support)

### Comunidades:
- r/socialmedia (Reddit)
- r/marketing (Reddit)
- Grupos Facebook de Psicólogos

---

**Última atualização:** Março 2026  
**Próxima revisão:** Junho 2026 (revisar novas ferramentas/APIs)
