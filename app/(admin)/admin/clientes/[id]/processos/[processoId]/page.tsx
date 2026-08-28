import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProcessoForm } from '@/components/admin/processo-form'
import { AdicionarEventoForm, RemoverEventoBtn } from '@/components/admin/evento-form'
import { ObservacaoForm, RemoverObservacaoBtn } from '@/components/admin/observacao-form'
import { DocumentoUpload, DocumentoItem } from '@/components/admin/documento-upload'
import { VerificarDatajudBtn } from '@/components/admin/verificar-datajud-btn'
import { PortaisTribunal } from '@/components/shared/portais-tribunal'
import { PublicarMovimentoBtn } from '@/components/admin/publicar-movimento-btn'
import { ProcessoCapa } from '@/components/shared/processo-capa'
import { DatajudTransparencia } from '@/components/shared/datajud-transparencia'
import type { DatajudCapa } from '@/lib/datajud'
import { AutoScrollTo } from '@/components/shared/auto-scroll-to'
import { STATUS_PROCESSO_LABEL } from '@/lib/types'
import type { CalendarioForense, Processo, Cliente, EventoLinhaDotTempo, Observacao, Documento, Usuario } from '@/lib/types'

interface Props {
  params: Promise<{ id: string; processoId: string }>
}

const STATUS_COR: Record<string, string> = {
  triagem: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  em_analise: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  distribuido: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  em_andamento: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  concluido: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

function parseDateBR(dataBR: string, hora?: string): Date {
  const parts = dataBR.split('/')
  if (parts.length !== 3) return new Date(0)
  const [d, m, y] = parts
  const ts = hora ? `T${hora}:00` : 'T12:00:00'
  return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}${ts}`)
}

export default async function ProcessoDetailPage({ params }: Props) {
  const { id: clienteId, processoId } = await params
  const supabase = await createClient()

  const [
    { data: processo },
    { data: cliente },
    { data: eventos },
    { data: observacoes },
    { data: documentos },
    { data: advogados },
    { data: calendarios },
    { data: ultimaVerificacao },
    { count: novasMovimentacoes },
  ] = await Promise.all([
    supabase.from('processos').select('*').eq('id', processoId).single(),
    supabase.from('clientes').select('id, nome').eq('id', clienteId).single(),
    supabase.from('linha_do_tempo').select('*, autor:criado_por(id, nome)').eq('processo_id', processoId).order('data_evento', { ascending: false }),
    supabase.from('observacoes').select('*, autor:autor_id(id, nome)').eq('processo_id', processoId).order('criado_em', { ascending: false }),
    supabase.from('documentos').select('*').eq('processo_id', processoId).order('criado_em', { ascending: false }),
    supabase.from('usuarios').select('id, nome').in('papel', ['admin', 'advogado']).order('nome'),
    supabase.from('calendarios_forenses').select('id, nome, uf, comarca').eq('ativo', true).not('versao_ativa_id', 'is', null).order('nome'),
    supabase.from('verificacoes_datajud').select('*').eq('processo_id', processoId).order('verificado_em', { ascending: false }).limit(1).single(),
    supabase.from('verificacoes_datajud').select('*', { count: 'exact', head: true }).eq('processo_id', processoId).eq('houve_movimentacao', true),
  ])

  if (!processo || !cliente) notFound()

  const p = processo as Processo
  const c = cliente as Cliente
  const evs = (eventos ?? []) as (EventoLinhaDotTempo & { autor: Pick<Usuario, 'id' | 'nome'> | null })[]
  const obs = (observacoes ?? []) as (Observacao & { autor: Pick<Usuario, 'id' | 'nome'> | null })[]
  const docs = (documentos ?? []) as Documento[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawVerif = ultimaVerificacao?.raw_response as any
  const ultimaFonte = rawVerif?.fonte as string | undefined
  const capaDatajud = rawVerif?.capa as DatajudCapa | null | undefined
  const linkTribunal = rawVerif?.linkTribunal as string | null | undefined
  const movimentos = (rawVerif?.movimentos ?? []) as { data: string; hora?: string; descricao: string; orgao?: string }[]
  const isNovaMov = ultimaVerificacao?.houve_movimentacao ?? false
  const semDadosDatajud = ultimaVerificacao && !ultimaVerificacao.ultimo_andamento && movimentos.length === 0 && !capaDatajud

  // ─── Unified andamentos: merge manual events + Datajud movements ───────────
  type AndamentoItem =
    | { tipo: 'evento'; data: Date; ev: typeof evs[0] }
    | { tipo: 'movimento'; data: Date; mov: typeof movimentos[0]; isNovo: boolean }

  const andamentos: AndamentoItem[] = [
    ...evs.map(ev => ({
      tipo: 'evento' as const,
      data: new Date(ev.data_evento + 'T12:00:00'),
      ev,
    })),
    ...movimentos.map((mov, i) => ({
      tipo: 'movimento' as const,
      data: parseDateBR(mov.data, mov.hora),
      mov,
      isNovo: i === 0 && isNovaMov,
    })),
  ].sort((a, b) => b.data.getTime() - a.data.getTime())

  const defaultTab = isNovaMov && p.numero_cnj ? 'andamentos' : 'andamentos'

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin/clientes" className="hover:text-foreground">Clientes</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/admin/clientes/${clienteId}`} className="hover:text-foreground">{c.nome}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{p.tipo_servico}</span>
      </nav>

      {/* Cabeçalho do processo */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">{p.tipo_servico}</h1>
          {p.numero_cnj && (
            <p className="mt-1 text-sm font-mono text-muted-foreground">{p.numero_cnj}</p>
          )}
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COR[p.status_interno]}`}>
          {STATUS_PROCESSO_LABEL[p.status_interno]}
        </span>
      </div>

      {isNovaMov && p.numero_cnj && (
        <AutoScrollTo targetId="andamentos-section" delay={150} />
      )}

      {/* Registrar andamento */}
      <div className="max-w-4xl">
        <AdicionarEventoForm processoId={processoId} clienteId={clienteId} />
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="andamentos" className="relative">
            Andamentos
            {(novasMovimentacoes ?? 0) > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {novasMovimentacoes}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({docs.length})</TabsTrigger>
          <TabsTrigger value="observacoes">Observações ({obs.length})</TabsTrigger>
          <TabsTrigger value="dados">Dados do processo</TabsTrigger>
        </TabsList>

        {/* ── Datajud controls — fixos abaixo das abas ─────────────────────── */}
        {p.numero_cnj && (
          <div id="andamentos-section" className="mt-4 space-y-3 max-w-3xl">
            {/* Portais dos tribunais competentes */}
            <PortaisTribunal numero={p.numero_cnj} />

            {/* Análise Datajud */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <DatajudTransparencia
                    fonte={ultimaFonte}
                    verificadoEm={ultimaVerificacao?.verificado_em}
                    compacta
                  />
                </div>
              </div>

              <VerificarDatajudBtn processoId={processoId} autoFetch={!ultimaVerificacao} />

              {semDadosDatajud && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span>⚠</span>
                  <span>Datajud ainda não indexou este processo.</span>
                  {linkTribunal && (
                    <a
                      href={linkTribunal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-80"
                    >
                      Consultar no portal do tribunal
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </p>
              )}

              {capaDatajud && <ProcessoCapa capa={capaDatajud} />}
            </div>
          </div>
        )}

        {/* ABA ANDAMENTOS — unified timeline ──────────────────────────────── */}
        <TabsContent value="andamentos" className="mt-6 max-w-4xl">
          {andamentos.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />
              <div className="space-y-3">
                {andamentos.map((item, idx) => {
                  if (item.tipo === 'evento') {
                    const ev = item.ev
                    return (
                      <div key={`ev-${ev.id}`} className="relative flex gap-3">
                        <div className={`mt-3 h-3.5 w-3.5 rounded-full shrink-0 border-2 z-10 ${
                          ev.visivel_cliente
                            ? 'bg-primary border-primary'
                            : 'bg-background border-muted-foreground'
                        }`} />
                        <div className="flex-1 rounded-lg border bg-card p-3 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <time className="text-xs text-muted-foreground">
                                {new Date(ev.data_evento + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </time>
                              {!ev.visivel_cliente ? (
                                <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                                  <EyeOff className="h-3 w-3" /> interno
                                </span>
                              ) : (
                                <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                                  <Eye className="h-3 w-3" /> visível ao cliente
                                </span>
                              )}
                            </div>
                            <RemoverEventoBtn eventoId={ev.id} processoId={processoId} clienteId={clienteId} />
                          </div>
                          <p className="text-sm">{ev.descricao}</p>
                          {ev.autor && (
                            <p className="text-xs text-muted-foreground">{ev.autor.nome}</p>
                          )}
                        </div>
                      </div>
                    )
                  }

                  // movimento_tribunal
                  const { mov, isNovo } = item
                  return (
                    <div key={`mov-${idx}`} className="relative flex gap-3">
                      <div className={`mt-3 h-3.5 w-3.5 rounded-full shrink-0 border-2 z-10 ${
                        isNovo
                          ? 'bg-green-500 border-green-500'
                          : 'bg-blue-500/20 border-blue-400/60'
                      }`} />
                      <div className={`flex-1 rounded-lg border p-3 space-y-1 ${
                        isNovo
                          ? 'border-green-400/50 bg-green-50 dark:border-green-700/50 dark:bg-green-950/30'
                          : 'bg-card'
                      }`}>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <time className={`text-xs font-medium ${
                            isNovo ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
                          }`}>
                            {mov.data}
                            {mov.hora && <span className="font-normal opacity-70"> às {mov.hora}</span>}
                          </time>
                          <div className="flex items-center gap-1.5">
                            {isNovo && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400">
                                Novo
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground/50 border rounded px-1.5 py-0.5">
                              Tribunal
                            </span>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed">{mov.descricao}</p>
                        {mov.orgao && (
                          <p className="text-xs text-muted-foreground">{mov.orgao}</p>
                        )}
                        <div className="pt-1">
                          <PublicarMovimentoBtn
                            processoId={processoId}
                            clienteId={clienteId}
                            movimento={mov}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              Nenhum andamento registrado ainda.
              {p.numero_cnj && ' Use "Analisar andamento" acima para buscar no Datajud.'}
            </p>
          )}
        </TabsContent>

        {/* ABA DOCUMENTOS ──────────────────────────────────────────────────── */}
        <TabsContent value="documentos" className="mt-6 space-y-3 max-w-4xl">
          <DocumentoUpload processoId={processoId} clienteId={clienteId} />
          {docs.length > 0 ? (
            <div className="space-y-2 mt-2">
              {docs.map((doc) => (
                <DocumentoItem key={doc.id} doc={doc} clienteId={clienteId} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Nenhum documento enviado.</p>
          )}
        </TabsContent>

        {/* ABA OBSERVAÇÕES ─────────────────────────────────────────────────── */}
        <TabsContent value="observacoes" className="mt-6 space-y-4 max-w-4xl">
          <ObservacaoForm processoId={processoId} clienteId={clienteId} />
          {obs.length > 0 ? (
            <div className="space-y-3">
              {obs.map((o) => (
                <div key={o.id} className="rounded-lg border p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {o.visivel_cliente
                        ? <Eye className="h-3.5 w-3.5 text-primary" />
                        : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground">
                        {o.visivel_cliente ? 'Visível ao cliente' : 'Interno'}
                      </span>
                    </div>
                    <RemoverObservacaoBtn obsId={o.id} processoId={processoId} clienteId={clienteId} />
                  </div>
                  <p className="text-sm">{o.texto}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.autor?.nome} · {new Date(o.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Nenhuma observação registrada.</p>
          )}
        </TabsContent>

        {/* ABA DADOS ───────────────────────────────────────────────────────── */}
        <TabsContent value="dados" className="mt-6 max-w-2xl">
          <ProcessoForm
            clienteId={clienteId}
            processo={p}
            advogados={(advogados ?? []) as Pick<Usuario, 'id' | 'nome'>[]}
            calendarios={(calendarios ?? []) as Pick<CalendarioForense, 'id' | 'nome' | 'uf' | 'comarca'>[]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
