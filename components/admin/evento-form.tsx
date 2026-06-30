'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adicionarEvento, editarEvento, removerEvento } from '@/lib/actions/linha-do-tempo'
import type { EventoLinhaDotTempo } from '@/lib/types'

interface AddProps {
  processoId: string
  clienteId: string
}

export function AdicionarEventoForm({ processoId, clienteId }: AddProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [visivel, setVisivel] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('visivel_cliente', String(visivel))

    const result = await adicionarEvento(processoId, clienteId, fd)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Evento adicionado.')
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      setVisivel(false)
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Adicionar evento
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-3">
      <p className="text-sm font-medium">Novo evento</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="data_evento">Data *</Label>
          <Input id="data_evento" name="data_evento" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setVisivel(!visivel)}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border transition-colors ${
              visivel
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {visivel ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {visivel ? 'Visível ao cliente' : 'Interno'}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição *</Label>
        <Textarea id="descricao" name="descricao" required rows={3} placeholder="Descreva o evento..." />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={loading}>{loading ? 'Salvando...' : 'Adicionar'}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  )
}

interface RemoveProps {
  eventoId: string
  processoId: string
  clienteId: string
}

export function RemoverEventoBtn({ eventoId, processoId, clienteId }: RemoveProps) {
  const [loading, setLoading] = useState(false)

  async function handleRemover() {
    if (!confirm('Remover este evento?')) return
    setLoading(true)
    const result = await removerEvento(eventoId, processoId, clienteId)
    if (result.error) toast.error(result.error)
    else toast.success('Evento removido.')
    setLoading(false)
  }

  return (
    <button
      onClick={handleRemover}
      disabled={loading}
      className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
      aria-label="Remover evento"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  )
}
