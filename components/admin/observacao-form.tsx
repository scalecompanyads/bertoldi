'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adicionarObservacao, removerObservacao } from '@/lib/actions/observacoes'

export function ObservacaoForm({ processoId, clienteId }: { processoId: string; clienteId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [visivel, setVisivel] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('visivel_cliente', String(visivel))

    const result = await adicionarObservacao(processoId, clienteId, fd)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Observação adicionada.')
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
        Adicionar observação
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-3">
      <p className="text-sm font-medium">Nova observação</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="texto">Texto *</Label>
          <button
            type="button"
            onClick={() => setVisivel(!visivel)}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border transition-colors ${
              visivel
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {visivel ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {visivel ? 'Visível ao cliente' : 'Interno'}
          </button>
        </div>
        <Textarea id="texto" name="texto" required rows={3} placeholder="Digite a observação..." />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>{loading ? 'Salvando...' : 'Adicionar'}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  )
}

export function RemoverObservacaoBtn({ obsId, processoId, clienteId }: { obsId: string; processoId: string; clienteId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleRemover() {
    if (!confirm('Remover esta observação?')) return
    setLoading(true)
    const result = await removerObservacao(obsId, processoId, clienteId)
    if (result.error) toast.error(result.error)
    else toast.success('Observação removida.')
    setLoading(false)
  }

  return (
    <button
      onClick={handleRemover}
      disabled={loading}
      className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
      aria-label="Remover observação"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  )
}
