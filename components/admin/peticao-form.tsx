'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, AlertTriangle, Clock, Scale } from 'lucide-react'
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
import { criarPeticao } from '@/lib/actions/peticoes'

interface Cliente { id: string; nome: string; cpf_cnpj?: string | null }
interface Usuario { id: string; nome: string }

interface Props {
  clientes: Cliente[]
  equipe: Usuario[]
}

const FLAGS = [
  { key: 'urgente',   label: 'Urgente',    icon: AlertTriangle, cor: 'text-red-500' },
  { key: 'prescricao', label: 'Prescrição', icon: Clock,         cor: 'text-orange-500' },
  { key: 'decadencia', label: 'Decadência', icon: Scale,         cor: 'text-yellow-500' },
]

export function PeticaoForm({ clientes, equipe }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [responsavelId, setResponsavelId] = useState('')
  const [flags, setFlags] = useState({ urgente: false, prescricao: false, decadencia: false })
  const router = useRouter()

  function toggleFlag(key: string) {
    setFlags(f => ({ ...f, [key]: !f[key as keyof typeof f] }))
  }

  function handleClose() {
    setOpen(false)
    setClienteId('')
    setResponsavelId('')
    setFlags({ urgente: false, prescricao: false, decadencia: false })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!clienteId) { toast.error('Selecione o cliente'); return }

    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('cliente_id', clienteId)
    if (responsavelId && responsavelId !== 'none') fd.set('responsavel_id', responsavelId)
    fd.set('urgente', String(flags.urgente))
    fd.set('prescricao', String(flags.prescricao))
    fd.set('decadencia', String(flags.decadencia))

    const result = await criarPeticao(fd)
    setLoading(false)

    if (result?.error) { toast.error(result.error); return }
    toast.success('Petição cadastrada')
    handleClose()
    router.refresh()
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Nova petição
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar petição</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Cliente <span className="text-destructive">*</span></Label>
              <ClienteSelect
                clientes={clientes}
                value={clienteId}
                onValueChange={setClienteId}
                placeholder="Buscar cliente..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="natureza_acao">
                Natureza da ação <span className="text-destructive">*</span>
              </Label>
              <Input
                id="natureza_acao"
                name="natureza_acao"
                placeholder="Ex: Ação de cobrança, Divórcio consensual..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="parte_adversa">Parte adversa</Label>
              <Input
                id="parte_adversa"
                name="parte_adversa"
                placeholder="Nome do réu / parte contrária"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="data_contratacao">
                  Data de contratação <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="data_contratacao"
                  name="data_contratacao"
                  type="date"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Responsável</Label>
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
            </div>

            <div className="space-y-2">
              <Label>Alertas</Label>
              <div className="flex gap-2 flex-wrap">
                {FLAGS.map(({ key, label, icon: Icon, cor }) => {
                  const ativo = flags[key as keyof typeof flags]
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleFlag(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                        ativo
                          ? 'bg-destructive/10 border-destructive/40 text-destructive'
                          : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-3 w-3 ${ativo ? cor : ''}`} />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                placeholder="Informações relevantes sobre o caso..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Cadastrar petição'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
