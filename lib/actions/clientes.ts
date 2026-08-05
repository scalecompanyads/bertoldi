'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertEquipe } from '@/lib/actions/assert-equipe'
import { enviarConviteAcesso } from '@/lib/actions/cliente-acesso'
import { emailValido, normalizarEmail } from '@/lib/email-utils'
import { sincronizarEmailUsuario } from '@/lib/actions/sync-auth-email'
import {
  assertCpfClienteUnico,
  erroCpfDuplicado,
  validarCpfCliente,
} from '@/lib/cliente-cpf'
import { revalidatePath } from 'next/cache'

export async function criarCliente(formData: FormData) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const cpfValidado = validarCpfCliente(formData.get('cpf_cnpj') as string)
  if ('error' in cpfValidado) return { error: cpfValidado.error }

  const cpfUnico = await assertCpfClienteUnico(cpfValidado.digits)
  if ('error' in cpfUnico) return { error: cpfUnico.error }

  const liberarAcesso = formData.get('liberar_acesso') === 'on'
  const supabase = await createClient()

  const { data: cliente, error } = await supabase
    .from('clientes')
    .insert({
      nome: formData.get('nome') as string,
      cpf_cnpj: cpfValidado.digits,
      telefone: (formData.get('telefone') as string) || null,
      email: (formData.get('email') as string) || null,
      atualizado_por: auth.userId,
    })
    .select('id')
    .single()

  if (error) {
    return { error: erroCpfDuplicado(error.message) ?? `Erro ao salvar cliente: ${error.message}` }
  }

  revalidatePath('/admin/clientes')

  if (!liberarAcesso) {
    return { ok: true as const, id: cliente.id }
  }

  const convite = await enviarConviteAcesso(cliente.id)
  if ('error' in convite) {
    return {
      ok: true as const,
      id: cliente.id,
      warning: `Cliente salvo, mas o convite falhou: ${convite.error}`,
    }
  }

  return {
    ok: true as const,
    id: cliente.id,
    message: convite.message,
    linkConvite: convite.linkConvite,
    emailEnviado: convite.emailEnviado,
  }
}

export async function atualizarCliente(id: string, formData: FormData) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const cpfValidado = validarCpfCliente(formData.get('cpf_cnpj') as string)
  if ('error' in cpfValidado) return { error: cpfValidado.error }

  const cpfUnico = await assertCpfClienteUnico(cpfValidado.digits, id)
  if ('error' in cpfUnico) return { error: cpfUnico.error }

  const supabase = await createClient()
  const emailBruto = (formData.get('email') as string) || ''
  const email = emailBruto.trim() ? normalizarEmail(emailBruto) : null

  if (email && !emailValido(email)) {
    return { error: 'E-mail inválido.' }
  }

  const admin = createAdminClient()
  const { data: clienteAtual, error: leituraError } = await admin
    .from('clientes')
    .select('usuario_id, email')
    .eq('id', id)
    .single()

  if (leituraError || !clienteAtual) {
    return { error: leituraError?.message ?? 'Cliente não encontrado.' }
  }

  if (clienteAtual.usuario_id && !email) {
    return { error: 'E-mail é obrigatório para clientes com acesso liberado.' }
  }

  if (clienteAtual.usuario_id && email) {
    const sync = await sincronizarEmailUsuario(clienteAtual.usuario_id, email)
    if ('error' in sync) return { error: sync.error }
  }

  const { error } = await supabase.from('clientes').update({
    nome: formData.get('nome') as string,
    cpf_cnpj: cpfValidado.digits,
    telefone: (formData.get('telefone') as string) || null,
    email,
    atualizado_em: new Date().toISOString(),
    atualizado_por: auth.userId,
  }).eq('id', id)

  if (error) {
    return { error: erroCpfDuplicado(error.message) ?? error.message }
  }
  revalidatePath(`/admin/clientes/${id}`)
  revalidatePath('/admin/clientes')
  return { ok: true as const }
}

export async function arquivarCliente(id: string) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { error } = await supabase.from('clientes').update({
    arquivado: true,
    arquivado_em: now,
    arquivado_por: auth.userId,
    atualizado_em: now,
    atualizado_por: auth.userId,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${id}`)
  revalidatePath('/admin/clientes')
  revalidatePath('/admin')
  return { ok: true as const }
}

export async function restaurarCliente(id: string) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { error } = await supabase.from('clientes').update({
    arquivado: false,
    arquivado_em: null,
    arquivado_por: null,
    atualizado_em: now,
    atualizado_por: auth.userId,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${id}`)
  revalidatePath('/admin/clientes')
  revalidatePath('/admin')
  return { ok: true as const }
}
