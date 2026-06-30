'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function adicionarEvento(processoId: string, clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('linha_do_tempo').insert({
    processo_id: processoId,
    data_evento: formData.get('data_evento') as string,
    descricao: formData.get('descricao') as string,
    visivel_cliente: formData.get('visivel_cliente') === 'true',
    criado_por: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)
  return { ok: true }
}

export async function editarEvento(eventoId: string, processoId: string, clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('linha_do_tempo').update({
    data_evento: formData.get('data_evento') as string,
    descricao: formData.get('descricao') as string,
    visivel_cliente: formData.get('visivel_cliente') === 'true',
  }).eq('id', eventoId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)
  return { ok: true }
}

export async function removerEvento(eventoId: string, processoId: string, clienteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('linha_do_tempo').delete().eq('id', eventoId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)
  return { ok: true }
}
