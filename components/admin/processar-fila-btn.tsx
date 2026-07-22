'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { processarFilaCapaAction } from '@/lib/actions/importacao'
import { useRouter } from 'next/navigation'

export function ProcessarFilaBtn() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function processar() {
    setLoading(true)
    const res = await processarFilaCapaAction()
    if ('error' in res && res.error) {
      toast.error(res.error)
    } else if ('processados' in res) {
      toast.success(
        `${res.processados} ${res.processados === 1 ? 'capa preenchida' : 'capas preenchidas'}` +
        (res.falhas ? `, ${res.falhas} falharam` : '') +
        (res.restantes ? ` — ${res.restantes} na fila (o robô continua sozinho)` : ' — fila vazia')
      )
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Button size="sm" variant="outline" onClick={processar} disabled={loading}>
      {loading
        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando tribunais...</>
        : <><RefreshCw className="h-3.5 w-3.5" /> Processar fila agora</>}
    </Button>
  )
}
