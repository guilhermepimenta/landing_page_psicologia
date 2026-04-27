export interface AdsCampaign {
  name: string;
  spend: number;
}

export interface AdsSpendResult {
  spend: number;
  month: string;
  currency: string;
  campaigns: AdsCampaign[];
  configured: boolean;
  error?: string;
}

export const adsService = {
  async getGoogleAdsSpend(month: string): Promise<AdsSpendResult> {
    try {
      const res = await fetch(`/api/google-ads?month=${month}`);
      const data = await res.json();
      if (data.configured === false) return { spend: 0, month, currency: 'BRL', campaigns: [], configured: false };
      if (!res.ok) return { spend: 0, month, currency: 'BRL', campaigns: [], configured: true, error: data.error };
      return { ...data, configured: true };
    } catch (err: any) {
      return { spend: 0, month, currency: 'BRL', campaigns: [], configured: true, error: err.message };
    }
  },

  async getMetaAdsSpend(month: string): Promise<AdsSpendResult> {
    try {
      const res = await fetch(`/api/meta-ads?month=${month}`);
      const data = await res.json();
      if (data.configured === false) return { spend: 0, month, currency: 'BRL', campaigns: [], configured: false };
      if (!res.ok) return { spend: 0, month, currency: 'BRL', campaigns: [], configured: true, error: data.error };
      return { ...data, configured: true };
    } catch (err: any) {
      return { spend: 0, month, currency: 'BRL', campaigns: [], configured: true, error: err.message };
    }
  },

  async getAllAdsSpend(month: string): Promise<{ google: AdsSpendResult; meta: AdsSpendResult }> {
    const [google, meta] = await Promise.all([
      this.getGoogleAdsSpend(month),
      this.getMetaAdsSpend(month),
    ]);
    return { google, meta };
  },
};
