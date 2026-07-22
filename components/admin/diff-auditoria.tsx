'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'

function valor(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'sim' : 'não'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

// Campos internos que não interessam na leitura do diff
const OCULTOS = new Set(['atualizado_em', 'atualizado_por'])

export function DiffAuditoria({ tabela, acao, diff, usuario, quando }: {
  tabela: string
  acao: 'update' | 'delete'
  diff: Record<string, { de: unknown; para: unknown }> | Record<string, unknown>
  usuario: string
  quando: string
}) {
  const [aberto, setAberto] = useState(false)

  const entradas = acao === 'update'
    ? Object.entries(diff as Record<string, { de: unknown; para: unknown }>).filter(([k]) => !OCULTOS.has(k))
    : []
  const campos = entradas.map(([k]) => k).join(', ')

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <button
        onClick={() => setAberto(v => !v)}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <div className="flex items-start gap-2 min-w-0">
          {acao === 'delete'
            ? <Trash2 className="h-3.5 w-3.5 mt-0.5 text-destructive shrink-0" />
            : <Pencil className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-medium">{usuario}</span>
              {acao === 'delete' ? ' excluiu ' : ' alterou '}
              <span className="font-medium">{tabela.toLowerCase()}</span>
              {acao === 'update' && campos && (
                <span className="text-muted-foreground"> — {campos}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(quando).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        {aberto ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {aberto && (
        acao === 'update' ? (
          <div className="rounded-md border divide-y text-xs">
            {entradas.map(([campo, mudanca]) => (
              <div key={campo} className="grid grid-cols-[auto_1fr_1fr] gap-2 px-2.5 py-1.5 items-baseline">
                <span className="font-medium">{campo}</span>
                <span className="text-red-600 dark:text-red-400 line-through break-all">{valor(mudanca.de)}</span>
                <span className="text-emerald-600 dark:text-emerald-400 break-all">{valor(mudanca.para)}</span>
              </div>
            ))}
          </div>
        ) : (
          <pre className="rounded-md border bg-muted/40 p-2.5 text-xs overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(diff, null, 2)}
          </pre>
        )
      )}
    </div>
  )
}
