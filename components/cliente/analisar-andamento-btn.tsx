'use client'

import { useState, useRef, useEffect } from 'react'
import { RefreshCw, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { analisarAndamento } from '@/lib/actions/verificar-processo'
import { MovimentoTimeline } from '@/components/shared/movimento-timeline'
import { ProcessoCapa } from '@/components/shared/processo-capa'
import { DatajudTransparencia } from '@/components/shared/datajud-transparencia'
import type { DatajudCapa } from '@/lib/datajud'

interface Movimento {
  data: string
  hora?: string
  descricao: string
  orgao?: string
}

export function AnalisarAndamentoBtn({
  processoId,
  autoFetch = false,
}: {
  processoId: string
  autoFetch?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [movimentos, setMovimentos] = useState<Movimento[] | null>(null)
  const [capa, setCapa] = useState<DatajudCapa | null>(null)
  const [ultimoAndamento, setUltimoAndamento] = useState<string | null>(null)
  const [novo, setNovo] = useState(false)
  const [verificadoEm, setVerificadoEm] = useState<string | null>(null)
  const [fonte, setFonte] = useState<string | null>(null)
  const resultadoRef = useRef<HTMLDivElement>(null)

  // Busca automaticamente quando não há cache salvo
  useEffect(() => {
    if (autoFetch) handleClick(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleClick(forcar: boolean) {
    setLoading(true)
    const res = await analisarAndamento(processoId, forcar)

    if (res.error) {
      toast.error(res.error)
    } else if (res.ok) {
      setMovimentos(res.movimentos ?? null)
      setCapa(res.capa ?? null)
      setUltimoAndamento(res.ultimoAndamento ?? null)
      setNovo(res.houve_movimentacao ?? false)
      setVerificadoEm(res.verificadoEm ?? null)
      setFonte(res.fonte ?? null)

      if (res.doCache) {
        toast.info(`Dados atualizados ${res.fonte}.`)
      } else if (res.houve_movimentacao) {
        toast.success('Nova movimentação encontrada!')
      } else {
        toast.info('Consultado. Sem novidades no momento.')
      }

      setTimeout(() => {
        resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
    setLoading(false)
  }

  const temResultado = movimentos !== null || ultimoAndamento !== null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleClick(false)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity active:opacity-80 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Consultando...' : 'Consultar portal'}
        </button>

        <button
          onClick={() => handleClick(true)}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          Forçar atualização
        </button>
      </div>

      {temResultado && (
        <div ref={resultadoRef} className="space-y-3">
          {/* Status badge */}
          <div className={`rounded-xl border p-3 flex items-start gap-2 ${
            novo
              ? 'border-green-400/50 bg-green-50 dark:border-green-700/50 dark:bg-green-950/30'
              : 'bg-muted/30'
          }`}>
            {novo ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              {novo ? (
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Nova movimentação encontrada</p>
              ) : (
                <p className="text-sm text-muted-foreground">Sem novidades desde a última consulta.</p>
              )}
              {verificadoEm && (
                <p className="text-xs text-muted-foreground">
                  Consultado em {new Date(verificadoEm).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          <DatajudTransparencia fonte={fonte} verificadoEm={verificadoEm} compacta />

          {/* Dados de capa do processo */}
          {capa && <ProcessoCapa capa={capa} />}

          {/* Timeline de movimentações */}
          {movimentos && movimentos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {movimentos.length} movimentações encontradas
              </p>
              <MovimentoTimeline movimentos={movimentos} novaMovimentacao={novo} />
            </div>
          ) : ultimoAndamento ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{ultimoAndamento}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
