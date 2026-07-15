'use client'

import { Check } from 'lucide-react'
import { marcarComoLido } from '@/lib/actions/comunicados'

export function MarcarLidoBtn({ comunicadoId }: { comunicadoId: string }) {
  return (
    <button
      onClick={() => marcarComoLido(comunicadoId)}
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
    >
      <Check className="h-3 w-3" />
      Marcar como lido
    </button>
  )
}
