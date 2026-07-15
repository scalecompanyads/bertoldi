import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Eye, EyeOff } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProcessoForm } from '@/components/admin/processo-form'
import { AdicionarEventoForm, RemoverEventoBtn } from '@/components/admin/evento-form'
import { ObservacaoForm, RemoverObservacaoBtn } from '@/components/admin/observacao-form'
import { DocumentoUpload, DocumentoItem } from '@/components/admin/documento-upload'
import { TribunalBadge } from '@/components/admin/tribunal-badge'
import { VerificarDatajudBtn } from '@/components/admin/verificar-datajud-btn'
import { MovimentoTimeline } from '@/components/shared/movimento-timeline'
import { AutoScrollTo } from '@/components/shared/auto-scroll-to'
import { STATUS_PROCESSO_LABEL } from '@/lib/types'
import type { Processo, Cliente, EventoLinhaDotTempo, Observacao, Documento, Usuario } from '@/lib/types'

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
    { data: ultimaVerificacao },
    { count: novasMovimentacoes },
  ] = await Promise.all([
    supabase.from('processos').select('*').eq('id', processoId).single(),
    supabase.from('clientes').select('id, nome').eq('id', clienteId).single(),
    supabase.from('linha_do_tempo').select('*, autor:criado_por(id, nome)').eq('processo_id', processoId).order('data_evento', { ascending: false }),
    supabase.from('observacoes').select('*, autor:autor_id(id, nome)').eq('processo_id', processoId).order('criado_em', { ascending: false }),
    supabase.from('documentos').select('*').eq('processo_id', processoId).order('criado_em', { ascending: false }),
    supabase.from('usuarios').select('id, nome').in('papel', ['admin', 'advogado']).order('nome'),
    supabase.from('verificacoes_datajud').select('*').eq('processo_id', processoId).order('verificado_em', { ascending: false }).limit(1).single(),
    supabase.from('verificacoes_datajud').select('*', { count: 'exact', head: true }).eq('processo_id', processoId).eq('houve_movimentacao', true),
  ])

  if (!processo || !cliente) notFound()

  const p = processo as Processo
  const c = cliente as Cliente
  const evs = (eventos ?? []) as (EventoLinhaDotTempo & { autor: Pick<Usuario, 'id' | 'nome'> | null })[]
  const obs = (observacoes ?? []) as (Observacao & { autor: Pick<Usuario, 'id' | 'nome'> | null })[]
  const docs = (documentos ?? []) as Documento[]


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
            <div className="mt-1.5 space-y-1.5">
              <p className="text-sm font-mono text-muted-foreground">{p.numero_cnj}</p>
              <TribunalBadge numero={p.numero_cnj} />
            </div>
          )}
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COR[p.status_interno]}`}>
          {STATUS_PROCESSO_LABEL[p.status_interno]}
        </span>
      </div>

      {ultimaVerificacao?.houve_movimentacao && p.numero_cnj && (
        <AutoScrollTo targetId="datajud-section" delay={150} />
      )}

      {/* Registrar andamento — sempre à mão, sem precisar achar a aba */}
      <div className="max-w-4xl">
        <AdicionarEventoForm processoId={processoId} clienteId={clienteId} />
      </div>

      <Tabs defaultValue={ultimaVerificacao?.houve_movimentacao && p.numero_cnj ? 'datajud' : 'timeline'}>
        <TabsList>
          <TabsTrigger value="timeline">Linha do tempo ({evs.length})</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({docs.length})</TabsTrigger>
          <TabsTrigger value="observacoes">Observações ({obs.length})</TabsTrigger>
          {p.numero_cnj && (
            <TabsTrigger value="datajud" className="relative">
              Datajud
              {(novasMovimentacoes ?? 0) > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {novasMovimentacoes}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="dados">Dados do processo</TabsTrigger>
        </TabsList>

        {/* ABA LINHA DO TEMPO */}
        <TabsContent value="timeline" className="mt-6 space-y-4 max-w-4xl">
          {evs.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {evs.map((ev) => (
                  <div key={ev.id} className="relative flex gap-4">
                    <div className={`mt-1 h-3.5 w-3.5 rounded-full shrink-0 border-2 z-10 ${ev.visivel_cliente ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'}`} />
                    <div className="flex-1 pb-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <time className="text-xs text-muted-foreground">
                            {new Date(ev.data_evento + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </time>
                          {!ev.visivel_cliente && (
                            <span className="ml-2 text-xs text-muted-foreground/70">(interno)</span>
                          )}
                        </div>
                        <RemoverEventoBtn eventoId={ev.id} processoId={processoId} clienteId={clienteId} />
                      </div>
                      <p className="text-sm mt-0.5">{ev.descricao}</p>
                      {ev.autor && <p className="text-xs text-muted-foreground mt-1">{ev.autor.nome}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Nenhum evento registrado.</p>
          )}
        </TabsContent>

        {/* ABA DOCUMENTOS */}
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

        {/* ABA OBSERVAÇÕES */}
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

        {/* ABA DATAJUD */}
        {p.numero_cnj && (
          <TabsContent id="datajud-section" value="datajud" className="mt-6 max-w-3xl space-y-5">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Análise de andamento</h3>
              <p className="text-xs text-muted-foreground">
                Consulta automática no portal do tribunal (eSAJ) ou via Datajud/CNJ, conforme o tribunal.
                Cache de 48h — use "Forçar atualização" quando precisar de dado imediato.
              </p>
            </div>

            {/* Última verificação */}
            {ultimaVerificacao ? (() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const movs = (ultimaVerificacao.raw_response as any)?.movimentos as { data: string; descricao: string }[] | undefined
              return (
                <div className="space-y-3">
                  {/* Status */}
                  <div className={`rounded-lg border p-3 flex items-start gap-2.5 text-sm ${
                    ultimaVerificacao.houve_movimentacao
                      ? 'border-green-400/50 bg-green-50 dark:border-green-700/50 dark:bg-green-950/30'
                      : 'bg-muted/40'
                  }`}>
                    {ultimaVerificacao.houve_movimentacao && (
                      <div className="h-2 w-2 rounded-full bg-green-500 shrink-0 mt-1.5" />
                    )}
                    <div className="space-y-0.5">
                      {ultimaVerificacao.houve_movimentacao ? (
                        <p className="font-medium text-green-700 dark:text-green-400">Nova movimentação detectada</p>
                      ) : (
                        <p className="text-muted-foreground">Sem novidades na última verificação.</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(ultimaVerificacao.verificado_em).toLocaleString('pt-BR')}
                        {' '}&mdash;{' '}
                        <span className="capitalize">{ultimaVerificacao.origem}</span>
                      </p>
                    </div>
                  </div>

                  {/* Timeline */}
                  {movs && movs.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Histórico — {movs.length} movimentações
                      </p>
                      <MovimentoTimeline
                        movimentos={movs}
                        novaMovimentacao={ultimaVerificacao.houve_movimentacao}
                        publicarEm={{ processoId, clienteId }}
                      />
                    </div>
                  ) : ultimaVerificacao.ultimo_andamento ? (
                    <p className="text-sm text-muted-foreground">{ultimaVerificacao.ultimo_andamento}</p>
                  ) : null}
                </div>
              )
            })() : (
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Nenhuma verificação realizada ainda.</p>
              </div>
            )}

            <VerificarDatajudBtn processoId={processoId} autoFetch={!ultimaVerificacao} />
          </TabsContent>
        )}

        {/* ABA DADOS */}
        <TabsContent value="dados" className="mt-6 max-w-2xl">
          <ProcessoForm
            clienteId={clienteId}
            processo={p}
            advogados={(advogados ?? []) as Pick<Usuario, 'id' | 'nome'>[]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
