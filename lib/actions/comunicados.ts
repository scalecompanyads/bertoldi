'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function enviarComunicado(fd: FormData) {
  const supabase = await createClient()
  const clienteId = fd.get('cliente_id')?.toString() || null
  const titulo = fd.get('titulo')?.toString() ?? ''
  const mensagem = fd.get('mensagem')?.toString() ?? ''

  if (!titulo || !mensagem) return { error: 'Título e mensagem são obrigatórios.' }

  const { error } = await supabase.from('comunicados').insert({
    cliente_id: clienteId || null,
    titulo,
    mensagem,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/comunicados')
  if (clienteId) revalidatePath(`/admin/clientes/${clienteId}`)
  return { ok: true }
}

export async function marcarComoLido(comunicadoId: string) {
  const supabase = await createClient()
  await supabase.from('comunicados').update({ lido: true }).eq('id', comunicadoId)
  revalidatePath('/cliente/comunicados')
}

export async function removerComunicado(comunicadoId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('comunicados').delete().eq('id', comunicadoId)
  if (error) return { error: error.message }
  revalidatePath('/admin/comunicados')
  return { ok: true }
}
