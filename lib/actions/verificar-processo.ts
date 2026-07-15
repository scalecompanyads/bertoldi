'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { analisarProcesso } from '@/lib/scrapers'
import { identificarTribunal } from '@/lib/cnj-parser'
import { mesmoAndamento } from '@/lib/andamento'

const CACHE_TTL_MS = 48 * 60 * 60 * 1000 // 48 horas

export interface VerificacaoResult {
  ok?: boolean
  error?: string
  doCache?: boolean
  encontrado?: boolean
  houve_movimentacao?: boolean
  ultimoAndamento?: string
  movimentos?: { data: string; descricao: string }[]
  fonte?: string
  verificadoEm?: string
}

export async function analisarAndamento(
  processoId: string,
  forcar = false
): Promise<VerificacaoResult> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: processo } = await supabase
    .from('processos')
    .select('numero_cnj, cliente_id')
    .eq('id', processoId)
    .single()

  if (!processo?.numero_cnj) return { error: 'Processo sem número CNJ cadastrado.' }

  const resultado = identificarTribunal(processo.numero_cnj)
  if (!resultado?.tribunal) return { error: 'Tribunal não identificado pelo número CNJ.' }

  // Checar cache
  const { data: ultimaVerif } = await supabase
    .from('verificacoes_datajud')
    .select('*')
    .eq('processo_id', processoId)
    .order('verificado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  const idadeMs = ultimaVerif
    ? Date.now() - new Date(ultimaVerif.verificado_em).getTime()
    : Infinity

  if (!forcar && idadeMs < CACHE_TTL_MS) {
    const horasAtras = Math.floor(idadeMs / 3_600_000)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const movimentos = (ultimaVerif!.raw_response as any)?.movimentos ?? undefined
    return {
      ok: true,
      doCache: true,
      encontrado: ultimaVerif!.houve_movimentacao || !!ultimaVerif!.ultimo_andamento,
      houve_movimentacao: ultimaVerif!.houve_movimentacao,
      ultimoAndamento: ultimaVerif!.ultimo_andamento ?? undefined,
      movimentos,
      verificadoEm: ultimaVerif!.verificado_em,
      fonte: horasAtras === 0 ? 'há menos de 1 hora' : `há ${horasAtras}h`,
    }
  }

  const { encontrado, ultimoAndamento, movimentos, erro, fonte } = await analisarProcesso(
    processo.numero_cnj,
    resultado.tribunal.id
  )

  if (erro && !encontrado) return { error: erro }

  const houve_movimentacao =
    encontrado && !!ultimoAndamento && !mesmoAndamento(ultimaVerif?.ultimo_andamento, ultimoAndamento)

  const now = new Date().toISOString()

  // Sempre salva quando processo foi encontrado (usa admin client para bypassar RLS)
  if (encontrado || !ultimaVerif) {
    const { error: insertError } = await admin.from('verificacoes_datajud').insert({
      processo_id: processoId,
      origem: forcar ? 'manual' : 'automatica',
      houve_movimentacao,
      ultimo_andamento: ultimoAndamento ?? null,
      raw_response: { fonte, movimentos: movimentos ?? [] },
    })
    if (insertError) {
      console.error('[verificar-processo] Erro ao salvar verificação:', insertError)
    }
  }

  revalidatePath(`/admin/clientes/${processo.cliente_id}/processos/${processoId}`)
  revalidatePath(`/cliente/processos/${processoId}`)

  return {
    ok: true,
    doCache: false,
    encontrado,
    houve_movimentacao,
    ultimoAndamento,
    movimentos,
    fonte: fonte === 'esaj' ? 'eSAJ' : fonte === 'datajud' ? 'Datajud/CNJ' : fonte,
    verificadoEm: now,
  }
}

// Cron: processa todos os processos ativos com número CNJ, respeitando cache de 48h
export async function verificarTodosProcessos() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: processos } = await supabase
    .from('processos')
    .select('id, cliente_id, numero_cnj')
    .not('numero_cnj', 'is', null)
    .not('status_interno', 'eq', 'concluido')

  if (!processos?.length) return { verificados: 0, pulados: 0 }

  let verificados = 0
  let pulados = 0

  for (const p of processos) {
    if (!p.numero_cnj) continue

    const { data: ultima } = await supabase
      .from('verificacoes_datajud')
      .select('verificado_em, ultimo_andamento')
      .eq('processo_id', p.id)
      .order('verificado_em', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (ultima) {
      const idadeMs = Date.now() - new Date(ultima.verificado_em).getTime()
      if (idadeMs < CACHE_TTL_MS) { pulados++; continue }
    }

    const tribunalResult = identificarTribunal(p.numero_cnj)
    if (!tribunalResult?.tribunal) continue

    const { encontrado, ultimoAndamento, movimentos, erro, fonte } = await analisarProcesso(
      p.numero_cnj,
      tribunalResult.tribunal.id
    )

    if (fonte === 'erro' && !encontrado) continue

    const houve_movimentacao =
      encontrado && !!ultimoAndamento && !mesmoAndamento(ultima?.ultimo_andamento, ultimoAndamento)

    if (encontrado || !ultima) {
      const { error: insertError } = await admin.from('verificacoes_datajud').insert({
        processo_id: p.id,
        origem: 'automatica',
        houve_movimentacao,
        ultimo_andamento: ultimoAndamento ?? null,
        raw_response: { fonte, movimentos: movimentos ?? [], erro: erro ?? null },
      })
      if (insertError) {
        console.error(`[cron] Erro ao salvar verificação para processo ${p.id}:`, insertError)
      }
    }

    revalidatePath(`/admin/clientes/${p.cliente_id}/processos/${p.id}`)
    revalidatePath(`/cliente/processos/${p.id}`)

    verificados++
    await new Promise(r => setTimeout(r, 800))
  }

  return { verificados, pulados }
}
