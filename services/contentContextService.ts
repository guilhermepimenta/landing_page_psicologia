/**
 * Camada de agente contextual para geração de conteúdo.
 *
 * Fornece três ferramentas que o fluxo de criação usa antes de chamar a IA:
 *   1. getRecentTopics      — o que já foi publicado no canal (evita repetição)
 *   2. validateContent      — pontua qualidade antes de salvar/publicar
 *   3. generateWithContext  — orquestra tudo em uma única chamada
 */

import { db } from '../firebase.config';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { generateContent, ContentChannel, InstagramFormat, ContentTone, GeneratedContent } from './aiContentService';

// ─────────────────────────────────────────────
// Ferramenta 1 — Posts recentes (evita repetição)
// ─────────────────────────────────────────────

export async function getRecentTopics(channel: ContentChannel, limitCount = 8): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'posts'),
      where('channel', '==', channel),
      where('status', 'in', ['published', 'scheduled']),
      orderBy('date', 'desc'),
      limit(limitCount),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => String(d.data().title ?? '')).filter(Boolean);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// Ferramenta 2 — Validação de qualidade
// ─────────────────────────────────────────────

export interface ContentQuality {
  score: number;                // 0–100
  checks: QualityCheck[];
  passed: boolean;              // true se score >= 70
}

export interface QualityCheck {
  label: string;
  ok: boolean;
  hint?: string;
}

const HASHTAG_RANGE: Record<ContentChannel, [number, number]> = {
  Instagram: [5, 10],
  Facebook:  [0, 0],
  Blog:      [2, 5],
  Email:     [0, 0],
  GMB:       [0, 0],
};

const CONTENT_LIMITS: Record<string, { min: number; max: number }> = {
  'Instagram:post':       { min: 100,  max: 2200  },
  'Instagram:carrossel':  { min: 200,  max: 3000  },
  'Instagram:reels':      { min: 100,  max: 1500  },
  'Facebook:post':        { min: 100,  max: 1800  },
  'Facebook:atualizacao': { min: 50,   max: 500   },
  'GMB:atualizacao':      { min: 50,   max: 1500  },
  'Blog:artigo':          { min: 800,  max: 5000  },
  'Email:newsletter':     { min: 200,  max: 3000  },
};

export function validateContent(
  content: string,
  hashtags: string[],
  channel: ContentChannel,
  format?: string,
): ContentQuality {
  const checks: QualityCheck[] = [];
  const key = format ? `${channel}:${format}` : channel;
  const limits = CONTENT_LIMITS[key] ?? { min: 50, max: 5000 };
  const [minHt, maxHt] = HASHTAG_RANGE[channel];

  // 1. Tamanho do conteúdo
  const len = content.length;
  const sizeOk = len >= limits.min && len <= limits.max;
  checks.push({
    label: 'Tamanho do texto',
    ok:    sizeOk,
    hint:  sizeOk ? undefined : `${len} chars — ideal: ${limits.min}–${limits.max}`,
  });

  // 2. Hashtags (só para canais que usam)
  if (maxHt > 0) {
    const htCount = hashtags.length;
    const htOk = htCount >= minHt && htCount <= maxHt;
    checks.push({
      label: 'Hashtags',
      ok:    htOk,
      hint:  htOk ? undefined : `${htCount} hashtags — ideal: ${minHt}–${maxHt}`,
    });
  }

  // 3. CTA presente
  const ctaPatterns = [
    /agendar?/i, /link na bio/i, /salve/i, /comente/i, /compartilhe/i,
    /marque/i, /clique/i, /acesse/i, /entre em contato/i, /whatsapp/i,
  ];
  const hasCtA = ctaPatterns.some((p) => p.test(content));
  checks.push({
    label: 'Call-to-action',
    ok:    hasCtA,
    hint:  hasCtA ? undefined : 'Adicione uma chamada para ação (ex: "Agende sua avaliação")',
  });

  // 4. Sem diagnósticos proibidos
  const bannedPhrases = [
    /você tem tdah/i, /você é autista/i, /você tem depressão/i,
    /diagnóstico confirm/i, /certeza que você/i,
  ];
  const hasBanned = bannedPhrases.some((p) => p.test(content));
  checks.push({
    label: 'Conformidade ética',
    ok:    !hasBanned,
    hint:  hasBanned ? 'Texto contém possível diagnóstico indevido — revise' : undefined,
  });

  // 5. Instagram: hook nos primeiros 125 chars
  if (channel === 'Instagram') {
    const hook = content.slice(0, 125);
    const hookOk = hook.trim().length >= 30 && !hook.startsWith('#');
    checks.push({
      label: 'Hook inicial (Instagram)',
      ok:    hookOk,
      hint:  hookOk ? undefined : 'Os primeiros 125 chars devem ter um gancho forte, sem hashtags',
    });
  }

  const passed = checks.filter((c) => !c.ok).length === 0;
  const score  = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return { score, checks, passed };
}

// ─────────────────────────────────────────────
// Orquestrador — gera com contexto completo
// ─────────────────────────────────────────────

export interface GeneratedContentWithQuality extends GeneratedContent {
  quality: ContentQuality;
}

export async function generateWithContext(
  topic: string,
  channel: ContentChannel,
  tone: ContentTone,
  instagramFormat?: InstagramFormat,
): Promise<GeneratedContentWithQuality> {
  // Ferramenta 1: busca contexto de posts recentes para evitar repetição
  const recentTopics = await getRecentTopics(channel);

  // Gera conteúdo com contexto injetado no prompt
  const generated = await generateContent(topic, channel, tone, instagramFormat, recentTopics);

  // Ferramenta 2: valida qualidade automaticamente
  const quality = validateContent(
    generated.content,
    generated.hashtags,
    channel,
    instagramFormat ?? (channel === 'Instagram' ? 'post' : undefined),
  );

  return { ...generated, quality };
}
