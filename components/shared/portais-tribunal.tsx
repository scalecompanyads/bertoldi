'use client'

import { Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { parseCNJ } from '@/lib/cnj-parser'
import { identificarPortais, buildPortalUrl, SEG_NOMES } from '@/lib/cnj-parser/portais'

interface Props {
  numero: string
}

export function PortaisTribunal({ numero }: Props) {
  const parsed = parseCNJ(numero)
  if (!parsed) return null

  const { raw, formatted } = parsed
  const tribunais = identificarPortais(raw)
  if (!tribunais.length) return null

  const ano  = raw.slice(9, 13)
  const j    = raw[13]
  const vara = parseInt(raw.slice(16, 20), 10)

  async function copiarEAbrir(url: string) {
    try { await navigator.clipboard.writeText(formatted) } catch {}
    window.open(url, '_blank', 'noopener,noreferrer')
    toast.success(`${formatted} copiado — cole no portal com Ctrl+V se necessário.`)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {tribunais.length} tribunal{tribunais.length !== 1 ? 'is' : ''} competente{tribunais.length !== 1 ? 's' : ''}
      </p>

      {tribunais.map(t => {
        const url = buildPortalUrl(t, formatted, raw)
        return (
          <div key={t.id} className="rounded-md border bg-card p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-mono font-semibold shrink-0">
                  {t.abr}
                </span>
                <span className="text-sm truncate">{t.nome}</span>
              </div>
              <button
                onClick={() => copiarEAbrir(url)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 shrink-0"
              >
                <Copy className="h-3 w-3" />
                Copiar e abrir
                <ExternalLink className="h-3 w-3 opacity-70" />
              </button>
            </div>

            <div className="flex gap-2 text-xs">
              <div className="rounded bg-muted/50 px-2 py-1">
                <span className="text-muted-foreground">Ano </span>
                <span className="font-medium">{ano}</span>
              </div>
              <div className="rounded bg-muted/50 px-2 py-1">
                <span className="text-muted-foreground">Segmento </span>
                <span className="font-medium">{SEG_NOMES[j] ?? j}</span>
              </div>
              <div className="rounded bg-muted/50 px-2 py-1">
                <span className="text-muted-foreground">Vara/Foro </span>
                <span className="font-medium">{vara}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
