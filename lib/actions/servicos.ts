'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarServico(clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('servicos_contratados').insert({
    cliente_id: clienteId,
    tipo_servico: formData.get('tipo_servico') as string,
    data_contratacao: formData.get('data_contratacao') as string,
    status: (formData.get('status') as string) || 'ativo',
  })

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}`)
  return { ok: true }
}

export async function atualizarStatusServico(id: string, status: string, clienteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('servicos_contratados').update({ status }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}`)
  return { ok: true }
}
