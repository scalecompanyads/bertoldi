'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarPeticao(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('peticoes').insert({
    cliente_id: formData.get('cliente_id') as string,
    responsavel_id: (formData.get('responsavel_id') as string) || null,
    natureza_acao: formData.get('natureza_acao') as string,
    parte_adversa: (formData.get('parte_adversa') as string) || null,
    data_contratacao: formData.get('data_contratacao') as string,
    urgente: formData.get('urgente') === 'true',
    prescricao: formData.get('prescricao') === 'true',
    decadencia: formData.get('decadencia') === 'true',
    observacoes: (formData.get('observacoes') as string) || null,
    criado_por: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/peticoes')
  return { ok: true }
}

export async function atualizarPeticao(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('peticoes').update({
    responsavel_id: (formData.get('responsavel_id') as string) || null,
    natureza_acao: formData.get('natureza_acao') as string,
    parte_adversa: (formData.get('parte_adversa') as string) || null,
    data_contratacao: formData.get('data_contratacao') as string,
    urgente: formData.get('urgente') === 'true',
    prescricao: formData.get('prescricao') === 'true',
    decadencia: formData.get('decadencia') === 'true',
    observacoes: (formData.get('observacoes') as string) || null,
    atualizado_em: new Date().toISOString(),
    atualizado_por: user.id,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/peticoes')
  return { ok: true }
}

export async function distribuirPeticao(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: peticao } = await supabase
    .from('peticoes')
    .select('cliente_id, natureza_acao, parte_adversa, responsavel_id, data_contratacao')
    .eq('id', id)
    .single()

  if (!peticao) return { error: 'Petição não encontrada' }

  const { data: processo, error: procError } = await supabase
    .from('processos')
    .insert({
      cliente_id: peticao.cliente_id,
      responsavel_id: (formData.get('responsavel_id') as string) || peticao.responsavel_id || null,
      numero_cnj: (formData.get('numero_cnj') as string) || null,
      tribunal: (formData.get('tribunal') as string) || null,
      vara_orgao: (formData.get('vara_orgao') as string) || null,
      tipo_servico: peticao.natureza_acao,
      parte_autora: (formData.get('parte_autora') as string) || null,
      parte_re: peticao.parte_adversa || null,
      data_contratacao: peticao.data_contratacao,
      status_interno: 'distribuido',
    })
    .select('id')
    .single()

  if (procError) return { error: procError.message }

  const { error: petError } = await supabase.from('peticoes').update({
    status: 'distribuida',
    processo_id: processo.id,
    distribuida_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    atualizado_por: user.id,
  }).eq('id', id)

  if (petError) return { error: petError.message }

  revalidatePath('/admin/peticoes')
  revalidatePath('/admin/processos')
  return { ok: true, processoId: processo.id }
}

export async function cancelarPeticao(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('peticoes').update({
    status: 'cancelada',
    atualizado_em: new Date().toISOString(),
    atualizado_por: user.id,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/peticoes')
  return { ok: true }
}
