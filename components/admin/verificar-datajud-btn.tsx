'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { analisarAndamento } from '@/lib/actions/verificar-processo'

interface Props {
  processoId: string
  autoFetch?: boolean
}

export function VerificarDatajudBtn({ processoId, autoFetch = false }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [forcando, setForcando] = useState(false)

  useEffect(() => {
    if (autoFetch) analisar(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function analisar(forcar: boolean) {
    setLoading(true)
    setForcando(forcar)
    const res = await analisarAndamento(processoId, forcar)

    if (res.error) {
      toast.error(res.error)
    } else if (res.ok) {
      if (res.doCache) {
        toast.info('Dados em cache — nenhuma atualização necessária.')
      } else if (res.houve_movimentacao) {
        toast.success('Nova movimentação encontrada!')
      } else if (res.encontrado) {
        toast.info('Processo consultado. Sem novidades.')
      } else {
        toast.warning('Processo ainda não indexado no Datajud.')
      }
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={() => analisar(false)}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading && !forcando ? 'animate-spin' : ''}`} />
        {loading && !forcando ? 'Analisando...' : 'Analisar andamento'}
      </button>

      <button
        onClick={() => analisar(true)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${loading && forcando ? 'animate-spin' : ''}`} />
        {loading && forcando ? 'Atualizando...' : 'Forçar atualização'}
      </button>
    </div>
  )
}
