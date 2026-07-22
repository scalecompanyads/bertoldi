'use client'

import { useState, useRef, useEffect } from 'react'
import { RefreshCw, AlertCircle, Info, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { analisarAndamento } from '@/lib/actions/verificar-processo'
import { MovimentoTimeline } from '@/components/shared/movimento-timeline'
import { ProcessoCapa } from '@/components/shared/processo-capa'
import { DatajudTransparencia } from '@/components/shared/datajud-transparencia'
import type { DatajudCapa } from '@/lib/datajud'

interface Props {
  processoId: string
  autoFetch?: boolean
}

interface Movimento {
  data: string
  hora?: string
  descricao: string
  orgao?: string
}

interface Resultado {
  encontrado: boolean
  houve_movimentacao: boolean
  ultimoAndamento?: string
  movimentos?: Movimento[]
  capa?: DatajudCapa
  fonte?: string
  doCache?: boolean
  verificadoEm?: string
}

export function VerificarDatajudBtn({ processoId, autoFetch = false }: Props) {
  const [loading, setLoading] = useState(false)
  const [forcando, setForcando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const resultadoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFetch) analisar(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function analisar(forcar: boolean) {
    setLoading(true)
    setForcando(forcar)
    const res = await analisarAndamento(processoId, forcar)

    if (res.error) {
      toast.error(res.error)
    } else if (res.ok) {
      setResultado({
        encontrado: res.encontrado ?? false,
        houve_movimentacao: res.houve_movimentacao ?? false,
        ultimoAndamento: res.ultimoAndamento,
        movimentos: res.movimentos,
        capa: res.capa,
        fonte: res.fonte,
        doCache: res.doCache,
        verificadoEm: res.verificadoEm,
      })
      if (res.doCache) {
        toast.info(`Dados em cache — verificado ${res.fonte}.`)
      } else if (res.houve_movimentacao) {
        toast.success('Nova movimentação encontrada!')
      } else if (res.encontrado) {
        toast.info('Processo consultado. Sem novidades desde a última verificação.')
      } else {
        toast.warning('Processo não encontrado no portal.')
      }

      setTimeout(() => {
        resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => analisar(false)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading && !forcando ? 'animate-spin' : ''}`} />
          {loading && !forcando ? 'Analisando...' : 'Analisar andamento'}
        </button>

        <button
          onClick={() => analisar(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading && forcando ? 'animate-spin' : ''}`} />
          {loading && forcando ? 'Atualizando...' : 'Forçar atualização'}
        </button>
      </div>

      {resultado && (
        <div ref={resultadoRef} className="space-y-3">
          {/* Status da consulta */}
          <div className={`flex items-start gap-2.5 rounded-lg border p-3 text-sm ${
            resultado.houve_movimentacao
              ? 'border-green-400/50 bg-green-50 dark:border-green-700/50 dark:bg-green-950/30'
              : resultado.encontrado
                ? 'bg-muted/40'
                : 'border-destructive/30 bg-destructive/5'
          }`}>
            {resultado.houve_movimentacao ? (
              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0 mt-1.5" />
            ) : resultado.encontrado ? (
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 flex-1 min-w-0">
              {resultado.houve_movimentacao ? (
                <p className="font-medium text-green-700 dark:text-green-400">Nova movimentação detectada</p>
              ) : resultado.encontrado ? (
                <p className="text-muted-foreground">Sem novidades desde a última verificação.</p>
              ) : (
                <p className="text-muted-foreground">Processo não encontrado no portal.</p>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <Clock className="h-3 w-3" />
                <span>
                  {resultado.doCache ? 'Cache · ' : ''}{resultado.fonte}
                  {resultado.verificadoEm && ` · ${new Date(resultado.verificadoEm).toLocaleString('pt-BR')}`}
                </span>
              </div>
            </div>
          </div>

          <DatajudTransparencia
            fonte={resultado.fonte}
            verificadoEm={resultado.verificadoEm}
            compacta
          />

          {/* Dados de capa do processo */}
          {resultado.capa && <ProcessoCapa capa={resultado.capa} />}

          {/* Timeline de movimentações */}
          {resultado.movimentos && resultado.movimentos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Histórico — {resultado.movimentos.length} movimentações
              </p>
              <MovimentoTimeline
                movimentos={resultado.movimentos}
                novaMovimentacao={resultado.houve_movimentacao}
              />
            </div>
          ) : resultado.encontrado && resultado.ultimoAndamento ? (
            <p className="text-sm text-muted-foreground">{resultado.ultimoAndamento}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
