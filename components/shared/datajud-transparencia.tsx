import { Info } from 'lucide-react'

function nomeFonte(fonte?: string | null): string {
  if (!fonte) return 'portal do tribunal / Datajud-CNJ'
  const normalizada = fonte.toLowerCase()
  if (normalizada.includes('esaj')) return 'eSAJ do tribunal'
  if (normalizada.includes('datajud')) return 'Datajud/CNJ'
  return fonte
}

export function DatajudTransparencia({
  fonte,
  verificadoEm,
  compacta = false,
}: {
  fonte?: string | null
  verificadoEm?: string | null
  compacta?: boolean
}) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border bg-muted/30 ${compacta ? 'p-2.5' : 'p-3'}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Fonte: {nomeFonte(fonte)}.</span>
          {verificadoEm && (
            <>
              {' '}Última consulta em {new Date(verificadoEm).toLocaleString('pt-BR')}.
            </>
          )}
        </p>
        <p>
          A cobertura e a frequência de atualização variam conforme o tribunal. Pode haver
          atraso entre o andamento oficial e sua exibição aqui.
        </p>
      </div>
    </div>
  )
}
