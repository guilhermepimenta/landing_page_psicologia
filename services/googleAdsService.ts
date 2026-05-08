export interface GAdsCampaign {
  id: string;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  channelType: string;
  dailyBudgetBRL: string | null;
}

export interface GAdsCampaignsResult {
  campaigns: GAdsCampaign[];
  connected: boolean;
  error?: string;
}

export const googleAdsService = {
  async getAuthUrl(): Promise<string> {
    const res = await fetch('/api/gads-campaigns?action=auth');
    if (!res.ok) throw new Error('Falha ao obter URL de autenticação.');
    const data = await res.json();
    return data.url as string;
  },

  async getCampaigns(): Promise<GAdsCampaignsResult> {
    try {
      const res = await fetch('/api/gads-campaigns');
      if (res.status === 401) return { campaigns: [], connected: false };
      const data = await res.json();
      if (!res.ok) return { campaigns: [], connected: true, error: data.error ?? 'Erro desconhecido.' };
      return { campaigns: data.campaigns ?? [], connected: true };
    } catch (err: any) {
      return { campaigns: [], connected: false, error: err.message };
    }
  },

  async updateStatus(campaignId: string, status: 'ENABLED' | 'PAUSED'): Promise<void> {
    const res = await fetch('/api/gads-campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Erro ao atualizar status da campanha.');
    }
  },
};
