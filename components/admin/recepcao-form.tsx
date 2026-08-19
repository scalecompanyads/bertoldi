'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClienteSelect } from '@/components/shared/cliente-select'
import { criarRecepcao } from '@/lib/actions/recepcoes'

interface Cliente { id: string; nome: string; cpf_cnpj?: string | null }
interface Usuario { id: string; nome: string }

interface Props {
  clientes: Cliente[]
  equipe: Usuario[]
}

export function RecepcaoForm({ clientes, equipe }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [responsavelId, setResponsavelId] = useState('')
  const [nomeInput, setNomeInput] = useState('')

  function handleClienteChange(id: string) {
    setClienteId(id)
    if (id) {
      const c = clientes.find(c => c.id === id)
      if (c) setNomeInput(c.nome)
    }
  }

  function handleClose() {
    setOpen(false)
    setClienteId('')
    setResponsavelId('')
    setNomeInput('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    if (clienteId) fd.set('cliente_id', clienteId)
    if (responsavelId && responsavelId !== 'none') fd.set('responsavel_id', responsavelId)

    const result = await criarRecepcao(fd)
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success('Check-in registrado')
    handleClose()
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Novo check-in
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar visita</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Cliente cadastrado</Label>
              <ClienteSelect
                clientes={clientes}
                value={clienteId}
                onValueChange={handleClienteChange}
                placeholder="Buscar cliente..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cliente_nome">
                Nome do visitante <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cliente_nome"
                name="cliente_nome"
                value={nomeInput}
                onChange={e => setNomeInput(e.target.value)}
                placeholder="Nome completo"
                required
              />
              <p className="text-xs text-muted-foreground">
                Preenchido ao selecionar cliente, ou digite manualmente para visitantes não cadastrados.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assunto">Assunto</Label>
              <Textarea
                id="assunto"
                name="assunto"
                placeholder="Motivo da visita..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="providencia">Providência</Label>
              <Textarea
                id="providencia"
                name="providencia"
                placeholder="O que foi acordado / encaminhado..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Responsável pelo atendimento</Label>
              <Select value={responsavelId} onValueChange={(v) => setResponsavelId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Nenhum</span>
                  </SelectItem>
                  {equipe.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar entrada'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
