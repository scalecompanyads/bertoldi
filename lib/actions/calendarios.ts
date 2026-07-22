'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function exigirAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' } as const
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('papel')
    .eq('id', user.id)
    .single()
  if (usuario?.papel !== 'admin') return { error: 'Apenas administradores podem gerenciar calendários.' } as const
  return { user } as const
}

export async function criarCalendario(formData: FormData) {
  const auth = await exigirAdmin()
  if ('error' in auth) return auth

  const nome = formData.get('nome')?.toString().trim() ?? ''
  const uf = formData.get('uf')?.toString().trim().toUpperCase() ?? ''
  const escopo = formData.get('escopo')?.toString() ?? ''
  const fonteUrl = formData.get('fonte_url')?.toString().trim() ?? ''
  const fonteDescricao = formData.get('fonte_descricao')?.toString().trim() ?? ''
  const vigenciaInicio = formData.get('vigencia_inicio')?.toString() ?? ''
  const vigenciaFim = formData.get('vigencia_fim')?.toString() ?? ''

  if (!nome || !/^[A-Z]{2}$/.test(uf) || !fonteUrl || !fonteDescricao || !vigenciaInicio || !vigenciaFim) {
    return { error: 'Preencha nome, UF, vigência e fonte oficial.' }
  }

  const admin = createAdminClient()
  const { data: calendario, error } = await admin
    .from('calendarios_forenses')
    .insert({
      nome,
      uf,
      escopo,
      comarca: formData.get('comarca')?.toString().trim() || null,
      tribunal: formData.get('tribunal')?.toString().trim().toUpperCase() || null,
      criado_por: auth.user.id,
    })
    .select('id')
    .single()

  if (error || !calendario) return { error: error?.message ?? 'Não foi possível criar o calendário.' }

  const { error: versaoError } = await admin.from('calendario_forense_versoes').insert({
    calendario_id: calendario.id,
    versao: 1,
    status: 'rascunho',
    vigencia_inicio: vigenciaInicio,
    vigencia_fim: vigenciaFim,
    fonte_url: fonteUrl,
    fonte_descricao: fonteDescricao,
    criado_por: auth.user.id,
  })

  if (versaoError) {
    await admin.from('calendarios_forenses').delete().eq('id', calendario.id)
    return { error: versaoError.message }
  }

  revalidatePath('/admin/calendarios')
  return { ok: true }
}

export async function adicionarDiaCalendario(versaoId: string, formData: FormData) {
  const auth = await exigirAdmin()
  if ('error' in auth) return auth

  const dataInicio = formData.get('data_inicio')?.toString() ?? ''
  const dataFim = formData.get('data_fim')?.toString() || dataInicio
  const descricao = formData.get('descricao')?.toString().trim() ?? ''
  if (!dataInicio || !dataFim || !descricao) return { error: 'Informe data e descrição.' }

  const admin = createAdminClient()
  const { data: versao } = await admin
    .from('calendario_forense_versoes')
    .select('status')
    .eq('id', versaoId)
    .single()
  if (versao?.status !== 'rascunho') return { error: 'Somente versões em rascunho podem ser alteradas.' }

  const { error } = await admin.from('calendario_forense_dias').insert({
    versao_id: versaoId,
    data_inicio: dataInicio,
    data_fim: dataFim,
    tipo: formData.get('tipo')?.toString() || 'suspensao',
    descricao,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/calendarios')
  return { ok: true }
}

export async function removerDiaCalendario(diaId: string) {
  const auth = await exigirAdmin()
  if ('error' in auth) return auth
  const admin = createAdminClient()
  const { error } = await admin.from('calendario_forense_dias').delete().eq('id', diaId)
  if (error) return { error: error.message }
  revalidatePath('/admin/calendarios')
  return { ok: true }
}

export async function publicarVersaoCalendario(calendarioId: string, versaoId: string) {
  const auth = await exigirAdmin()
  if ('error' in auth) return auth
  const admin = createAdminClient()

  const { data: versao } = await admin
    .from('calendario_forense_versoes')
    .select('status, calendario_id, calendario_forense_dias(id)')
    .eq('id', versaoId)
    .eq('calendario_id', calendarioId)
    .single()
  if (!versao || versao.status !== 'rascunho') return { error: 'Versão inválida ou já publicada.' }
  if (!versao.calendario_forense_dias?.length) return { error: 'Adicione ao menos um dia ou intervalo antes de publicar.' }

  const { data: calendario } = await admin
    .from('calendarios_forenses')
    .select('versao_ativa_id')
    .eq('id', calendarioId)
    .single()

  if (calendario?.versao_ativa_id) {
    await admin
      .from('calendario_forense_versoes')
      .update({ status: 'substituido' })
      .eq('id', calendario.versao_ativa_id)
  }

  const publicadoEm = new Date().toISOString()
  const { error } = await admin
    .from('calendario_forense_versoes')
    .update({ status: 'publicado', publicado_em: publicadoEm, publicado_por: auth.user.id })
    .eq('id', versaoId)
  if (error) return { error: error.message }

  const { error: calendarioError } = await admin
    .from('calendarios_forenses')
    .update({ versao_ativa_id: versaoId, ativo: true })
    .eq('id', calendarioId)
  if (calendarioError) return { error: calendarioError.message }

  revalidatePath('/admin/calendarios')
  return { ok: true }
}

export async function criarNovaVersaoCalendario(calendarioId: string) {
  const auth = await exigirAdmin()
  if ('error' in auth) return auth
  const admin = createAdminClient()
  const { data: calendario } = await admin
    .from('calendarios_forenses')
    .select('versao_ativa_id, calendario_forense_versoes(versao)')
    .eq('id', calendarioId)
    .single()
  if (!calendario?.versao_ativa_id) return { error: 'Publique a primeira versão antes de criar outra.' }

  const { data: ativa } = await admin
    .from('calendario_forense_versoes')
    .select('*, calendario_forense_dias(*)')
    .eq('id', calendario.versao_ativa_id)
    .single()
  if (!ativa) return { error: 'Versão ativa não encontrada.' }

  const versoes = calendario.calendario_forense_versoes ?? []
  const numero = Math.max(0, ...versoes.map(item => item.versao)) + 1
  const { data: nova, error } = await admin
    .from('calendario_forense_versoes')
    .insert({
      calendario_id: calendarioId,
      versao: numero,
      status: 'rascunho',
      vigencia_inicio: ativa.vigencia_inicio,
      vigencia_fim: ativa.vigencia_fim,
      fonte_url: ativa.fonte_url,
      fonte_descricao: ativa.fonte_descricao,
      criado_por: auth.user.id,
    })
    .select('id')
    .single()
  if (error || !nova) return { error: error?.message ?? 'Não foi possível criar a versão.' }

  if (ativa.calendario_forense_dias?.length) {
    const { error: diasError } = await admin.from('calendario_forense_dias').insert(
      ativa.calendario_forense_dias.map((dia: {
        data_inicio: string
        data_fim: string
        tipo: string
        descricao: string
      }) => ({
        versao_id: nova.id,
        data_inicio: dia.data_inicio,
        data_fim: dia.data_fim,
        tipo: dia.tipo,
        descricao: dia.descricao,
      }))
    )
    if (diasError) return { error: diasError.message }
  }

  revalidatePath('/admin/calendarios')
  return { ok: true }
}
