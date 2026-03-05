---
name: Fernanda Abreu Mangia - Psicologia
description: Skill para auxiliar no desenvolvimento do site da psicóloga Fernanda Abreu Mangia. Contém contexto do projeto, convenções de código e orientações para o agente.
---

# Skill: Fernanda Abreu Mangia - Psicologia

## Contexto do Projeto

Este é um site profissional para a psicóloga **Fernanda Abreu Mangia**. O projeto é uma Single Page Application (SPA) construída com:

- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Estilização**: Tailwind CSS
- **Deploy**: Vercel
- **Testes**: Playwright (E2E)

## Estrutura de Componentes

O site é composto pelos seguintes componentes principais:

- `LandingPage.tsx` — Página principal que orquestra todos os componentes
- `Navbar.tsx` — Barra de navegação
- `Hero.tsx` — Seção inicial com chamada para ação
- `Bio.tsx` — Biografia e apresentação profissional
- `Services.tsx` — Serviços oferecidos
- `Testimonials.tsx` — Depoimentos de pacientes
- `Blog.tsx` / `BlogPost.tsx` — Blog e artigos
- `Scheduling.tsx` — Agendamento de consultas
- `Contact.tsx` — Formulário e informações de contato
- `Footer.tsx` — Rodapé
- `AIChatAssistant.tsx` — Assistente de chat com IA
- `ShareModal.tsx` — Modal de compartilhamento

## Diretrizes para o Agente

### Idioma
- Todo o conteúdo voltado ao usuário deve estar em **português brasileiro (pt-BR)**
- Comentários de código podem ser em inglês ou português

### Estilo de Código
- Utilize **componentes funcionais** com hooks do React
- Prefira **TypeScript estrito** com tipagem explícita
- Siga as convenções do **Tailwind CSS** para estilização (sem CSS inline)
- Mantenha componentes pequenos e reutilizáveis

### Tom e Identidade Visual
- O site transmite **confiança, acolhimento e profissionalismo**
- Paleta de cores: tons suaves e neutros (confira `tailwind.config` ou variáveis CSS existentes)
- Linguagem empática e acessível, adequada ao público de saúde mental

### Boas Práticas
- Ao adicionar novas seções, siga o padrão visual dos componentes existentes
- Mantenha acessibilidade (atributos `aria-*`, contraste de cores, semântica HTML)
- Novos testes E2E devem ser adicionados em `tests/landing_page.spec.ts`
- Atualize `metadata.json` quando houver mudanças estruturais relevantes

### Agendamento e Contato
- O componente `Scheduling.tsx` pode integrar com plataformas externas (ex: Doctoralia, Calendly)
- Informações de contato reais devem ser mantidas atualizadas

## Arquivos Importantes

| Arquivo | Descrição |
|---|---|
| `App.tsx` | Ponto de entrada da aplicação |
| `metadata.json` | Metadados do site (SEO, informações gerais) |
| `vercel.json` | Configurações de deploy na Vercel |
| `vite.config.ts` | Configuração do Vite |
| `utils/analytics.ts` | Utilitários de analytics |
