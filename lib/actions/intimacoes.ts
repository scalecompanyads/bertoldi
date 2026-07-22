'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { buscarComunicacoes, extrairTextoPlano } from '@/lib/djen'
import { assertEquipe } from './assert-equipe'
import { enviarEmail, layoutEmail, itemListaHtml, botaoHtml, escapeHtml, emailConfigurado } from '@/lib/email'
import { getSiteUrl } from '@/lib/site-url'
import type { PrazoContexto, StatusIntimacao } from '@/lib/types'

function dataISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export interface SincronizacaoResult {
  ok?: boolean
  error?: string
  novas?: number
  vinculadas?: number
  advogadosConsultados?: number
  erros?: string[]
}

// Busca no Comunica/DJEN as comunicações dos últimos `diasRetroativos` dias
// para cada advogado da equipe com OAB cadastrada, deduplica e vincula aos
// processos existentes. Usa o admin client porque o cron roda sem sessão.
export async function sincronizarIntimacoes(diasRetroativos = 5): Promise<SincronizacaoResult> {
  const admin = createAdminClient()

  const { data: advogados } = await admin
    .from('usuarios')
    .select('id, nome, email, oab_numero, oab_uf')
    .not('oab_numero', 'is', null)
    .not('oab_uf', 'is', null)
    .in('papel', ['admin', 'advogado'])

  if (!advogados?.length) {
    return { error: 'Nenhum advogado com OAB cadastrada. Preencha oab_numero e oab_uf na tabela usuarios.' }
  }

  // Mapa dígitos-do-CNJ → processo, para vincular intimações aos processos da casa
  const { data: processos } = await admin
    .from('processos')
    .select('id, numero_cnj')
    .not('numero_cnj', 'is', null)

  const processoPorDigitos = new Map<string, string>()
  for (const p of processos ?? []) {
    const digitos = (p.numero_cnj as string).replace(/\D/g, '')
    if (digitos) processoPorDigitos.set(digitos, p.id)
  }

  const fim = new Date()
  const inicio = new Date(fim.getTime() - diasRetroativos * 24 * 60 * 60 * 1000)

  let novas = 0
  let vinculadas = 0
  const erros: string[] = []

  for (const adv of advogados) {
    const { itens, erro } = await buscarComunicacoes({
      numeroOab: adv.oab_numero!,
      ufOab: adv.oab_uf!,
      dataInicio: dataISO(inicio),
      dataFim: dataISO(fim),
    })

    if (erro) erros.push(`${adv.nome} (OAB ${adv.oab_numero}/${adv.oab_uf}): ${erro}`)

    const novasDoAdvogado: { tribunal: string; classe: string; cnj: string; data: string; vinculada: boolean }[] = []

    for (const item of itens) {
      // Comunicações canceladas pelo tribunal não interessam
      if (item.status === 'C') continue

      const digitos = (item.numero_processo ?? '').replace(/\D/g, '')
      const processoId = processoPorDigitos.get(digitos) ?? null

      const { error: insertError, data: inserted } = await admin
        .from('intimacoes')
        .insert({
          comunica_id: item.id,
          advogado_id: adv.id,
          processo_id: processoId,
          numero_cnj: item.numeroprocessocommascara || item.numero_processo || null,
          sigla_tribunal: item.siglaTribunal ?? null,
          tipo_comunicacao: item.tipoComunicacao ?? null,
          nome_orgao: item.nomeOrgao ?? null,
          nome_classe: item.nomeClasse ?? null,
          meio: item.meiocompleto || item.meio || null,
          link: item.link ?? null,
          texto: extrairTextoPlano(item.texto),
          data_disponibilizacao: item.data_disponibilizacao,
        })
        .select('id')
        .maybeSingle()

      // 23505 = unique_violation (comunica_id já sincronizado) — esperado, ignora
      if (insertError) {
        if (insertError.code !== '23505') {
          erros.push(`Comunicação ${item.id}: ${insertError.message}`)
        }
        continue
      }

      if (inserted) {
        novas++
        if (processoId) vinculadas++
        novasDoAdvogado.push({
          tribunal: item.siglaTribunal ?? '',
          classe: item.nomeClasse ?? item.tipoComunicacao ?? 'Comunicação',
          cnj: item.numeroprocessocommascara ?? '',
          data: item.data_disponibilizacao ?? '',
          vinculada: !!processoId,
        })
      }
    }

    // Digest por advogado — só quando há novidade
    if (novasDoAdvogado.length > 0 && adv.email) {
      await enviarDigestIntimacoes(adv.email, adv.nome, novasDoAdvogado)
    }

    // Pausa entre advogados para não saturar a API
    await new Promise(r => setTimeout(r, 400))
  }

  return { ok: true, novas, vinculadas, advogadosConsultados: advogados.length, erros }
}

async function enviarDigestIntimacoes(
  email: string,
  nome: string,
  intimacoes: { tribunal: string; classe: string; cnj: string; data: string; vinculada: boolean }[]
) {
  if (!emailConfigurado()) return

  const plural = intimacoes.length > 1
  const itens = intimacoes
    .slice(0, 20)
    .map(i =>
      itemListaHtml(
        `<strong>${escapeHtml(i.tribunal)}</strong> · ${escapeHtml(i.classe)}`,
        [i.cnj && escapeHtml(i.cnj), formatarDataBR(i.data), !i.vinculada && 'processo não cadastrado no sistema']
          .filter(Boolean)
          .join(' · ')
      )
    )
    .join('')

  const excedente = intimacoes.length > 20
    ? `<p style="margin:8px 0 0;font-size:13px;color:#71717a;">…e mais ${intimacoes.length - 20}.</p>`
    : ''

  await enviarEmail({
    para: email,
    assunto: `${intimacoes.length} ${plural ? 'novas intimações' : 'nova intimação'} no DJEN`,
    html: layoutEmail(
      `Olá, ${nome.split(' ')[0]} — ${plural ? 'você tem novas intimações' : 'você tem uma nova intimação'}`,
      `<p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.5;">
        ${plural ? 'Foram publicadas' : 'Foi publicada'} no Diário de Justiça Eletrônico Nacional em seu nome:
      </p>
      ${itens}${excedente}
      ${botaoHtml('Ver intimações', `${getSiteUrl()}/admin/intimacoes`)}`
    ),
  })
}

function formatarDataBR(iso: string): string {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso ?? ''
}

// Botão "Sincronizar agora" na tela de intimações
export async function sincronizarIntimacoesManual(): Promise<SincronizacaoResult> {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const resultado = await sincronizarIntimacoes(7)
  revalidatePath('/admin/intimacoes')
  return resultado
}

export async function marcarIntimacao(id: string, status: StatusIntimacao) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('intimacoes').update({ status }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/intimacoes')
  return { ok: true }
}

// Cria uma tarefa no kanban do usuário logado a partir da intimação e a marca
// como tratada. `prazoISO` vem do diálogo onde o advogado confirmou (ou editou)
// a data sugerida — contagem de prazo processual é decisão jurídica, o sistema
// só sugere, nunca define sozinho.
export async function criarTarefaDeIntimacao(
  intimacaoId: string,
  prazoISO?: string | null,
  prazoContexto?: PrazoContexto | null
) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  if (prazoISO && Number.isNaN(new Date(prazoISO).getTime())) {
    return { error: 'Data de prazo inválida.' }
  }

  const supabase = await createClient()

  const { data: intimacao } = await supabase
    .from('intimacoes')
    .select('id, numero_cnj, sigla_tribunal, tipo_comunicacao, nome_classe, processo_id, texto')
    .eq('id', intimacaoId)
    .single()

  if (!intimacao) return { error: 'Intimação não encontrada.' }

  const titulo = [
    'Tratar intimação',
    intimacao.sigla_tribunal,
    intimacao.numero_cnj,
  ].filter(Boolean).join(' — ')

  const { data: primeira } = await supabase
    .from('tarefas')
    .select('ordem')
    .eq('usuario_id', auth.userId)
    .eq('status', 'a_fazer')
    .order('ordem', { ascending: true })
    .limit(1)
    .maybeSingle()

  const { error: tarefaError } = await supabase.from('tarefas').insert({
    usuario_id: auth.userId,
    titulo,
    descricao: (intimacao.texto ?? '').slice(0, 500) || null,
    processo_id: intimacao.processo_id,
    prazo: prazoISO || null,
    prazo_contexto: prazoISO && prazoContexto ? prazoContexto : null,
    status: 'a_fazer',
    ordem: (primeira?.ordem ?? 1) - 1,
  })

  if (tarefaError) return { error: tarefaError.message }

  await supabase.from('intimacoes').update({ status: 'tratada' }).eq('id', intimacaoId)

  revalidatePath('/admin/intimacoes')
  revalidatePath('/admin/tarefas')
  return { ok: true }
}
