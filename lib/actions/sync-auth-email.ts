'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { emailValido, normalizarEmail } from '@/lib/email-utils'

/** Mantém auth.users e public.usuarios alinhados — necessário para login e envio de e-mails. */
export async function sincronizarEmailUsuario(
  userId: string,
  novoEmail: string
): Promise<{ ok: true } | { error: string }> {
  const email = normalizarEmail(novoEmail)
  if (!emailValido(email)) return { error: 'E-mail inválido.' }

  const admin = createAdminClient()

  const { data: atual } = await admin
    .from('usuarios')
    .select('email')
    .eq('id', userId)
    .maybeSingle()

  if (!atual) return { error: 'Usuário não encontrado.' }
  if (normalizarEmail(atual.email) === email) return { ok: true }

  const { data: emUso } = await admin
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .neq('id', userId)
    .maybeSingle()

  if (emUso) return { error: 'Este e-mail já está em uso por outra conta.' }

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    email,
    email_confirm: true,
  })

  if (authError) {
    return { error: `Não foi possível atualizar o e-mail de login: ${authError.message}` }
  }

  const { error: dbError } = await admin.from('usuarios').update({ email }).eq('id', userId)
  if (dbError) return { error: dbError.message }

  return { ok: true }
}
