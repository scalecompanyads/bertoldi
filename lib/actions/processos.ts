'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarProcesso(clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase.from('processos').insert({
    cliente_id: clienteId,
    numero_cnj: (formData.get('numero_cnj') as string) || null,
    tribunal: (formData.get('tribunal') as string) || null,
    vara_orgao: (formData.get('vara_orgao') as string) || null,
    tipo_servico: formData.get('tipo_servico') as string,
    status_interno: formData.get('status_interno') as string || 'triagem',
    data_contratacao: formData.get('data_contratacao') as string,
    responsavel_id: (formData.get('responsavel_id') as string) || null,
  }).select('id').single()

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}`)
  return { ok: true, id: data.id }
}

export async function atualizarProcesso(id: string, clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('processos').update({
    numero_cnj: (formData.get('numero_cnj') as string) || null,
    tribunal: (formData.get('tribunal') as string) || null,
    vara_orgao: (formData.get('vara_orgao') as string) || null,
    tipo_servico: formData.get('tipo_servico') as string,
    status_interno: formData.get('status_interno') as string,
    data_contratacao: formData.get('data_contratacao') as string,
    responsavel_id: (formData.get('responsavel_id') as string) || null,
    atualizado_em: new Date().toISOString(),
    atualizado_por: user.id,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}/processos/${id}`)
  return { ok: true }
}
