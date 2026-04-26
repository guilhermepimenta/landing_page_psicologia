import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/resend-lead
 * Envia e-mail personalizado ao lead via Resend.
 * Usa RESEND_API_KEY e REPORT_EMAIL_FROM já configurados no Vercel.
 */

const RANGE_LABELS: Record<string, string> = {
  low: 'Pontuação Baixa',
  moderate: 'Pontuação Moderada',
  high: 'Pontuação Elevada',
};

const RANGE_COLORS: Record<string, string> = {
  low: '#059669',
  moderate: '#d97706',
  high: '#dc2626',
};

const TEST_SUBJECTS: Record<string, Record<string, string>> = {
  tdah: {
    low: 'Seu resultado: Rastreio de TDAH — pontuação baixa',
    moderate: 'Seu resultado: Rastreio de TDAH — alguns sinais presentes',
    high: 'Seu resultado: Rastreio de TDAH — pontuação elevada',
  },
  tea: {
    low: 'Seu resultado: Rastreio de TEA — pontuação baixa',
    moderate: 'Seu resultado: Rastreio de TEA — alguns traços presentes',
    high: 'Seu resultado: Rastreio de TEA — pontuação elevada',
  },
  depressao: {
    low: 'Seu resultado: Rastreio de Depressão — pontuação baixa',
    moderate: 'Seu resultado: Rastreio de Depressão — sintomas moderados',
    high: 'Seu resultado: Rastreio de Depressão — atenção recomendada',
  },
  ansiedade: {
    low: 'Seu resultado: Rastreio de Ansiedade — pontuação baixa',
    moderate: 'Seu resultado: Rastreio de Ansiedade — ansiedade moderada',
    high: 'Seu resultado: Rastreio de Ansiedade — ansiedade intensa',
  },
  contact_form: {
    default: 'Recebemos sua mensagem — Fernanda Mangia Psicologia',
  },
};

const TEST_NEXT_STEPS: Record<string, Record<string, string>> = {
  tdah: {
    low: 'Se atenção ou organização ainda impactam sua rotina, uma conversa pode ajudar a entender melhor.',
    moderate: 'Uma avaliação neuropsicológica pode esclarecer se esses sintomas têm impacto funcional na sua vida.',
    high: 'O próximo passo recomendado é uma avaliação neuropsicológica para um diagnóstico preciso.',
  },
  tea: {
    low: 'Se você tem dúvidas sobre funcionamento social ou sensorial, podemos investigar juntos.',
    moderate: 'Uma avaliação mais detalhada pode ajudar a entender melhor seu perfil de funcionamento.',
    high: 'Uma avaliação neuropsicológica é recomendada para investigar com mais precisão.',
  },
  depressao: {
    low: 'Se seu bem-estar emocional poderia melhorar, a terapia oferece ferramentas práticas e eficazes.',
    moderate: 'Trabalhar esses sintomas com apoio profissional costuma trazer resultados bastante positivos.',
    high: 'Buscar acompanhamento profissional é importante — estou disponível para te ajudar.',
  },
  ansiedade: {
    low: 'Se o estresse do dia a dia está pesado, a terapia pode oferecer ferramentas práticas.',
    moderate: 'Trabalhar a ansiedade na terapia com TCC costuma trazer resultados muito positivos.',
    high: 'Buscar acompanhamento profissional é fundamental — trabalho especificamente com ansiedade usando TCC.',
  },
};

function buildTestResultEmail(data: {
  name: string;
  testTitle: string;
  testId: string;
  testScore: number;
  testMaxScore: number;
  testRange: string;
  resultMessage: string;
}): { html: string; text: string } {
  const rangeLabel = RANGE_LABELS[data.testRange] ?? data.testRange;
  const rangeColor = RANGE_COLORS[data.testRange] ?? '#6b7280';
  const nextStep = TEST_NEXT_STEPS[data.testId]?.[data.testRange] ?? '';

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#4A5D4A,#6b8f6b);padding:32px 40px;text-align:center;">
          <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Fernanda Mangia · Psicóloga e Neuropsicóloga</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">${data.testTitle}</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 24px;color:#374151;font-size:16px;">Olá, <strong>${data.name}</strong>!</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
            Obrigada por realizar o rastreio. Aqui está o seu resultado:
          </p>

          <!-- Score card -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid ${rangeColor};border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${rangeColor};">${rangeLabel}</p>
            <p style="margin:0;font-size:28px;font-weight:800;color:#111827;">${data.testScore} <span style="font-size:15px;font-weight:400;color:#9ca3af;">/ ${data.testMaxScore} pontos</span></p>
          </div>

          <!-- Result message -->
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;background:#f0fdf4;border-radius:12px;padding:18px 20px;">
            ${data.resultMessage}
          </p>

          <!-- Next step -->
          ${nextStep ? `<p style="margin:0 0 32px;color:#6b7280;font-size:14px;line-height:1.6;font-style:italic;">${nextStep}</p>` : ''}

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:32px;">
            <a href="https://wa.me/5521973138289" style="display:inline-block;background:#4A5D4A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;">
              Conversar com a Fernanda
            </a>
          </div>

          <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
            Este resultado é uma ferramenta de triagem e <strong>não substitui avaliação clínica</strong>.<br>
            Apenas um profissional pode realizar um diagnóstico.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            Fernanda Mangia · Psicóloga e Neuropsicóloga · Niterói e Nova Friburgo, RJ<br>
            <a href="https://psicologafernandamangia.com.br" style="color:#4A5D4A;text-decoration:none;">psicologafernandamangia.com.br</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Olá, ${data.name}!\n\n${data.testTitle}\nResultado: ${rangeLabel} — ${data.testScore}/${data.testMaxScore} pontos\n\n${data.resultMessage}\n\n${nextStep}\n\nConversar com a Fernanda: https://wa.me/5521973138289\n\n---\nFernanda Mangia · Psicóloga e Neuropsicóloga\npsicologafernandamangia.com.br`;

  return { html, text };
}

function buildContactFormEmail(name: string): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#4A5D4A,#6b8f6b);padding:32px 40px;text-align:center;">
          <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Fernanda Mangia · Psicóloga e Neuropsicóloga</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Mensagem recebida!</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 20px;color:#374151;font-size:16px;">Olá, <strong>${name}</strong>!</p>
          <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.7;">
            Recebemos sua mensagem e retornaremos em até <strong>24 horas</strong>.
          </p>
          <p style="margin:0 0 32px;color:#6b7280;font-size:15px;line-height:1.7;">
            Se preferir um retorno mais rápido, pode me chamar diretamente pelo WhatsApp:
          </p>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="https://wa.me/5521973138289" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;">
              Falar pelo WhatsApp
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            Fernanda Mangia · Psicóloga e Neuropsicóloga · Niterói e Nova Friburgo, RJ<br>
            <a href="https://psicologafernandamangia.com.br" style="color:#4A5D4A;text-decoration:none;">psicologafernandamangia.com.br</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Olá, ${name}!\n\nRecebemos sua mensagem e retornaremos em até 24 horas.\n\nSe preferir, fale pelo WhatsApp: https://wa.me/5521973138289\n\n---\nFernanda Mangia · Psicóloga e Neuropsicóloga`;

  return { html, text };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_EMAIL_FROM || 'onboarding@resend.dev';

  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY não configurado' });
  }

  const body = req.body ?? {};
  const { name, email, source } = body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name e email são obrigatórios' });
  }

  try {
    let subject: string;
    let html: string;
    let text: string;

    if (source === 'contact_form') {
      subject = TEST_SUBJECTS.contact_form.default;
      ({ html, text } = buildContactFormEmail(name));
    } else {
      const { testTitle, testId, testScore, testMaxScore, testRange, resultMessage } = body;
      subject = TEST_SUBJECTS[testId]?.[testRange] ?? `Seu resultado: ${testTitle}`;
      ({ html, text } = buildTestResultEmail({ name, testTitle, testId, testScore, testMaxScore, testRange, resultMessage }));
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [email], subject, html, text }),
    });

    const data = (await response.json()) as any;
    if (!response.ok) throw new Error(data.message ?? `Resend error ${response.status}`);

    return res.status(200).json({ success: true, emailId: data.id });
  } catch (e: any) {
    console.error('Resend lead email error:', e);
    return res.status(502).json({ success: false, error: e.message });
  }
}
