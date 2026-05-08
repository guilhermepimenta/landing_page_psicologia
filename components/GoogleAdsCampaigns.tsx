import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Play, Pause, Wifi, WifiOff } from 'lucide-react';
import { googleAdsService, GAdsCampaign } from '../services/googleAdsService';

const STATUS_LABELS: Record<string, string> = {
  ENABLED: 'Ativa',
  PAUSED: 'Pausada',
  REMOVED: 'Removida',
};

const STATUS_COLORS: Record<string, string> = {
  ENABLED: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  REMOVED: 'bg-red-100 text-red-800',
};

function formatBRL(value: string | null): string {
  if (!value) return '—';
  return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const GoogleAdsCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<GAdsCampaign[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await googleAdsService.getCampaigns();
    setConnected(result.connected);
    setCampaigns(result.campaigns);
    if (result.error) setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleConnect = async () => {
    try {
      const url = await googleAdsService.getAuthUrl();
      const popup = window.open(url, 'google-ads-oauth', 'width=520,height=640,left=200,top=100');

      const listener = (e: MessageEvent) => {
        if (e.data === 'google-ads-connected') {
          window.removeEventListener('message', listener);
          popup?.close();
          load();
        }
      };
      window.addEventListener('message', listener);

      const timer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(timer);
          window.removeEventListener('message', listener);
          load();
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggle = async (campaign: GAdsCampaign) => {
    setToggling(campaign.id);
    setError(null);
    try {
      const newStatus = campaign.status === 'ENABLED' ? 'PAUSED' : 'ENABLED';
      await googleAdsService.updateStatus(campaign.id, newStatus);
      setCampaigns(prev =>
        prev.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c)
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="animate-spin text-purple-500" size={24} />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
          <WifiOff size={28} className="text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-1">Google Ads não conectado</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Conecte sua conta para visualizar e gerenciar campanhas diretamente do dashboard.
          </p>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          onClick={handleConnect}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
        >
          Conectar Google Ads
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Wifi size={15} className="text-green-500" />
          <span className="text-sm font-medium text-green-700">Conta conectada</span>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition"
        >
          <RefreshCw size={13} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="mx-5 mt-4 bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      {campaigns.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-10">Nenhuma campanha ativa encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Campanha</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Orçamento/dia</th>
                <th className="px-5 py-3 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{c.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{formatBRL(c.dailyBudgetBRL)}</td>
                  <td className="px-5 py-3.5">
                    {c.status !== 'REMOVED' && (
                      <button
                        onClick={() => handleToggle(c)}
                        disabled={toggling === c.id}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition"
                      >
                        {toggling === c.id ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : c.status === 'ENABLED' ? (
                          <><Pause size={11} /> Pausar</>
                        ) : (
                          <><Play size={11} /> Ativar</>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GoogleAdsCampaigns;
