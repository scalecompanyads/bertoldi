'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidCpf, normalizeCpfDigits } from '@/lib/cpf'

function supabaseConnectionError(message?: string) {
  if (!message) return null
  if (/fetch failed|enotfound|econnrefused|network/i.test(message)) {
    return 'Não foi possível conectar ao Supabase. Verifique NEXT_PUBLIC_SUPABASE_URL e as chaves no .env.local e reinicie o servidor.'
  }
  return null
}

export async function loginAsCliente(identifier: string, password: string) {
  const trimmed = identifier.trim()
  if (!trimmed || !password) {
    return { error: 'Informe CPF (ou e-mail) e senha.' }
  }

  let email: string | null = null

  if (trimmed.includes('@')) {
    email = trimmed.toLowerCase()
  } else {
    const cpf = normalizeCpfDigits(trimmed)
    if (!isValidCpf(cpf)) {
      return { error: 'CPF inválido.' }
    }

    const admin = createAdminClient()
    const { data, error } = await admin.rpc('get_cliente_auth_email', { cpf_input: cpf })

    if (error) {
      return {
        error:
          supabaseConnectionError(error.message) ??
          'Não foi possível verificar o CPF. Tente novamente.',
      }
    }

    email = data ?? null
  }

  if (!email) {
    return { error: 'CPF não encontrado ou acesso ainda não liberado pelo escritório.' }
  }

  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return {
      error:
        supabaseConnectionError(authError?.message) ?? 'CPF ou senha incorretos.',
    }
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('papel')
    .eq('id', authData.user.id)
    .single()

  if (!usuario || usuario.papel !== 'cliente') {
    await supabase.auth.signOut()
    return { error: 'Esta conta não é de cliente. Use a aba Equipe para entrar.' }
  }

  return { ok: true as const }
}
