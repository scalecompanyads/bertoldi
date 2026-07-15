'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertEquipe } from '@/lib/actions/assert-equipe'
import { isValidCpf, normalizeCpfDigits } from '@/lib/cpf'
import { getAuthCallbackUrl } from '@/lib/site-url'
import { revalidatePath } from 'next/cache'

export type ConviteResult =
  | { ok: true; message: string; linkConvite?: string; emailEnviado: boolean }
  | { error: string }

function validarDadosAcesso(
  email: string | null,
  cpf_cnpj: string | null
): { error: string } | { ok: true; email: string } {
  if (!email?.trim()) {
    return { error: 'E-mail é obrigatório para liberar acesso.' }
  }

  const cpf = normalizeCpfDigits(cpf_cnpj ?? '')
  if (cpf.length !== 11 || !isValidCpf(cpf)) {
    return { error: 'CPF válido é obrigatório para o cliente entrar com CPF.' }
  }

  return { ok: true, email: email.trim().toLowerCase() }
}

async function emailEmUsoPorEquipe(admin: ReturnType<typeof createAdminClient>, email: string) {
  const { data } = await admin
    .from('usuarios')
    .select('papel')
    .eq('email', email)
    .maybeSingle()

  return Boolean(data && data.papel !== 'cliente')
}

async function vincularClienteAoUsuario(
  admin: ReturnType<typeof createAdminClient>,
  clienteId: string,
  userId: string,
  equipeUserId: string
) {
  const { error } = await admin
    .from('clientes')
    .update({
      usuario_id: userId,
      atualizado_em: new Date().toISOString(),
      atualizado_por: equipeUserId,
    })
    .eq('id', clienteId)

  return error
}

/** Tenta enviar e-mail via Supabase Auth (pode falhar se SMTP/rate limit). */
async function tentarEnviarEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  redirectTo: string,
  conviteNovo: boolean
): Promise<boolean> {
  if (conviteNovo) {
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { papel: 'cliente' },
    })
    return !error
  }

  const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo })
  return !error
}

/** Cria/vincula conta Auth e gera link para o cliente definir senha. */
export async function enviarConviteAcesso(clienteId: string): Promise<ConviteResult> {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  const { data: cliente, error: fetchError } = await admin
    .from('clientes')
    .select('id, nome, email, cpf_cnpj, usuario_id')
    .eq('id', clienteId)
    .single()

  if (fetchError || !cliente) {
    return { error: 'Cliente não encontrado.' }
  }

  const validacao = validarDadosAcesso(cliente.email, cliente.cpf_cnpj)
  if ('error' in validacao) {
    return { error: validacao.error }
  }

  const email = validacao.email

  if (await emailEmUsoPorEquipe(admin, email)) {
    return { error: 'Este e-mail já pertence a um usuário da equipe. Use outro e-mail para o cliente.' }
  }

  const redirectTo = getAuthCallbackUrl('/auth/definir-senha')
  const conviteNovo = !cliente.usuario_id

  const { data: linkData, error: linkError } = conviteNovo
    ? await admin.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          redirectTo,
          data: { nome: cliente.nome, papel: 'cliente' },
        },
      })
    : await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo },
      })

  if (linkError || !linkData.user) {
    return {
      error: linkError?.message ?? 'Não foi possível criar a conta de acesso do cliente.',
    }
  }

  const linkErrorDb = await vincularClienteAoUsuario(
    admin,
    clienteId,
    linkData.user.id,
    auth.userId
  )

  if (linkErrorDb) {
    return { error: `Conta criada, mas falha ao vincular: ${linkErrorDb.message}` }
  }

  const actionLink = linkData.properties?.action_link
  const emailEnviado = await tentarEnviarEmail(admin, email, redirectTo, conviteNovo)

  revalidatePath(`/admin/clientes/${clienteId}`)

  if (emailEnviado) {
    return {
      ok: true,
      emailEnviado: true,
      message: conviteNovo
        ? 'Convite enviado! O cliente receberá um e-mail para criar a senha.'
        : 'E-mail reenviado para definir ou redefinir a senha.',
    }
  }

  if (!actionLink) {
    return {
      ok: true,
      emailEnviado: false,
      message: 'Conta criada, mas não foi possível gerar o link de acesso.',
    }
  }

  return {
    ok: true,
    emailEnviado: false,
    linkConvite: actionLink,
    message: conviteNovo
      ? 'Conta criada. Copie o link abaixo e envie ao cliente (e-mail automático indisponível — configure SMTP no Supabase).'
      : 'Link gerado. Copie e envie ao cliente (e-mail automático indisponível — configure SMTP no Supabase).',
  }
}
