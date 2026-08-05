'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react'

function valor(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'sim' : 'não'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const OCULTOS = new Set(['atualizado_em', 'atualizado_por', 'criado_em', 'criado_por'])

const ACAO_VERBO: Record<'insert' | 'update' | 'delete', string> = {
  insert: 'adicionou',
  update: 'alterou',
  delete: 'excluiu',
}

export function DiffAuditoria({ tabela, acao, diff, usuario, papel, quando }: {
  tabela: string
  acao: 'insert' | 'update' | 'delete'
  diff: Record<string, { de: unknown; para: unknown }> | Record<string, unknown>
  usuario: string
  papel?: string | null
  quando: string
}) {
  const [aberto, setAberto] = useState(false)

  const entradas = acao === 'update'
    ? Object.entries(diff as Record<string, { de: unknown; para: unknown }>).filter(([k]) => !OCULTOS.has(k))
    : acao === 'insert'
      ? Object.entries(diff as Record<string, unknown>).filter(([k]) => !OCULTOS.has(k) && k !== 'id')
      : []
  const campos = entradas.map(([k]) => k).join(', ')

  const Icon = acao === 'delete' ? Trash2 : acao === 'insert' ? Plus : Pencil
  const iconClass =
    acao === 'delete'
      ? 'text-destructive'
      : acao === 'insert'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-muted-foreground'

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <div className="flex items-start gap-2 min-w-0">
          <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${iconClass}`} />
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-medium">{usuario}</span>
              {papel && (
                <span className="text-muted-foreground"> ({papel})</span>
              )}
              {' '}
              {ACAO_VERBO[acao]}{' '}
              <span className="font-medium">{tabela.toLowerCase()}</span>
              {acao === 'update' && campos && (
                <span className="text-muted-foreground"> — {campos}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(quando).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        {aberto ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {aberto && (
        acao === 'update' ? (
          <div className="rounded-md border divide-y text-xs">
            {entradas.map(([campo, mudanca]) => {
              const m = mudanca as { de: unknown; para: unknown }
              return (
              <div key={campo} className="grid grid-cols-[auto_1fr_1fr] gap-2 px-2.5 py-1.5 items-baseline">
                <span className="font-medium">{campo}</span>
                <span className="text-red-600 dark:text-red-400 line-through break-all">{valor(m.de)}</span>
                <span className="text-emerald-600 dark:text-emerald-400 break-all">{valor(m.para)}</span>
              </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-md border divide-y text-xs">
            {entradas.length > 0 ? (
              entradas.map(([campo, val]) => (
                <div key={campo} className="grid grid-cols-[auto_1fr] gap-2 px-2.5 py-1.5 items-baseline">
                  <span className="font-medium">{campo}</span>
                  <span className="break-all text-muted-foreground">{valor(val)}</span>
                </div>
              ))
            ) : (
              <pre className="bg-muted/40 p-2.5 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(diff, null, 2)}
              </pre>
            )}
          </div>
        )
      )}
    </div>
  )
}
