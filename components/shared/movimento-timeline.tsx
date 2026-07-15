import { PublicarMovimentoBtn } from '@/components/admin/publicar-movimento-btn'

interface Movimento {
  data: string
  descricao: string
}

interface Props {
  movimentos: Movimento[]
  novaMovimentacao?: boolean
  /** Quando informados, exibe o botão "Publicar para o cliente" (uso no admin) */
  publicarEm?: { processoId: string; clienteId: string }
}

export function MovimentoTimeline({ movimentos, novaMovimentacao, publicarEm }: Props) {
  if (movimentos.length === 0) return null

  return (
    <div className="relative">
      {/* Linha vertical */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

      <div className="space-y-3">
        {movimentos.map((mv, i) => {
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
                  </time>
                  {isNovo && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400">
                      Novo
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed">{mv.descricao}</p>
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
    </div>
  )
}
