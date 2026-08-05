'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertEquipe } from '@/lib/actions/assert-equipe'
import { isValidCpf, normalizeCpfDigits } from '@/lib/cpf'
import { buscarClientePorCpf } from '@/lib/cliente-cpf'
import { getAuthCallbackUrl } from '@/lib/site-url'
import { sincronizarEmailUsuario } from '@/lib/actions/sync-auth-email'
import { botaoHtml, enviarEmail, escapeHtml, layoutEmail } from '@/lib/email'
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

/** Envia o link de acesso via Resend (mesmo canal dos demais e-mails do sistema). */
async function enviarLinkAcessoCliente(params: {
  para: string
  nome: string
  actionLink: string
  conviteNovo: boolean
}) {
  const titulo = params.conviteNovo ? 'Acesso à área do cliente' : 'Redefinir senha de acesso'
  const intro = params.conviteNovo
    ? `Olá, ${escapeHtml(params.nome)}. O escritório liberou seu acesso à área do cliente na plataforma Bertoldi Advocacia.`
    : `Olá, ${escapeHtml(params.nome)}. Use o link abaixo para definir ou redefinir sua senha de acesso.`

  const html = layoutEmail(
    titulo,
    `<p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.5;">${intro}</p>
     <p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.5;">Depois de criar a senha, entre com seu <strong>CPF</strong> na página de login.</p>
     ${botaoHtml(params.conviteNovo ? 'Criar minha senha' : 'Definir senha', params.actionLink)}
     <p style="margin:12px 0 0;font-size:12px;color:#71717a;line-height:1.5;word-break:break-all;">Se o botão não funcionar, copie e cole este link no navegador:<br>${escapeHtml(params.actionLink)}</p>`
  )

  return enviarEmail({
    para: params.para,
    assunto: `${titulo} — Bertoldi Advocacia`,
    html,
  })
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

  const cpfDigits = normalizeCpfDigits(cliente.cpf_cnpj ?? '')
  const outroComCpf = await buscarClientePorCpf(cpfDigits, clienteId)
  if (outroComCpf) {
    return {
      error: `Este CPF já está vinculado ao cliente "${outroComCpf.nome}". Unifique os cadastros antes de liberar acesso.`,
    }
  }

  const email = validacao.email

  if (await emailEmUsoPorEquipe(admin, email)) {
    return { error: 'Este e-mail já pertence a um usuário da equipe. Use outro e-mail para o cliente.' }
  }

  const redirectTo = getAuthCallbackUrl('/auth/definir-senha')
  let conviteNovo = !cliente.usuario_id
  let emailParaLink = email

  if (cliente.usuario_id) {
    const sync = await sincronizarEmailUsuario(cliente.usuario_id, email)
    if ('error' in sync) return { error: sync.error }

    const { data: authData, error: authError } = await admin.auth.admin.getUserById(cliente.usuario_id)
    if (authError || !authData.user) {
      await admin
        .from('clientes')
        .update({
          usuario_id: null,
          atualizado_em: new Date().toISOString(),
          atualizado_por: auth.userId,
        })
        .eq('id', clienteId)
      conviteNovo = true
    } else {
      emailParaLink = authData.user.email?.trim().toLowerCase() ?? email
    }
  }

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
        email: emailParaLink,
        options: { redirectTo },
      })

  if (linkError || !linkData.user) {
    const msg = linkError?.message ?? 'Não foi possível criar a conta de acesso do cliente.'
    if (/user with this email not found/i.test(msg)) {
      return {
        error:
          'A conta de login não está sincronizada com o e-mail do cadastro. Salve o cliente novamente ou use um e-mail ainda não usado em outra conta.',
      }
    }
    return { error: msg }
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
  if (!actionLink) {
    return {
      ok: true,
      emailEnviado: false,
      message: 'Conta criada, mas não foi possível gerar o link de acesso.',
    }
  }

  const envio = await enviarLinkAcessoCliente({
    para: emailParaLink,
    nome: cliente.nome,
    actionLink,
    conviteNovo,
  })

  revalidatePath(`/admin/clientes/${clienteId}`)

  if (envio.ok) {
    return {
      ok: true,
      emailEnviado: true,
      message: conviteNovo
        ? 'Convite enviado! O cliente receberá um e-mail para criar a senha.'
        : 'E-mail enviado com o link para definir ou redefinir a senha.',
    }
  }

  return {
    ok: true,
    emailEnviado: false,
    linkConvite: actionLink,
    message: envio.pulado
      ? 'Link gerado. Configure RESEND_API_KEY para envio automático — copie e envie ao cliente.'
      : 'Link gerado. Não foi possível enviar o e-mail automaticamente — copie e envie ao cliente.',
  }
}
