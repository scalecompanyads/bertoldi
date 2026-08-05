'use server'

import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidCpf, normalizeCpfDigits } from '@/lib/cpf'
import { consumirRateLimit } from '@/lib/rate-limit'
import { getAuthCallbackUrl } from '@/lib/site-url'

const MENSAGEM_SUCESSO =
  'Se existir uma conta com esses dados, você receberá um e-mail em instantes com instruções para redefinir a senha. Verifique também a caixa de spam.'

const LIMITE_POR_IP = 5
const LIMITE_POR_IDENT = 3
const JANELA_MS = 15 * 60 * 1000

function hashIdentificador(valor: string) {
  return createHash('sha256').update(valor.toLowerCase().trim()).digest('hex').slice(0, 16)
}

async function atrasoConstante() {
  await new Promise((r) => setTimeout(r, 700 + Math.floor(Math.random() * 300)))
}

async function resolverEmail(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim()
  if (!trimmed) return null

  if (trimmed.includes('@')) {
    const email = trimmed.toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
    return email
  }

  const cpf = normalizeCpfDigits(trimmed)
  if (!isValidCpf(cpf)) return null

  const admin = createAdminClient()
  const { data } = await admin.rpc('get_cliente_auth_email', { cpf_input: cpf })
  return data ?? null
}

async function contaExiste(email: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin.from('usuarios').select('id').eq('email', email).maybeSingle()
  return Boolean(data)
}

export async function solicitarRecuperacaoSenha(
  identifier: string,
  honeypot?: string
): Promise<{ ok: true; message: string } | { error: string }> {
  // Campo oculto — bots preenchem; respondemos igual para não revelar a armadilha
  if (honeypot?.trim()) {
    await atrasoConstante()
    return { ok: true, message: MENSAGEM_SUCESSO }
  }

  const hdrs = await headers()
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    hdrs.get('x-real-ip')?.trim() ||
    'desconhecido'

  if (!consumirRateLimit(`rec-senha:ip:${ip}`, LIMITE_POR_IP, JANELA_MS)) {
    await atrasoConstante()
    return {
      error: 'Muitas tentativas. Aguarde alguns minutos antes de solicitar novamente.',
    }
  }

  const email = await resolverEmail(identifier)
  if (!email) {
    await atrasoConstante()
    return { ok: true, message: MENSAGEM_SUCESSO }
  }

  if (!consumirRateLimit(`rec-senha:id:${hashIdentificador(email)}`, LIMITE_POR_IDENT, JANELA_MS)) {
    await atrasoConstante()
    return { ok: true, message: MENSAGEM_SUCESSO }
  }

  const existe = await contaExiste(email)
  if (existe) {
    const admin = createAdminClient()
    const redirectTo = getAuthCallbackUrl('/auth/definir-senha')
    await admin.auth.resetPasswordForEmail(email, { redirectTo })
  }

  await atrasoConstante()
  return { ok: true, message: MENSAGEM_SUCESSO }
}
