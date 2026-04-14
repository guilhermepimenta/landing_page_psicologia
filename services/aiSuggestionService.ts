export interface AISuggestion {
  topic: string;
  channel: 'Instagram' | 'GMB' | 'Blog' | 'Email';
  bestDay: string;
  bestHour: string;
  postFormat: string;
  rationale: string;
  cta: string;
  confidence: number;
  source: 'ai' | 'heuristic';
  generatedAt: string;
}

export async function getAISuggestion(): Promise<AISuggestion> {
  const res = await fetch('/api/analytics?mode=suggestion');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.success || !data.suggestion) {
    throw new Error(data?.error ?? 'Erro ao gerar sugestao inteligente');
  }

  return data.suggestion as AISuggestion;
}
