import { Landmark, Lock } from 'lucide-react'
import type { DatajudCapa } from '@/lib/datajud'

interface Props {
  capa: DatajudCapa
}

export function ProcessoCapa({ capa }: Props) {
  const campos: { label: string; valor?: string }[] = [
    { label: 'Classe', valor: capa.classe },
    { label: 'Assunto', valor: capa.assuntos?.length ? capa.assuntos.join(', ') : undefined },
    { label: 'Órgão julgador', valor: capa.orgaoJulgador },
    {
      label: 'Tribunal',
      valor: [capa.tribunal, capa.grau].filter(Boolean).join(' · ') || undefined,
    },
    { label: 'Ajuizado em', valor: capa.dataAjuizamento },
    { label: 'Sistema', valor: [capa.sistema, capa.formato].filter(Boolean).join(' · ') || undefined },
  ].filter(c => c.valor)

  if (campos.length === 0) return null

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Landmark className="h-3.5 w-3.5" />
          Dados do processo no tribunal
        </div>
        {typeof capa.nivelSigilo === 'number' && capa.nivelSigilo > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-400">
            <Lock className="h-2.5 w-2.5" />
            Sigiloso
          </span>
        )}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
        {campos.map(c => (
          <div key={c.label} className="space-y-0.5">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</dt>
            <dd className="text-sm leading-snug">{c.valor}</dd>
          </div>
        ))}
      </dl>

      {capa.ultimaAtualizacao && (
        <p className="text-xs text-muted-foreground/70 pt-1 border-t">
          Atualizado pelo tribunal em{' '}
          {new Date(capa.ultimaAtualizacao).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}
