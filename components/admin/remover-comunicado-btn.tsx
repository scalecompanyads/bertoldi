'use client'

import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { removerComunicado } from '@/lib/actions/comunicados'

export function RemoverComunicadoBtn({ comunicadoId }: { comunicadoId: string }) {
  async function handleClick() {
    const result = await removerComunicado(comunicadoId)
    if (result?.error) toast.error(result.error)
    else toast.success('Comunicado removido.')
  }

  return (
    <button
      onClick={handleClick}
      className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
      aria-label="Remover comunicado"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
