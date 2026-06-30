'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadDocumento(processoId: string, clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const arquivo = formData.get('arquivo') as File
  if (!arquivo || arquivo.size === 0) return { error: 'Arquivo não selecionado' }

  const ext = arquivo.name.split('.').pop()
  const path = `${processoId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('documentos')
    .upload(path, arquivo, { upsert: false })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(path)

  const { error: dbError } = await supabase.from('documentos').insert({
    processo_id: processoId,
    nome_arquivo: arquivo.name,
    url_storage: path,
    tipo: (formData.get('tipo') as string) || 'outro',
    visivel_cliente: formData.get('visivel_cliente') === 'true',
    enviado_por: user.id,
  })

  if (dbError) return { error: dbError.message }
  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)
  return { ok: true, publicUrl }
}

export async function toggleVisibilidadeDocumento(docId: string, visivel: boolean, processoId: string, clienteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('documentos')
    .update({ visivel_cliente: visivel })
    .eq('id', docId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)
  return { ok: true }
}

export async function removerDocumento(docId: string, urlStorage: string, processoId: string, clienteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  await supabase.storage.from('documentos').remove([urlStorage])

  const { error } = await supabase.from('documentos').delete().eq('id', docId)
  if (error) return { error: error.message }

  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)
  return { ok: true }
}
