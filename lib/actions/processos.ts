'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Aceita "R$ 16.210,00", "16.210,00" ou "16210.00"
function parseValorCausa(raw: FormDataEntryValue | null): number | null {
  const s = (raw as string | null)?.replace(/[R$\s]/g, '') ?? ''
  if (!s) return null
  const normalizado = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s
  const n = Number(normalizado)
  return Number.isFinite(n) ? n : null
}

function camposCapa(formData: FormData) {
  return {
    parte_autora: (formData.get('parte_autora') as string) || null,
    parte_re: (formData.get('parte_re') as string) || null,
    outras_partes: (formData.get('outras_partes') as string) || null,
    assunto: (formData.get('assunto') as string) || null,
    valor_causa: parseValorCausa(formData.get('valor_causa')),
    data_ajuizamento: (formData.get('data_ajuizamento') as string) || null,
    cidade_origem: (formData.get('cidade_origem') as string) || null,
  }
}

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
    calendario_forense_id: (formData.get('calendario_forense_id') as string) || null,
    notificar_cliente: formData.get('notificar_cliente') === 'true',
    ...camposCapa(formData),
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
    calendario_forense_id: (formData.get('calendario_forense_id') as string) || null,
    notificar_cliente: formData.get('notificar_cliente') === 'true',
    ...camposCapa(formData),
    atualizado_em: new Date().toISOString(),
    atualizado_por: user.id,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}/processos/${id}`)
  return { ok: true }
}
