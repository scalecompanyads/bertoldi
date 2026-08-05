'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import { SearchableSelect } from '@/components/shared/searchable-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { criarAudiencia, atualizarAudiencia, excluirAudiencia } from '@/lib/actions/audiencias'
import { TIPO_AUDIENCIA_LABEL, type Audiencia, type TipoAudiencia } from '@/lib/types'

interface ProcessoOpcao {
  id: string
  numero_cnj: string | null
  tipo_servico: string
  clientes?: { nome: string } | null
}

function isoParaDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function AudienciaForm({ processos, audiencia, compacto }: {
  processos: ProcessoOpcao[]
  audiencia?: Audiencia
  compacto?: boolean
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [tipo, setTipo] = useState<TipoAudiencia>(audiencia?.tipo ?? 'conciliacao')
  const [processoSel, setProcessoSel] = useState(audiencia?.processo_id ?? '')

  const opcoesProcesso = useMemo(
    () => [
      { value: '', label: 'Nenhum' },
      ...processos.map((p) => ({
        value: p.id,
        label: `${p.clientes?.nome ? `${p.clientes.nome} — ` : ''}${p.numero_cnj ?? p.tipo_servico}`,
        keywords: [p.clientes?.nome, p.numero_cnj, p.tipo_servico].filter(Boolean).join(' '),
      })),
    ],
    [processos]
  )

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSalvando(true)
    const fd = new FormData(e.currentTarget)
    fd.set('tipo', tipo)
    fd.set('processo_id', processoSel)

    const res = audiencia ? await atualizarAudiencia(audiencia.id, fd) : await criarAudiencia(fd)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(audiencia ? 'Audiência atualizada.' : 'Audiência agendada.')
      setAberto(false)
      router.refresh()
    }
    setSalvando(false)
  }

  async function excluir() {
    if (!audiencia) return
    setSalvando(true)
    const res = await excluirAudiencia(audiencia.id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Audiência removida.')
      setAberto(false)
      router.refresh()
    }
    setSalvando(false)
  }

  return (
    <>
      {audiencia ? (
        <button
          onClick={() => setAberto(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Editar audiência"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Button size="sm" onClick={() => setAberto(true)}>
          <Plus className="h-3.5 w-3.5" />
          {compacto ? 'Agendar' : 'Agendar audiência'}
        </Button>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{audiencia ? 'Editar audiência' : 'Agendar audiência'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="data_hora">Data e hora *</Label>
                <Input
                  id="data_hora"
                  name="data_hora"
                  type="datetime-local"
                  required
                  defaultValue={isoParaDatetimeLocal(audiencia?.data_hora ?? null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo((v as TipoAudiencia) ?? 'outra')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_AUDIENCIA_LABEL).map(([valor, rotulo]) => (
                      <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Processo</Label>
              <SearchableSelect
                value={processoSel}
                onValueChange={setProcessoSel}
                options={opcoesProcesso}
                placeholder="Nenhum"
                searchPlaceholder="Buscar por cliente, CNJ ou matéria..."
                emptyMessage="Nenhum processo encontrado."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="local">Local (fórum / sala)</Label>
              <Input id="local" name="local" defaultValue={audiencia?.local ?? ''} placeholder="Ex: Fórum de Joinville — sala 3" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link_video">Link da videoconferência</Label>
              <Input id="link_video" name="link_video" type="url" defaultValue={audiencia?.link_video ?? ''} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" name="observacoes" rows={2} defaultValue={audiencia?.observacoes ?? ''} />
            </div>

            <div className="flex justify-between gap-2 pt-1">
              {audiencia ? (
                <Button type="button" variant="outline" onClick={excluir} disabled={salvando} className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </Button>
              ) : <span />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
                <Button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
