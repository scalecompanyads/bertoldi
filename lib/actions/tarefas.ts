'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { StatusTarefa } from '@/lib/types'

export async function criarTarefa(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const status = (formData.get('status') as StatusTarefa) || 'a_fazer'

  // Nova tarefa entra no topo da coluna
  const { data: primeira } = await supabase
    .from('tarefas')
    .select('ordem')
    .eq('usuario_id', user.id)
    .eq('status', status)
    .order('ordem', { ascending: true })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('tarefas').insert({
    usuario_id: user.id,
    titulo: formData.get('titulo') as string,
    descricao: (formData.get('descricao') as string) || null,
    processo_id: (formData.get('processo_id') as string) || null,
    prazo: (formData.get('prazo') as string) || null,
    status,
    ordem: (primeira?.ordem ?? 1) - 1,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/tarefas')
  return { ok: true }
}

export async function atualizarTarefa(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const status = (formData.get('status') as StatusTarefa) || 'a_fazer'
  const { error } = await supabase.from('tarefas').update({
    titulo: formData.get('titulo') as string,
    descricao: (formData.get('descricao') as string) || null,
    processo_id: (formData.get('processo_id') as string) || null,
    prazo: (formData.get('prazo') as string) || null,
    status,
    concluida_em: status === 'concluido' ? new Date().toISOString() : null,
  }).eq('id', id).eq('usuario_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/admin/tarefas')
  return { ok: true }
}

export async function moverTarefa(id: string, status: StatusTarefa, ordem: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('tarefas').update({
    status,
    ordem,
    concluida_em: status === 'concluido' ? new Date().toISOString() : null,
  }).eq('id', id).eq('usuario_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/admin/tarefas')
  return { ok: true }
}

export async function excluirTarefa(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('tarefas').delete().eq('id', id).eq('usuario_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/admin/tarefas')
  return { ok: true }
}
