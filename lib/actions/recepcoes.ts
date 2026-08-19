'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarRecepcao(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const clienteNome = (formData.get('cliente_nome') as string)?.trim()
  if (!clienteNome) return { error: 'Informe o nome do cliente' }

  const { error } = await supabase.from('recepcoes').insert({
    cliente_id: (formData.get('cliente_id') as string) || null,
    cliente_nome: clienteNome,
    assunto: (formData.get('assunto') as string) || null,
    providencia: (formData.get('providencia') as string) || null,
    responsavel_id: (formData.get('responsavel_id') as string) || null,
    criado_por: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/recepcao')
  return { ok: true }
}

export async function registrarSaida(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('recepcoes')
    .update({ saida: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/recepcao')
  return { ok: true }
}

export async function atualizarRecepcao(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('recepcoes').update({
    assunto: (formData.get('assunto') as string) || null,
    providencia: (formData.get('providencia') as string) || null,
    responsavel_id: (formData.get('responsavel_id') as string) || null,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/recepcao')
  return { ok: true }
}

export async function excluirRecepcao(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('recepcoes').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/recepcao')
  return { ok: true }
}
