import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, Download } from 'lucide-react'
import { STATUS_PROCESSO_LABEL, TIPO_DOCUMENTO_LABEL } from '@/lib/types'
import { DocumentoDownloadBtn } from '@/components/cliente/documento-download-btn'
import type { Processo, EventoLinhaDotTempo, Documento, Observacao } from '@/lib/types'

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

export default async function ProcessoClientePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verifica que o processo pertence ao cliente logado (RLS já garante, mas valida a existência)
  const { data: processo } = await supabase
    .from('processos')
    .select('*')
    .eq('id', id)
    .single()

  if (!processo) notFound()

  const p = processo as Processo

  const [{ data: eventos }, { data: documentos }, { data: observacoes }] = await Promise.all([
    supabase
      .from('linha_do_tempo')
      .select('*')
      .eq('processo_id', id)
      .eq('visivel_cliente', true)
      .order('data_evento', { ascending: false }),
    supabase
      .from('documentos')
      .select('*')
      .eq('processo_id', id)
      .eq('visivel_cliente', true)
      .order('criado_em', { ascending: false }),
    supabase
      .from('observacoes')
      .select('*')
      .eq('processo_id', id)
      .eq('visivel_cliente', true)
      .order('criado_em', { ascending: false }),
  ])

  const evs = (eventos ?? []) as EventoLinhaDotTempo[]
  const docs = (documentos ?? []) as Documento[]
  const obs = (observacoes ?? []) as Observacao[]

  return (
    <div className="space-y-6">
      {/* Voltar */}
      <Link
        href="/cliente"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Meus processos
      </Link>

      {/* Cabeçalho */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-base font-semibold leading-tight">{p.tipo_servico}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COR[p.status_interno]}`}>
            {STATUS_PROCESSO_LABEL[p.status_interno]}
          </span>
        </div>
        {(p.numero_cnj || p.tribunal || p.vara_orgao) && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {p.numero_cnj && <p className="font-mono text-xs">{p.numero_cnj}</p>}
            {p.tribunal && <p>{p.tribunal}{p.vara_orgao ? ` · ${p.vara_orgao}` : ''}</p>}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Contratado em {new Date(p.data_contratacao + 'T12:00:00').toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* Linha do tempo */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Andamentos</h2>
        {evs.length > 0 ? (
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {evs.map((ev) => (
                <div key={ev.id} className="relative flex gap-4">
                  <div className="mt-1.5 h-3 w-3 rounded-full bg-primary shrink-0 z-10" />
                  <div className="flex-1 pb-1">
                    <time className="text-xs text-muted-foreground">
                      {new Date(ev.data_evento + 'T12:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'long', year: 'numeric'
                      })}
                    </time>
                    <p className="text-sm mt-0.5 leading-relaxed">{ev.descricao}</p>
                  </div>
                </div>
              ))}
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
    </div>
  )
}
