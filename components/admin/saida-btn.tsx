'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { registrarSaida } from '@/lib/actions/recepcoes'

export function SaidaBtn({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)

  async function handleSaida() {
    setLoading(true)
    const result = await registrarSaida(id)
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success('Saída registrada')
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-xs h-7 px-2"
      disabled={loading}
      onClick={handleSaida}
    >
      <LogOut className="h-3 w-3 mr-1" />
      {loading ? '...' : 'Check-out'}
    </Button>
  )
}
