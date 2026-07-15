'use client'

import { ExternalLink } from 'lucide-react'
import { identificarTribunal } from '@/lib/cnj-parser'

interface TribunalBadgeProps {
  numero: string
}

export function TribunalBadge({ numero }: TribunalBadgeProps) {
  const resultado = identificarTribunal(numero)
  if (!resultado) return null

  const { tribunal, urlPortal } = resultado

  if (!tribunal) {
    return (
      <p className="text-xs text-muted-foreground">
        Tribunal não identificado (segmento {resultado.numero.j} / código {resultado.numero.tt})
      </p>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
      <span className="font-medium">{tribunal.sigla}</span>
      <span className="text-muted-foreground flex-1 truncate">{tribunal.nome}</span>
      {urlPortal && (
        <a
          href={urlPortal}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 shrink-0"
        >
          Abrir no portal
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}
