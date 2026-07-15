'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PublicarMovimentoBtn } from '@/components/admin/publicar-movimento-btn'

interface Movimento {
  data: string
  hora?: string
  descricao: string
  orgao?: string
}

interface Props {
  movimentos: Movimento[]
  novaMovimentacao?: boolean
  /** Quando informados, exibe o botão "Publicar para o cliente" (uso no admin) */
  publicarEm?: { processoId: string; clienteId: string }
}

const VISIVEIS_INICIALMENTE = 15

export function MovimentoTimeline({ movimentos, novaMovimentacao, publicarEm }: Props) {
  const [expandido, setExpandido] = useState(false)

  if (movimentos.length === 0) return null

  const visiveis = expandido ? movimentos : movimentos.slice(0, VISIVEIS_INICIALMENTE)
  const ocultos = movimentos.length - visiveis.length

  return (
    <div className="relative">
      {/* Linha vertical */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

      <div className="space-y-3">
        {visiveis.map((mv, i) => {
          const isNovo = i === 0 && novaMovimentacao
          return (
            <div key={i} className="relative flex gap-3">
              {/* Dot */}
              <div
                className={`mt-3 h-3.5 w-3.5 rounded-full shrink-0 border-2 z-10 ${
                  isNovo
                    ? 'bg-green-500 border-green-500'
                    : 'bg-background border-muted-foreground/40'
                }`}
              />

              {/* Card */}
              <div
                className={`flex-1 rounded-lg border p-3 space-y-1 ${
                  isNovo
                    ? 'border-green-400/50 bg-green-50 dark:border-green-700/50 dark:bg-green-950/30'
                    : 'bg-card'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <time className={`text-xs font-medium ${isNovo ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {mv.data}
                    {mv.hora && <span className="font-normal opacity-70"> às {mv.hora}</span>}
                  </time>
                  {isNovo && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400">
                      Novo
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed">{mv.descricao}</p>
                {mv.orgao && (
                  <p className="text-xs text-muted-foreground">{mv.orgao}</p>
                )}
                {publicarEm && (
                  <div className="pt-1">
                    <PublicarMovimentoBtn
                      processoId={publicarEm.processoId}
                      clienteId={publicarEm.clienteId}
                      movimento={mv}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {ocultos > 0 && (
        <button
          onClick={() => setExpandido(true)}
          className="relative z-10 mt-3 ml-7 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          Mostrar todas as {movimentos.length} movimentações
        </button>
      )}
    </div>
  )
}
