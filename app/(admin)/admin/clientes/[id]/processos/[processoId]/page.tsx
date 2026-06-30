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
  ] = await Promise.all([
    supabase.from('processos').select('*').eq('id', processoId).single(),
    supabase.from('clientes').select('id, nome').eq('id', clienteId).single(),
    supabase.from('linha_do_tempo').select('*, autor:criado_por(id, nome)').eq('processo_id', processoId).order('data_evento', { ascending: false }),
    supabase.from('observacoes').select('*, autor:autor_id(id, nome)').eq('processo_id', processoId).order('criado_em', { ascending: false }),
    supabase.from('documentos').select('*').eq('processo_id', processoId).order('criado_em', { ascending: false }),
    supabase.from('usuarios').select('id, nome').in('papel', ['admin', 'advogado']).order('nome'),
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
          {p.numero_cnj && <p className="text-sm font-mono text-muted-foreground mt-1">{p.numero_cnj}</p>}
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COR[p.status_interno]}`}>
          {STATUS_PROCESSO_LABEL[p.status_interno]}
        </span>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Linha do tempo ({evs.length})</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({docs.length})</TabsTrigger>
          <TabsTrigger value="observacoes">Observações ({obs.length})</TabsTrigger>
          <TabsTrigger value="dados">Dados do processo</TabsTrigger>
        </TabsList>

        {/* ABA LINHA DO TEMPO */}
        <TabsContent value="timeline" className="mt-6 space-y-4 max-w-2xl">
          <AdicionarEventoForm processoId={processoId} clienteId={clienteId} />
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
        <TabsContent value="documentos" className="mt-6 space-y-3 max-w-2xl">
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
        <TabsContent value="observacoes" className="mt-6 space-y-4 max-w-2xl">
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

        {/* ABA DADOS */}
        <TabsContent value="dados" className="mt-6 max-w-lg">
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
