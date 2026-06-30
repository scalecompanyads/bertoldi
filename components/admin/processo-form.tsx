'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { criarProcesso, atualizarProcesso } from '@/lib/actions/processos'
import type { Processo, Usuario } from '@/lib/types'

interface Props {
  clienteId: string
  processo?: Processo
  advogados?: Pick<Usuario, 'id' | 'nome'>[]
}

export function ProcessoForm({ clienteId, processo, advogados = [] }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(processo?.status_interno ?? 'triagem')
  const [responsavel, setResponsavel] = useState(processo?.responsavel_id ?? '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('status_interno', status)
    fd.set('responsavel_id', responsavel)

    const result = processo
      ? await atualizarProcesso(processo.id, clienteId, fd)
      : await criarProcesso(clienteId, fd)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(processo ? 'Processo atualizado.' : 'Processo cadastrado.')
      if (!processo && 'id' in result) {
        router.push(`/admin/clientes/${clienteId}/processos/${result.id}`)
      }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="tipo_servico">Tipo / matéria *</Label>
        <Input id="tipo_servico" name="tipo_servico" required defaultValue={processo?.tipo_servico} placeholder="Ex: Ação trabalhista, Consultoria..." />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="numero_cnj">Número CNJ</Label>
        <Input id="numero_cnj" name="numero_cnj" defaultValue={processo?.numero_cnj ?? ''} placeholder="0000000-00.0000.0.00.0000" className="font-mono" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tribunal">Tribunal</Label>
          <Input id="tribunal" name="tribunal" defaultValue={processo?.tribunal ?? ''} placeholder="Ex: TJSP, TRT2..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vara_orgao">Vara / Órgão</Label>
          <Input id="vara_orgao" name="vara_orgao" defaultValue={processo?.vara_orgao ?? ''} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="data_contratacao">Data de contratação *</Label>
          <Input id="data_contratacao" name="data_contratacao" type="date" required defaultValue={processo?.data_contratacao} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v ?? 'triagem')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="triagem">Triagem</SelectItem>
              <SelectItem value="em_analise">Em análise</SelectItem>
              <SelectItem value="distribuido">Distribuído</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {advogados.length > 0 && (
        <div className="space-y-1.5">
          <Label>Responsável</Label>
          <Select value={responsavel} onValueChange={(v) => setResponsavel(v ?? '')}>
            <SelectTrigger><SelectValue placeholder="Selecionar advogado..." /></SelectTrigger>
            <SelectContent>
              {advogados.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : processo ? 'Salvar alterações' : 'Cadastrar processo'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
