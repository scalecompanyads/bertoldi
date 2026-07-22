'use server'

import { createClient } from '@/lib/supabase/server'
import { assertEquipe } from '@/lib/actions/assert-equipe'
import { revalidatePath } from 'next/cache'

export async function criarAudiencia(formData: FormData) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const dataHora = formData.get('data_hora') as string
  if (!dataHora) return { error: 'Data e hora são obrigatórias.' }

  const supabase = await createClient()
  const { error } = await supabase.from('audiencias').insert({
    processo_id: (formData.get('processo_id') as string) || null,
    tipo: (formData.get('tipo') as string) || 'outra',
    data_hora: new Date(dataHora).toISOString(),
    local: (formData.get('local') as string) || null,
    link_video: (formData.get('link_video') as string) || null,
    observacoes: (formData.get('observacoes') as string) || null,
    criado_por: auth.userId,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/audiencias')
  return { ok: true as const }
}

export async function atualizarAudiencia(id: string, formData: FormData) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const dataHora = formData.get('data_hora') as string
  if (!dataHora) return { error: 'Data e hora são obrigatórias.' }

  const supabase = await createClient()
  const { error } = await supabase.from('audiencias').update({
    processo_id: (formData.get('processo_id') as string) || null,
    tipo: (formData.get('tipo') as string) || 'outra',
    data_hora: new Date(dataHora).toISOString(),
    local: (formData.get('local') as string) || null,
    link_video: (formData.get('link_video') as string) || null,
    observacoes: (formData.get('observacoes') as string) || null,
    atualizado_em: new Date().toISOString(),
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/audiencias')
  return { ok: true as const }
}

export async function excluirAudiencia(id: string) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('audiencias').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/audiencias')
  return { ok: true as const }
}
