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

// Converte "dd/mm/aaaa" (formato dos portais) para "aaaa-mm-dd"; datas já ISO passam direto
function paraDataISO(data: string): string {
  const br = data.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  const iso = data.match(/^\d{4}-\d{2}-\d{2}/)
  if (iso) return iso[0]
  return new Date().toISOString().slice(0, 10)
}

export async function publicarMovimento(processoId: string, clienteId: string, movimento: { data: string; descricao: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const dataEvento = paraDataISO(movimento.data)

  // evita duplicar o mesmo movimento na linha do tempo
  const { data: existente } = await supabase
    .from('linha_do_tempo')
    .select('id')
    .eq('processo_id', processoId)
    .eq('data_evento', dataEvento)
    .eq('descricao', movimento.descricao)
    .limit(1)

  if (existente && existente.length > 0) return { error: 'Este movimento já está na linha do tempo.' }

  const { error } = await supabase.from('linha_do_tempo').insert({
    processo_id: processoId,
    data_evento: dataEvento,
    descricao: movimento.descricao,
    visivel_cliente: true,
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
