'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { analisarProcesso, type DatajudCapa } from '@/lib/scrapers'
import { identificarTribunal } from '@/lib/cnj-parser'
import { mesmoAndamento } from '@/lib/andamento'
import { enviarEmail, layoutEmail, itemListaHtml, botaoHtml, escapeHtml, emailConfigurado } from '@/lib/email'
import { getSiteUrl } from '@/lib/site-url'

const CACHE_TTL_MS = 48 * 60 * 60 * 1000 // 48 horas

export interface VerificacaoResult {
  ok?: boolean
  error?: string
  doCache?: boolean
  encontrado?: boolean
  houve_movimentacao?: boolean
  ultimoAndamento?: string
  movimentos?: { data: string; hora?: string; descricao: string; orgao?: string }[]
  capa?: DatajudCapa
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
    const raw = ultimaVerif!.raw_response as any
    return {
      ok: true,
      doCache: true,
      encontrado: ultimaVerif!.houve_movimentacao || !!ultimaVerif!.ultimo_andamento,
      houve_movimentacao: ultimaVerif!.houve_movimentacao,
      ultimoAndamento: ultimaVerif!.ultimo_andamento ?? undefined,
      movimentos: raw?.movimentos ?? undefined,
      capa: raw?.capa ?? undefined,
      verificadoEm: ultimaVerif!.verificado_em,
      fonte: horasAtras === 0 ? 'há menos de 1 hora' : `há ${horasAtras}h`,
    }
  }

  const { encontrado, ultimoAndamento, movimentos, capa, erro, fonte } = await analisarProcesso(
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
      raw_response: { fonte, movimentos: movimentos ?? [], capa: capa ?? null },
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
    capa,
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
    .select('id, cliente_id, numero_cnj, responsavel_id, tipo_servico, clientes:cliente_id(nome)')
    .not('numero_cnj', 'is', null)
    .not('status_interno', 'eq', 'concluido')

  if (!processos?.length) return { verificados: 0, pulados: 0 }

  let verificados = 0
  let pulados = 0

  // Movimentações novas encontradas nesta rodada — viram digest por responsável
  const movidas: {
    responsavelId: string | null
    clienteNome: string
    tipoServico: string
    numeroCnj: string
    andamento: string
    clienteId: string
    processoId: string
  }[] = []

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

    const { encontrado, ultimoAndamento, movimentos, capa, erro, fonte } = await analisarProcesso(
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
        raw_response: { fonte, movimentos: movimentos ?? [], capa: capa ?? null, erro: erro ?? null },
      })
      if (insertError) {
        console.error(`[cron] Erro ao salvar verificação para processo ${p.id}:`, insertError)
      }
    }

    if (houve_movimentacao) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clienteNome = ((p as any).clientes?.nome as string) ?? 'Cliente'
      movidas.push({
        responsavelId: p.responsavel_id ?? null,
        clienteNome,
        tipoServico: p.tipo_servico ?? '',
        numeroCnj: p.numero_cnj,
        andamento: ultimoAndamento ?? '',
        clienteId: p.cliente_id,
        processoId: p.id,
      })
    }

    revalidatePath(`/admin/clientes/${p.cliente_id}/processos/${p.id}`)
    revalidatePath(`/cliente/processos/${p.id}`)

    verificados++
    await new Promise(r => setTimeout(r, 800))
  }

  if (movidas.length > 0) {
    await enviarDigestMovimentacoes(movidas)
  }

  return { verificados, pulados, movimentacoes: movidas.length }
}

// Agrupa as movimentações por advogado responsável e envia um digest para cada.
// Processos sem responsável entram no digest de todos os admins.
async function enviarDigestMovimentacoes(
  movidas: {
    responsavelId: string | null
    clienteNome: string
    tipoServico: string
    numeroCnj: string
    andamento: string
    clienteId: string
    processoId: string
  }[]
) {
  if (!emailConfigurado()) return

  const admin = createAdminClient()
  const { data: equipe } = await admin
    .from('usuarios')
    .select('id, nome, email, papel')
    .in('papel', ['admin', 'advogado'])

  if (!equipe?.length) return

  const admins = equipe.filter(u => u.papel === 'admin')

  for (const membro of equipe) {
    const doMembro = movidas.filter(
      m =>
        m.responsavelId === membro.id ||
        (m.responsavelId === null && admins.some(a => a.id === membro.id))
    )

    if (doMembro.length === 0 || !membro.email) continue

    const plural = doMembro.length > 1
    const itens = doMembro
      .slice(0, 20)
      .map(m =>
        itemListaHtml(
          `<strong>${escapeHtml(m.clienteNome)}</strong> · ${escapeHtml(m.tipoServico)}`,
          [escapeHtml(m.numeroCnj), escapeHtml(m.andamento)].filter(Boolean).join(' — ')
        )
      )
      .join('')

    const excedente = doMembro.length > 20
      ? `<p style="margin:8px 0 0;font-size:13px;color:#71717a;">…e mais ${doMembro.length - 20}.</p>`
      : ''

    await enviarEmail({
      para: membro.email,
      assunto: `${doMembro.length} ${plural ? 'processos com movimentação nova' : 'processo com movimentação nova'}`,
      html: layoutEmail(
        `Olá, ${membro.nome.split(' ')[0]} — movimentações novas nos tribunais`,
        `<p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.5;">
          A verificação automática encontrou ${plural ? 'andamentos novos nestes processos' : 'andamento novo neste processo'}:
        </p>
        ${itens}${excedente}
        ${botaoHtml('Abrir o painel', `${getSiteUrl()}/admin/processos`)}`
      ),
    })
  }
}
