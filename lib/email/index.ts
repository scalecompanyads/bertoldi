// Envio de e-mails via Resend (https://resend.com) — API HTTP direta, sem SDK.
// Sem RESEND_API_KEY configurada, todo envio é pulado silenciosamente: o sistema
// funciona normalmente, apenas sem notificações por e-mail.

const RESEND_URL = 'https://api.resend.com/emails'

export function emailConfigurado(): boolean {
  return !!process.env.RESEND_API_KEY
}

function remetente(): string {
  return process.env.EMAIL_FROM || 'Bertoldi Advocacia <onboarding@resend.dev>'
}

export interface EnvioResult {
  ok: boolean
  pulado?: boolean
  erro?: string
}

export async function enviarEmail(params: {
  para: string | string[]
  assunto: string
  html: string
}): Promise<EnvioResult> {
  if (!emailConfigurado()) return { ok: false, pulado: true }

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: remetente(),
        to: Array.isArray(params.para) ? params.para : [params.para],
        subject: params.assunto,
        html: params.html,
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[email] Resend retornou ${res.status}: ${body.slice(0, 300)}`)
      return { ok: false, erro: `Resend retornou ${res.status}` }
    }

    return { ok: true }
  } catch (err) {
    const erro = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[email] Falha no envio:', erro)
    return { ok: false, erro }
  }
}

export function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Layout padrão dos e-mails do escritório — estilos inline (exigência de clientes de e-mail)
export function layoutEmail(titulo: string, corpoHtml: string, rodape?: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background-color:#18181b;padding:16px 24px;">
            <span style="color:#ffffff;font-size:15px;font-weight:bold;">Bertoldi Advocacia</span>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <h1 style="margin:0 0 16px;font-size:17px;color:#18181b;">${escapeHtml(titulo)}</h1>
            ${corpoHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;border-top:1px solid #e4e4e7;">
            <p style="margin:0;font-size:12px;color:#71717a;line-height:1.5;">
              ${rodape ?? 'E-mail automático — não responda. Em caso de dúvida, entre em contato com o escritório.'}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// Item de lista padrão usado nos digests
export function itemListaHtml(linha1: string, linha2?: string): string {
  return `<div style="padding:10px 12px;border:1px solid #e4e4e7;border-radius:6px;margin-bottom:8px;">
    <p style="margin:0;font-size:14px;color:#18181b;line-height:1.4;">${linha1}</p>
    ${linha2 ? `<p style="margin:4px 0 0;font-size:12px;color:#71717a;line-height:1.4;">${linha2}</p>` : ''}
  </div>`
}

export function botaoHtml(texto: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 4px;">
    <tr><td style="background-color:#18181b;border-radius:6px;">
      <a href="${url}" style="display:inline-block;padding:10px 20px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">${escapeHtml(texto)}</a>
    </td></tr>
  </table>`
}
