import React, { useState, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface CheckResult {
  ok: boolean;
  label: string;
  detail: string;
  hint?: string;
  vars: string[];
}

interface HealthResponse {
  status: 'ok' | 'degraded';
  checkedAt: string;
  checks: CheckResult[];
}

const LINKS: Record<string, { label: string; url: string }> = {
  'Google Analytics 4': {
    label: 'Abrir GA4 Admin',
    url: 'https://analytics.google.com',
  },
  'Google Ads (via GA4)': {
    label: 'Integrações GA4 → Google Ads',
    url: 'https://analytics.google.com',
  },
  'Meta Ads': {
    label: 'Meta Business Manager',
    url: 'https://business.facebook.com',
  },
  'Firebase Admin (Firestore)': {
    label: 'Firebase Console',
    url: 'https://console.firebase.google.com',
  },
};

const DiagnosticsPanel: React.FC = () => {
  const [data, setData]       = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok && res.status !== 207) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json() as HealthResponse;
      setData(json);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao chamar /api/health');
    } finally {
      setLoading(false);
    }
  }, []);

  const allOk  = data?.checks.every(c => c.ok) ?? false;
  const okCount = data?.checks.filter(c => c.ok).length ?? 0;
  const total   = data?.checks.length ?? 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>🔍</span> Diagnóstico de Integrações
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Verifica em tempo real se GA4, Google Ads, Meta Ads e Firebase estão conectados corretamente.
            </p>
          </div>
          <button
            onClick={runCheck}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shrink-0"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Verificando...' : 'Executar verificação'}
          </button>
        </div>

        {data && (
          <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold ${allOk ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            {allOk
              ? <><CheckCircle size={16} className="text-green-600" /> Todas as {total} integrações estão funcionando</>
              : <><AlertCircle size={16} className="text-amber-600" /> {okCount} de {total} integrações funcionando — veja os problemas abaixo</>
            }
            <span className="ml-auto text-xs font-normal text-gray-400">
              Verificado às {new Date(data.checkedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
            <p className="font-semibold">Erro ao chamar /api/health</p>
            <p className="mt-1 text-red-700">{error}</p>
            <p className="mt-2 text-xs text-red-500">
              Certifique-se de que o projeto está deployado no Vercel. Essa verificação não funciona no ambiente local (Vite dev).
            </p>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500 text-center">
            Clique em "Executar verificação" para diagnosticar as integrações.
          </div>
        )}
      </div>

      {/* Resultado de cada integração */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.checks.map((check) => {
            const link = LINKS[check.label];
            return (
              <div
                key={check.label}
                className={`bg-white rounded-xl shadow-sm border p-5 ${check.ok ? 'border-green-200' : 'border-red-200'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {check.ok
                      ? <CheckCircle size={20} className="text-green-500" />
                      : <XCircle size={20} className="text-red-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className={`text-sm font-bold ${check.ok ? 'text-green-800' : 'text-red-800'}`}>
                        {check.label}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${check.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {check.ok ? 'OK' : 'ERRO'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mt-1.5">{check.detail}</p>

                    {check.hint && (
                      <div className="mt-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800 font-semibold mb-0.5">Como resolver:</p>
                        <p className="text-xs text-amber-700">{check.hint}</p>
                      </div>
                    )}

                    {check.vars.length > 0 && (
                      <div className="mt-2.5">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Variáveis necessárias</p>
                        <div className="flex flex-wrap gap-1">
                          {check.vars.map(v => (
                            <code key={v} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${check.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                              {v}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}

                    {link && (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-xs text-purple-600 hover:text-purple-800 underline"
                      >
                        <ExternalLink size={11} />
                        {link.label}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Instruções gerais */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4">Onde configurar as variáveis de ambiente</h3>
        <ol className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">1</span>
            <span>Acesse o <strong>Vercel Dashboard</strong> → seu projeto → <strong>Settings → Environment Variables</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">2</span>
            <span>Adicione ou atualize as variáveis indicadas em cada integração com erro acima</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">3</span>
            <span>Para <strong>GA4_PRIVATE_KEY</strong>: cole a chave privada com <code className="bg-gray-100 px-1 rounded text-xs">\n</code> literais (não quebras de linha). O Vercel preserva o formato automaticamente.</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">4</span>
            <span>Após salvar as variáveis, faça um novo <strong>deploy</strong> (ou clique em "Redeploy") para que as mudanças entrem em vigor</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">5</span>
            <span>Execute a verificação novamente para confirmar que está tudo verde</span>
          </li>
        </ol>

        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
          <p className="font-semibold text-blue-800 mb-1">Sobre o Google Ads (R$0)</p>
          <p className="text-blue-700">
            O Google Ads não tem uma API direta — os dados de gasto são buscados via <strong>GA4 Data API</strong> com a métrica <code className="bg-blue-100 px-1 rounded text-xs">advertiserAdCost</code>.
            Para funcionar, o Google Ads precisa estar vinculado à propriedade GA4:
            <strong> GA4 → Admin → Integrações de produtos → Google Ads → Vincular</strong>.
            Sem esse vínculo, a métrica não existe na propriedade e retorna R$0 sem erro.
          </p>
        </div>

        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <p className="font-semibold text-amber-800 mb-1">Sobre Meta Ads (R$0)</p>
          <p className="text-amber-700">
            Se o token Meta Ads está configurado mas retorna R$0, pode ser que não há campanhas ativas no mês selecionado,
            ou o token expirou. Tokens de usuário expiram em ~60 dias — use um <strong>System User Token</strong> que não expira.
            Vá em Meta Business Manager → Configurações → Usuários do Sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsPanel;
