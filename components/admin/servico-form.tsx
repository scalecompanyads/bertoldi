'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { criarServico } from '@/lib/actions/servicos'

export function ServicoForm({ clienteId }: { clienteId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('ativo')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('status', status)

    const result = await criarServico(clienteId, fd)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Serviço adicionado.')
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      setStatus('ativo')
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Adicionar serviço
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-3">
      <p className="text-sm font-medium">Novo serviço contratado</p>
      <div className="space-y-1.5">
        <Label htmlFor="tipo_servico">Tipo de serviço *</Label>
        <Input id="tipo_servico" name="tipo_servico" required placeholder="Ex: Consultoria, Ação trabalhista..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="data_contratacao">Data *</Label>
          <Input id="data_contratacao" name="data_contratacao" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v ?? 'ativo')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={loading}>{loading ? 'Salvando...' : 'Adicionar'}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  )
}
