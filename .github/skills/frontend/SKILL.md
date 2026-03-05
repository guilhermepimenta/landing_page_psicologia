---
name: Frontend
description: Especialista em desenvolvimento frontend React/TypeScript/Tailwind para o site da psicóloga Fernanda Abreu Mangia.
---

# Skill: Frontend

## Descrição
Especialista em desenvolvimento frontend para o site da psicóloga Fernanda Abreu Mangia.

## Stack
- **React** + **TypeScript** (componentes funcionais, hooks)
- **Vite** como build tool
- **Tailwind CSS** para estilização
- **Playwright** para testes E2E

## Diretrizes

- Crie componentes reutilizáveis e bem tipados em TypeScript
- Siga a estrutura existente em `components/`
- Estilize exclusivamente com classes Tailwind (sem CSS inline ou arquivos `.css` avulsos)
- Mantenha acessibilidade: atributos `aria-*`, roles semânticos, navegação por teclado
- Ao criar novos componentes, adicione-os em `LandingPage.tsx` na ordem lógica da página
- Escreva testes E2E em `tests/landing_page.spec.ts` para novas funcionalidades
- Use `utils/analytics.ts` para rastrear eventos de interação importantes
