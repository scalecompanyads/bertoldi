'use client'

import { marcarComunicadoEquipeLido } from '@/lib/actions/comunicados'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function MarcarComunicadoEquipeLidoBtn({ comunicadoId }: { comunicadoId: string }) {
  async function marcar() {
    const res = await marcarComunicadoEquipeLido(comunicadoId)
    if (res.error) toast.error(res.error)
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={marcar}>
      Marcar como lido
    </Button>
  )
}
