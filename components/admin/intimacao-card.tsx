'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Landmark,
  ListTodo,
  User,
} from 'lucide-react'
import { marcarIntimacao, criarTarefaDeIntimacao } from '@/lib/actions/intimacoes'
import type { Intimacao } from '@/lib/types'

// data_disponibilizacao é date pura (aaaa-mm-dd) — formatar sem new Date()
// para não deslocar um dia por fuso horário
function formatarData(iso: string): string {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

export function IntimacaoCard({ intimacao: i }: { intimacao: Intimacao }) {
  const [expandido, setExpandido] = useState(false)
  const [loading, setLoading] = useState<'lida' | 'tarefa' | null>(null)

  const naoLida = i.status === 'nao_lida'
  const textoLongo = (i.texto?.length ?? 0) > 280

  async function marcarLida() {
    setLoading('lida')
    const res = await marcarIntimacao(i.id, 'lida')
    if (res.error) toast.error(res.error)
    setLoading(null)
  }

  async function criarTarefa() {
    setLoading('tarefa')
    const res = await criarTarefaDeIntimacao(i.id)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Tarefa criada no seu kanban. Defina o prazo ao revisá-la.')
    }
    setLoading(null)
  }

  return (
    <div className={`rounded-lg border p-4 space-y-2 ${naoLida ? 'border-primary/40 bg-primary/5' : ''}`}>
      {/* Cabeçalho: badges + data */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {naoLida && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
              Nova
            </span>
          )}
          {i.status === 'tratada' && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400">
              Tratada
            </span>
          )}
          {i.sigla_tribunal && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground border rounded-full px-2 py-0.5">
              <Landmark className="h-3 w-3" />
              {i.sigla_tribunal}
            </span>
          )}
          {i.tipo_comunicacao && (
            <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">
              {i.tipo_comunicacao}
            </span>
          )}
        </div>
        <time className="text-xs text-muted-foreground shrink-0">
          {formatarData(i.data_disponibilizacao)}
        </time>
      </div>

      {/* Processo + classe */}
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">
          {i.nome_classe || 'Comunicação'}
          {i.numero_cnj && <span className="font-mono font-normal text-xs text-muted-foreground"> · {i.numero_cnj}</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {i.nome_orgao}
          {i.advogado?.nome && <> · Intimado: {i.advogado.nome}</>}
        </p>
        {i.processo ? (
          <Link
            href={`/admin/clientes/${i.processo.cliente_id}/processos/${i.processo.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <User className="h-3 w-3" />
            {i.processo.clientes?.nome ?? 'Ver processo'} — {i.processo.tipo_servico}
          </Link>
        ) : (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Processo não cadastrado no sistema
          </p>
        )}
      </div>

      {/* Texto da publicação */}
      {i.texto && (
        <div className="space-y-1">
          <p className={`text-sm leading-relaxed text-muted-foreground ${!expandido && textoLongo ? 'line-clamp-3' : ''}`}>
            {i.texto}
          </p>
          {textoLongo && (
            <button
              onClick={() => setExpandido(v => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {expandido ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expandido ? 'Recolher' : 'Ler íntegra'}
            </button>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-3 pt-1 flex-wrap">
        {naoLida && (
          <button
            onClick={marcarLida}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            {loading === 'lida' ? 'Marcando...' : 'Marcar como lida'}
          </button>
        )}
        {i.status !== 'tratada' && (
          <button
            onClick={criarTarefa}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <ListTodo className="h-3.5 w-3.5" />
            {loading === 'tarefa' ? 'Criando...' : 'Criar tarefa'}
          </button>
        )}
        {i.link && (
          <a
            href={i.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver no portal
          </a>
        )}
      </div>
    </div>
  )
}
