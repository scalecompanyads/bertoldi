'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { sincronizarIntimacoesManual } from '@/lib/actions/intimacoes'

export function SincronizarIntimacoesBtn() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function sincronizar() {
    setLoading(true)
    const res = await sincronizarIntimacoesManual()

    if (res.error) {
      toast.error(res.error)
    } else {
      if (res.novas === 0) {
        toast.info('Nenhuma intimação nova no DJEN.')
      } else {
        toast.success(
          `${res.novas} ${res.novas === 1 ? 'intimação nova' : 'intimações novas'}` +
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
      className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Sincronizando...' : 'Sincronizar agora'}
    </button>
  )
}
