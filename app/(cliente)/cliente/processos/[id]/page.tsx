import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, MessageCircle, Landmark } from 'lucide-react'
import { STATUS_PROCESSO_LABEL, TIPO_DOCUMENTO_LABEL } from '@/lib/types'
import { DocumentoDownloadBtn } from '@/components/cliente/documento-download-btn'
import { AnalisarAndamentoBtn } from '@/components/cliente/analisar-andamento-btn'
import { ProcessoCapa } from '@/components/shared/processo-capa'
import { DatajudTransparencia } from '@/components/shared/datajud-transparencia'
import { traduzirMovimento } from '@/lib/tpu'
import type { DatajudCapa } from '@/lib/datajud'
import { ProcessoEtapas } from '@/components/cliente/processo-etapas'
import type { Processo, EventoLinhaDotTempo, Documento, Observacao, StatusProcesso } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

const STATUS_COR: Record<string, string> = {
  triagem: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  em_analise: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  distribuido: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  em_andamento: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  concluido: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

// Resposta à pergunta que o cliente faria por telefone: "em que pé está?"
const SITUACAO_ATUAL: Record<StatusProcesso, string> = {
  triagem: 'Recebemos sua contratação e estamos organizando a documentação necessária. Em breve ela seguirá para análise da equipe jurídica.',
  em_analise: 'Sua documentação está em análise pela equipe jurídica, que está preparando as próximas providências do seu caso.',
  distribuido: 'Seu processo já foi protocolado na justiça e aguarda os primeiros andamentos do tribunal. Essa etapa pode levar algum tempo — avisaremos qualquer novidade.',
  em_andamento: 'Seu processo está tramitando na justiça. Acompanhamos cada movimentação do tribunal e registramos aqui as novidades.',
  concluido: 'Este processo foi concluído. Os documentos e o histórico continuam disponíveis nesta página.',
}

type ItemTimeline = {
  chave: string
  dataISO: string
  descricao: string
  origem: 'escritorio' | 'tribunal'
  // Versão em linguagem simples (TPU traduzida) — o texto técnico vira apoio
  traducao?: string | null
}

function brParaISO(data: string): string | null {
  const m = data.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}

export default async function ProcessoClientePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: processo } = await supabase
    .from('processos')
    .select('*')
    .eq('id', id)
    .single()

  if (!processo) notFound()

  const p = processo as Processo

  const [
    { data: eventos },
    { data: documentos },
    { data: observacoes },
    { data: ultimaVerificacao },
  ] = await Promise.all([
    supabase.from('linha_do_tempo').select('*').eq('processo_id', id).eq('visivel_cliente', true).order('data_evento', { ascending: false }),
    supabase.from('documentos').select('*').eq('processo_id', id).eq('visivel_cliente', true).order('criado_em', { ascending: false }),
    supabase.from('observacoes').select('*').eq('processo_id', id).eq('visivel_cliente', true).order('criado_em', { ascending: false }),
    supabase.from('verificacoes_datajud').select('ultimo_andamento, verificado_em, houve_movimentacao, raw_response').eq('processo_id', id).order('verificado_em', { ascending: false }).limit(1).single(),
  ])

  const evs = (eventos ?? []) as EventoLinhaDotTempo[]
  const docs = (documentos ?? []) as Documento[]
  const obs = (observacoes ?? []) as Observacao[]

  // ---- Linha do tempo unificada: eventos do escritório + movimentos do tribunal ----
  const rawVerificacao = ultimaVerificacao?.raw_response as {
    fonte?: string
    movimentos?: { data: string; descricao: string; codigo?: number }[]
    capa?: DatajudCapa | null
  } | null
  const movs = rawVerificacao?.movimentos ?? []
  const capa = rawVerificacao?.capa ?? null

  const jaPublicado = new Set(evs.map((ev) => `${ev.data_evento}|${ev.descricao}`))

  const itensTribunal: ItemTimeline[] = []
  movs.forEach((mv, i) => {
    const dataISO = brParaISO(mv.data)
    if (!dataISO) return
    // não repete movimento que o escritório já publicou como evento
    if (jaPublicado.has(`${dataISO}|${mv.descricao}`)) return
    itensTribunal.push({
      chave: `mv-${i}`,
      dataISO,
      descricao: mv.descricao,
      origem: 'tribunal',
      traducao: traduzirMovimento(mv.codigo, mv.descricao),
    })
  })

  const timeline: ItemTimeline[] = [
    ...evs.map((ev): ItemTimeline => ({
      chave: `ev-${ev.id}`,
      dataISO: ev.data_evento,
      descricao: ev.descricao,
      origem: 'escritorio',
    })),
    ...itensTribunal,
  ].sort((a, b) => b.dataISO.localeCompare(a.dataISO))

  const houveNovidade = ultimaVerificacao?.houve_movimentacao ?? false
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_ESCRITORIO ?? '').replace(/\D/g, '')

  return (
    <div className="space-y-6">
      <Link
        href="/cliente"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Meus processos
      </Link>

      {/* Cabeçalho com etapas */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-base font-semibold leading-tight">{p.tipo_servico}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COR[p.status_interno]}`}>
            {STATUS_PROCESSO_LABEL[p.status_interno]}
          </span>
        </div>

        <ProcessoEtapas status={p.status_interno} />

        {(p.numero_cnj || p.tribunal || p.vara_orgao) && (
          <div className="space-y-1 text-sm text-muted-foreground pt-1 border-t">
            {p.numero_cnj && <p className="font-mono text-xs pt-2">{p.numero_cnj}</p>}
            {p.tribunal && <p>{p.tribunal}{p.vara_orgao ? ` · ${p.vara_orgao}` : ''}</p>}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Contratado em {new Date(p.data_contratacao + 'T12:00:00').toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* Dados de capa registrados no tribunal */}
      {capa && <ProcessoCapa capa={capa} />}

      {/* O que acontece agora */}
      <div className="rounded-xl border bg-primary/5 border-primary/20 p-4 space-y-1">
        <h2 className="text-sm font-semibold">O que acontece agora?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{SITUACAO_ATUAL[p.status_interno]}</p>
        {ultimaVerificacao && (
          <p className="text-xs text-muted-foreground pt-1">
            Última consulta ao tribunal em{' '}
            {new Date(ultimaVerificacao.verificado_em).toLocaleString('pt-BR', {
              day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {ultimaVerificacao && (
        <DatajudTransparencia
          fonte={rawVerificacao?.fonte}
          verificadoEm={ultimaVerificacao.verificado_em}
        />
      )}

      {/* Linha do tempo unificada */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Andamentos</h2>
          {houveNovidade && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400">
              Novidade
            </span>
          )}
        </div>

        {p.numero_cnj && <AnalisarAndamentoBtn processoId={id} autoFetch={!ultimaVerificacao} />}

        {timeline.length > 0 ? (
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {timeline.map((item, i) => {
                const novo = i === 0 && houveNovidade && item.origem === 'tribunal'
                return (
                  <div key={item.chave} className="relative flex gap-4">
                    <div className={`mt-1.5 h-3 w-3 rounded-full shrink-0 z-10 ${novo ? 'bg-green-500' : 'bg-primary'}`} />
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <time className="text-xs text-muted-foreground">
                          {new Date(item.dataISO + 'T12:00:00').toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'long', year: 'numeric',
                          })}
                        </time>
                        {item.origem === 'tribunal' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground border rounded-full px-1.5 py-0.5">
                            <Landmark className="h-2.5 w-2.5" />
                            Atualização do tribunal
                          </span>
                        )}
                        {novo && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400">
                            Novo
                          </span>
                        )}
                      </div>
                      {item.traducao ? (
                        <>
                          <p className="text-sm mt-0.5 leading-relaxed">{item.traducao}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Registro do tribunal: {item.descricao}</p>
                        </>
                      ) : (
                        <p className="text-sm mt-0.5 leading-relaxed">{item.descricao}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-3">Nenhum andamento disponível ainda.</p>
        )}
      </section>

      {/* Observações públicas */}
      {obs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Observações</h2>
          <div className="space-y-2">
            {obs.map((o) => (
              <div key={o.id} className="rounded-xl border bg-card p-3 text-sm leading-relaxed">
                {o.texto}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Documentos */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documentos</h2>
        {docs.length > 0 ? (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.nome_arquivo}</p>
                  <p className="text-xs text-muted-foreground">{TIPO_DOCUMENTO_LABEL[doc.tipo]}</p>
                </div>
                <DocumentoDownloadBtn urlStorage={doc.url_storage} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-3">Nenhum documento disponível ainda.</p>
        )}
      </section>

      {/* Contato com o escritório */}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre meu processo${p.numero_cnj ? ` ${p.numero_cnj}` : ` de ${p.tipo_servico}`}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-green-600/30 bg-green-50 dark:bg-green-950/30 p-3 text-sm font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          Falar com o escritório pelo WhatsApp
        </a>
      )}
    </div>
  )
}
