'use client'

import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
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
          onClick={() => {
            // Nem todo portal aceita o número pela URL (captcha, formulário) —
            // copia junto para o advogado só colar no campo de busca
            navigator.clipboard?.writeText(resultado.numero.formatted)
              .then(() => toast.info('Número do processo copiado — se o portal não preencher sozinho, é só colar.'))
              .catch(() => {})
          }}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 shrink-0"
        >
          Abrir no portal
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}
