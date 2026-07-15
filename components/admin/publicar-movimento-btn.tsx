'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Send, Check } from 'lucide-react'
import { publicarMovimento } from '@/lib/actions/linha-do-tempo'

interface Props {
  processoId: string
  clienteId: string
  movimento: { data: string; descricao: string }
}

export function PublicarMovimentoBtn({ processoId, clienteId, movimento }: Props) {
  const [loading, setLoading] = useState(false)
  const [publicado, setPublicado] = useState(false)

  async function handleClick() {
    setLoading(true)
    const result = await publicarMovimento(processoId, clienteId, movimento)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Movimento publicado na linha do tempo do cliente.')
      setPublicado(true)
    }
    setLoading(false)
  }

  if (publicado) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-medium">
        <Check className="h-3 w-3" />
        Publicado
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
      title="Publicar este movimento na linha do tempo visível ao cliente"
    >
      <Send className="h-3 w-3" />
      {loading ? 'Publicando...' : 'Publicar para o cliente'}
    </button>
  )
}
