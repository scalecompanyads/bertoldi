'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function adicionarObservacao(processoId: string, clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('observacoes').insert({
    processo_id: processoId,
    texto: formData.get('texto') as string,
    visivel_cliente: formData.get('visivel_cliente') === 'true',
    autor_id: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)
  return { ok: true }
}

export async function removerObservacao(obsId: string, processoId: string, clienteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('observacoes').delete().eq('id', obsId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)
  return { ok: true }
}
