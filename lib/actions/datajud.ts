'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { consultarDatajud, tribunalCobertoPorDatajud, motivoNaoCobertoDatajud } from '@/lib/datajud'
import { identificarTribunal } from '@/lib/cnj-parser'
import { mesmoAndamento } from '@/lib/andamento'

export async function verificarProcessoDatajud(processoId: string, clienteId: string) {
  const supabase = await createClient()

  const { data: processo } = await supabase
    .from('processos')
    .select('numero_cnj, tribunal')
    .eq('id', processoId)
    .single()

  if (!processo?.numero_cnj) {
    return { error: 'Processo sem número CNJ cadastrado.' }
  }

  // Identificar o tribunal pelo número CNJ para obter o índice correto
  const resultado = identificarTribunal(processo.numero_cnj)
  if (!resultado?.tribunal) {
    return { error: 'Tribunal não identificado pelo número CNJ. Verifique o número.' }
  }

  const motivo = motivoNaoCobertoDatajud(resultado.tribunal.id)
  if (motivo || !tribunalCobertoPorDatajud(resultado.tribunal.id)) {
    return {
      error: `${resultado.tribunal.sigla} não está disponível no Datajud — usa ${motivo ?? 'sistema próprio'}. Use o botão "Abrir no portal" para consultar diretamente.`,
    }
  }

  const { encontrado, ultimoAndamento, erro, rawResponse } = await consultarDatajud(
    processo.numero_cnj,
    resultado.tribunal.id
  )

  if (erro && !encontrado) {
    return { error: `Datajud: ${erro}` }
  }

  // Busca a última verificação para comparar andamento
  const { data: ultima } = await supabase
    .from('verificacoes_datajud')
    .select('ultimo_andamento')
    .eq('processo_id', processoId)
    .order('verificado_em', { ascending: false })
    .limit(1)
    .single()

  const houve_movimentacao =
    encontrado &&
    !!ultimoAndamento &&
    !mesmoAndamento(ultima?.ultimo_andamento, ultimoAndamento)

  await supabase.from('verificacoes_datajud').insert({
    processo_id: processoId,
    origem: 'manual',
    houve_movimentacao,
    ultimo_andamento: ultimoAndamento ?? null,
    raw_response: rawResponse ?? null,
  })

  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)

  return {
    ok: true,
    encontrado,
    houve_movimentacao,
    ultimoAndamento,
  }
}

// Usado pelo cron job — processa todos os processos ativos com número CNJ
export async function verificarTodosProcessos() {
  const supabase = await createClient()

  const { data: processos } = await supabase
    .from('processos')
    .select('id, cliente_id, numero_cnj')
    .not('numero_cnj', 'is', null)
    .not('status_interno', 'eq', 'concluido')

  if (!processos?.length) return { verificados: 0 }

  let verificados = 0
  for (const p of processos) {
    if (!p.numero_cnj) continue

    const resultado = identificarTribunal(p.numero_cnj)
    if (!resultado?.tribunal) continue
    if (!tribunalCobertoPorDatajud(resultado.tribunal.id)) continue

    const { encontrado, ultimoAndamento, rawResponse } = await consultarDatajud(
      p.numero_cnj,
      resultado.tribunal.id
    )

    const { data: ultima } = await supabase
      .from('verificacoes_datajud')
      .select('ultimo_andamento')
      .eq('processo_id', p.id)
      .order('verificado_em', { ascending: false })
      .limit(1)
      .single()

    const houve_movimentacao =
      encontrado &&
      !!ultimoAndamento &&
      !mesmoAndamento(ultima?.ultimo_andamento, ultimoAndamento)

    await supabase.from('verificacoes_datajud').insert({
      processo_id: p.id,
      origem: 'automatica',
      houve_movimentacao,
      ultimo_andamento: ultimoAndamento ?? null,
      raw_response: rawResponse ?? null,
    })

    verificados++
    // Pausa entre requisições para não saturar a API
    await new Promise(r => setTimeout(r, 500))
  }

  return { verificados }
}
