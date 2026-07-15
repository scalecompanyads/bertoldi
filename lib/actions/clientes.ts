'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertEquipe } from '@/lib/actions/assert-equipe'
import { enviarConviteAcesso } from '@/lib/actions/cliente-acesso'
import { revalidatePath } from 'next/cache'

export async function criarCliente(formData: FormData) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const liberarAcesso = formData.get('liberar_acesso') === 'on'
  const admin = createAdminClient()

  const { data: cliente, error } = await admin
    .from('clientes')
    .insert({
      nome: formData.get('nome') as string,
      cpf_cnpj: (formData.get('cpf_cnpj') as string) || null,
      telefone: (formData.get('telefone') as string) || null,
      email: (formData.get('email') as string) || null,
      atualizado_por: auth.userId,
    })
    .select('id')
    .single()

  if (error) {
    return { error: `Erro ao salvar cliente: ${error.message}` }
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

  const admin = createAdminClient()

  const { error } = await admin.from('clientes').update({
    nome: formData.get('nome') as string,
    cpf_cnpj: (formData.get('cpf_cnpj') as string) || null,
    telefone: (formData.get('telefone') as string) || null,
    email: (formData.get('email') as string) || null,
    atualizado_em: new Date().toISOString(),
    atualizado_por: auth.userId,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${id}`)
  revalidatePath('/admin/clientes')
  return { ok: true as const }
}

export async function arquivarCliente(id: string) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { error } = await admin.from('clientes').update({
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

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { error } = await admin.from('clientes').update({
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
