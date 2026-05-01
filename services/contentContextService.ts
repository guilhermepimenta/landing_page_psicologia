/**
 * Camada de agente contextual para geração de conteúdo.
 *
 * Ferramentas disponíveis:
 *   1. getRecentTopics       — posts recentes do canal (evita repetição)
 *   2. getCachedTrends       — tendências em alta (cache 2h, timeout 12s)
 *   3. validateContent       — score de qualidade 0–100
 *   4. getTopEngagingTopics  — temas com maior engajamento histórico
 *   5. generateWithContext   — orquestra 1+2+3 em uma única chamada
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
import { runTrendScout } from './trendScoutService';

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
// Ferramenta 2 — Tendências em alta (com cache)
// ─────────────────────────────────────────────

const TREND_CACHE_KEY = 'contentContext_trends';
const TREND_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 horas em ms
const TREND_FETCH_TIMEOUT = 12_000; // 12s — não bloqueia a geração

interface TrendCache {
  topics: string[];
  cachedAt: number;
}

function loadCachedTrends(): string[] | null {
  try {
    const raw = localStorage.getItem(TREND_CACHE_KEY);
    if (!raw) return null;
    const cache: TrendCache = JSON.parse(raw);
    if (Date.now() - cache.cachedAt > TREND_CACHE_TTL) return null;
    return cache.topics;
  } catch {
    return null;
  }
}

function saveTrendCache(topics: string[]): void {
  try {
    const cache: TrendCache = { topics, cachedAt: Date.now() };
    localStorage.setItem(TREND_CACHE_KEY, JSON.stringify(cache));
  } catch { /* localStorage pode estar indisponível */ }
}

export async function getCachedTrends(): Promise<string[]> {
  const cached = loadCachedTrends();
  if (cached) return cached;

  try {
    const result = await Promise.race([
      runTrendScout(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), TREND_FETCH_TIMEOUT),
      ),
    ]);
    const topics = result.suggestions.map((s) => s.topic).filter(Boolean);
    saveTrendCache(topics);
    return topics;
  } catch {
    // Timeout ou erro — não bloqueia a geração, retorna vazio
    return [];
  }
}

// ─────────────────────────────────────────────
// Ferramenta 3 — Validação de qualidade
// ─────────────────────────────────────────────

export interface ContentQuality {
  score: number;    // 0–100
  checks: QualityCheck[];
  passed: boolean;  // true se score >= 70
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
  'Instagram:post':       { min: 100,  max: 2200 },
  'Instagram:carrossel':  { min: 200,  max: 3000 },
  'Instagram:reels':      { min: 100,  max: 1500 },
  'Facebook:post':        { min: 100,  max: 1800 },
  'Facebook:atualizacao': { min: 50,   max: 500  },
  'GMB:atualizacao':      { min: 50,   max: 1500 },
  'Blog:artigo':          { min: 800,  max: 5000 },
  'Email:newsletter':     { min: 200,  max: 3000 },
};

export function validateContent(
  content: string,
  hashtags: string[],
  channel: ContentChannel,
  format?: string,
): ContentQuality {
  const checks: QualityCheck[] = [];
  const key    = format ? `${channel}:${format}` : channel;
  const limits = CONTENT_LIMITS[key] ?? { min: 50, max: 5000 };
  const [minHt, maxHt] = HASHTAG_RANGE[channel];

  // 1. Tamanho
  const len    = content.length;
  const sizeOk = len >= limits.min && len <= limits.max;
  checks.push({
    label: 'Tamanho do texto',
    ok:    sizeOk,
    hint:  sizeOk ? undefined : `${len} chars — ideal: ${limits.min}–${limits.max}`,
  });

  // 2. Hashtags (canais que usam)
  if (maxHt > 0) {
    const htCount = hashtags.length;
    const htOk    = htCount >= minHt && htCount <= maxHt;
    checks.push({
      label: 'Hashtags',
      ok:    htOk,
      hint:  htOk ? undefined : `${htCount} hashtags — ideal: ${minHt}–${maxHt}`,
    });
  }

  // 3. CTA
  const ctaPatterns = [
    /agendar?/i, /link na bio/i, /salve/i, /comente/i, /compartilhe/i,
    /marque/i, /clique/i, /acesse/i, /entre em contato/i, /whatsapp/i,
  ];
  const hasCta = ctaPatterns.some((p) => p.test(content));
  checks.push({
    label: 'Call-to-action',
    ok:    hasCta,
    hint:  hasCta ? undefined : 'Adicione uma chamada para ação (ex: "Agende sua avaliação")',
  });

  // 4. Conformidade ética
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

  // 5. Hook Instagram (primeiros 125 chars)
  if (channel === 'Instagram') {
    const hook   = content.slice(0, 125);
    const hookOk = hook.trim().length >= 30 && !hook.startsWith('#');
    checks.push({
      label: 'Hook inicial (Instagram)',
      ok:    hookOk,
      hint:  hookOk ? undefined : 'Os primeiros 125 chars devem ter um gancho forte, sem hashtags',
    });
  }

  const passed = checks.every((c) => c.ok);
  const score  = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return { score, checks, passed };
}

// ─────────────────────────────────────────────
// Ferramenta 4 — Temas mais engajados por canal
// ─────────────────────────────────────────────

export interface EngagingTopic {
  title: string;
  engagement: number;
  format?: string;
}

export async function getTopEngagingTopics(
  channel: ContentChannel,
  limitCount = 6,
): Promise<EngagingTopic[]> {
  try {
    const q = query(
      collection(db, 'posts'),
      where('channel', '==', channel),
      where('status', '==', 'published'),
      orderBy('engagement', 'desc'),
      limit(limitCount),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({
        title:      String(d.data().title ?? ''),
        engagement: Number(d.data().engagement ?? 0),
        format:     d.data().format as string | undefined,
      }))
      .filter((t) => t.title && t.engagement > 0);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// Orquestrador — gera com contexto completo
// ─────────────────────────────────────────────

export interface GeneratedContentWithQuality extends GeneratedContent {
  quality: ContentQuality;
  usedTrends: boolean;
}

export async function generateWithContext(
  topic: string,
  channel: ContentChannel,
  tone: ContentTone,
  instagramFormat?: InstagramFormat,
): Promise<GeneratedContentWithQuality> {
  // Ferramentas 1 e 2 em paralelo — nenhuma bloqueia a outra
  const [recentTopics, trendTopics] = await Promise.all([
    getRecentTopics(channel),
    getCachedTrends(),
  ]);

  const usedTrends = trendTopics.length > 0;

  // Gera com contexto completo injetado no prompt
  const generated = await generateContent(
    topic,
    channel,
    tone,
    instagramFormat,
    recentTopics,
    trendTopics,
  );

  // Ferramenta 3 — valida qualidade
  const quality = validateContent(
    generated.content,
    generated.hashtags,
    channel,
    instagramFormat ?? (channel === 'Instagram' ? 'post' : undefined),
  );

  return { ...generated, quality, usedTrends };
}
