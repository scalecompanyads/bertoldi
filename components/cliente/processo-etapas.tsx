import { Check } from 'lucide-react'
import type { StatusProcesso } from '@/lib/types'

const ETAPAS = ['Contratação', 'Triagem', 'Análise', 'Na justiça', 'Concluído']

// índice da etapa atual (0-based) para cada status interno
const ETAPA_POR_STATUS: Record<StatusProcesso, number> = {
  triagem: 1,
  em_analise: 2,
  distribuido: 3,
  em_andamento: 3,
  concluido: 4,
}

export function ProcessoEtapas({ status }: { status: StatusProcesso }) {
  const atual = ETAPA_POR_STATUS[status]

  return (
    <div className="flex items-start" aria-label="Etapas do processo">
      {ETAPAS.map((etapa, i) => {
        const feita = i < atual || status === 'concluido'
        const ativa = i === atual && status !== 'concluido'
        return (
          <div key={etapa} className="flex-1 flex flex-col items-center relative">
            {/* linha conectora */}
            {i > 0 && (
              <div
                className={`absolute top-[11px] right-1/2 w-full h-0.5 ${
                  i <= atual || status === 'concluido' ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
            <div
              className={`relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                feita
                  ? 'bg-primary border-primary text-primary-foreground'
                  : ativa
                    ? 'bg-background border-primary text-primary'
                    : 'bg-background border-border text-muted-foreground'
              }`}
            >
              {feita ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span
              className={`mt-1.5 text-[10px] leading-tight text-center px-0.5 ${
                ativa ? 'font-semibold text-foreground' : feita ? 'text-foreground/70' : 'text-muted-foreground'
              }`}
            >
              {etapa}
            </span>
          </div>
        )
      })}
    </div>
  )
}
