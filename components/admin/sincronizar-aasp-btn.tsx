'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { sincronizarIntimacoesAaspManual } from '@/lib/actions/intimacoes'

export function SincronizarAaspBtn() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function sincronizar() {
    setLoading(true)
    const res = await sincronizarIntimacoesAaspManual()

    if (res.error) {
      toast.error(res.error)
    } else {
      if (res.novas === 0) {
        toast.info('Nenhuma publicação nova na AASP.')
      } else {
        toast.success(
          `${res.novas} ${res.novas === 1 ? 'publicação nova' : 'publicações novas'} da AASP` +
          (res.vinculadas ? ` (${res.vinculadas} vinculadas a processos)` : '')
        )
      }
      if (res.erros?.length) {
        toast.warning(res.erros[0])
      }
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={sincronizar}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Buscando AASP...' : 'Sincronizar AASP'}
    </button>
  )
}
