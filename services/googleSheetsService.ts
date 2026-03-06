/**
 * Google Sheets como ponte para dados do Google Analytics 4.
 *
 * Como funciona:
 * 1. No Google Sheets, instale o add-on "Google Analytics" e configure para exportar dados do GA4.
 * 2. Crie 3 abas com os nomes exatos: "metricas", "semanal", "mensal" (veja formato abaixo).
 * 3. Publique a planilha: Arquivo > Compartilhar > Publicar na web > Publicar.
 * 4. Copie o ID da URL da planilha e cole em VITE_GOOGLE_SHEETS_ID no .env.
 *
 * Formato esperado de cada aba:
 *
 * Aba "metricas" (linha 1 = cabeçalho):
 *   metrica            | valor | variacao
 *   taxa_engajamento   | 12.4  | 2.1
 *   alcance_total      | 5800  | 18
 *   leads              | 14    | 27
 *   taxa_conversao     | 35.7  | 5
 *
 * Aba "semanal" (linha 1 = cabeçalho):
 *   dia  | Instagram | GMB | Blog | Email
 *   Seg  | 180       | 45  | 12   | 8
 *   ...
 *
 * Aba "mensal" (linha 1 = cabeçalho):
 *   mes  | leads | conversoes
 *   Out  | 4     | 1
 *   ...
 */

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID as string | undefined;

export const isSheetsConfigured = Boolean(SHEET_ID);

export interface WeeklyRow {
  dia: string;
  Instagram: number;
  GMB: number;
  Blog: number;
  Email: number;
}

export interface MonthlyRow {
  mes: string;
  leads: number;
  conversoes: number;
}

export interface MetricRow {
  metrica: string;
  valor: number;
  variacao: number;
}

async function fetchSheetTab(tabName: string): Promise<Record<string, unknown>[]> {
  if (!SHEET_ID) throw new Error('VITE_GOOGLE_SHEETS_ID não configurado');

  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(SHEET_ID)}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro HTTP ${res.status} ao acessar a planilha`);

  const text = await res.text();

  // A resposta é JSONP no formato: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);\s*$/);
  if (!match) throw new Error('Formato de resposta inválido. Verifique se a planilha está publicada publicamente.');

  const parsed = JSON.parse(match[1]);
  if (parsed.status === 'error') {
    throw new Error(`Erro na planilha: ${parsed.errors?.[0]?.detailed_message ?? 'desconhecido'}`);
  }

  const { cols, rows } = parsed.table;
  const headers: string[] = cols.map((c: { label?: string; id?: string }) => c.label || c.id || '');

  return rows.map((row: { c: Array<{ v: unknown } | null> }) =>
    Object.fromEntries(
      headers.map((h, i) => [h, row.c[i]?.v ?? null])
    )
  );
}

export async function getWeeklyEngagement(): Promise<WeeklyRow[]> {
  const rows = await fetchSheetTab('semanal');
  return rows.map(r => ({
    dia: String(r['dia'] ?? ''),
    Instagram: Number(r['Instagram'] ?? 0),
    GMB: Number(r['GMB'] ?? 0),
    Blog: Number(r['Blog'] ?? 0),
    Email: Number(r['Email'] ?? 0),
  }));
}

export async function getMonthlyTrend(): Promise<MonthlyRow[]> {
  const rows = await fetchSheetTab('mensal');
  return rows.map(r => ({
    mes: String(r['mes'] ?? ''),
    leads: Number(r['leads'] ?? 0),
    conversoes: Number(r['conversoes'] ?? 0),
  }));
}

export async function getSummaryMetrics(): Promise<MetricRow[]> {
  const rows = await fetchSheetTab('metricas');
  return rows.map(r => ({
    metrica: String(r['metrica'] ?? ''),
    valor: Number(r['valor'] ?? 0),
    variacao: Number(r['variacao'] ?? 0),
  }));
}
