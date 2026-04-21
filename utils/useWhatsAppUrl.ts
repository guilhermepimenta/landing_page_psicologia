import { useMemo } from 'react';

const WA_NUMBER = '5521971318289';

const CAMPAIGN_LABELS: Record<string, string> = {
  niteroi: 'Google Ads - Niterói',
  'nova-friburgo': 'Google Ads - Nova Friburgo',
  friburgo: 'Google Ads - Nova Friburgo',
  online: 'Google Ads - Online',
  nacional: 'Google Ads - Online',
};

function detectCampaignLabel(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source');
  const campaign = params.get('utm_campaign')?.toLowerCase() ?? '';
  const medium = params.get('utm_medium')?.toLowerCase() ?? '';

  if (!source && !campaign && !medium) return null;

  for (const [key, label] of Object.entries(CAMPAIGN_LABELS)) {
    if (campaign.includes(key)) return label;
  }

  if (source === 'google' || medium === 'cpc') return 'Google Ads';
  if (source === 'instagram' || source === 'facebook') return 'Instagram Ads';

  return `Campanha - ${campaign || source || medium}`;
}

export function useWhatsAppUrl(siteLabel: string, message?: string): string {
  return useMemo(() => {
    const campaignLabel = detectCampaignLabel();
    const prefix = campaignLabel ? `[${campaignLabel}]` : `[${siteLabel}]`;
    const text = message ?? `Olá Fernanda, vim pelo site e gostaria de agendar uma consulta.`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`${prefix} ${text}`)}`;
  }, [siteLabel, message]);
}

export function buildWhatsAppUrl(siteLabel: string, message?: string): string {
  const campaignLabel = detectCampaignLabel();
  const prefix = campaignLabel ? `[${campaignLabel}]` : `[${siteLabel}]`;
  const text = message ?? `Olá Fernanda, vim pelo site e gostaria de agendar uma consulta.`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`${prefix} ${text}`)}`;
}
