'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { criarProcesso, atualizarProcesso } from '@/lib/actions/processos'
import { buscarCapaTribunal } from '@/lib/actions/datajud'
import { identificarTribunal, formatarNumeroCNJ, validarFormatoCNJ } from '@/lib/cnj-parser'
import { TribunalBadge } from '@/components/admin/tribunal-badge'
import { Landmark, Loader2 } from 'lucide-react'
import type { CalendarioForense, Processo, Usuario } from '@/lib/types'

interface Props {
  clienteId: string
  processo?: Processo
  advogados?: Pick<Usuario, 'id' | 'nome'>[]
  calendarios?: Pick<CalendarioForense, 'id' | 'nome' | 'uf' | 'comarca'>[]
}

export function ProcessoForm({ clienteId, processo, advogados = [], calendarios = [] }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(processo?.status_interno ?? 'triagem')
  const [responsavel, setResponsavel] = useState(processo?.responsavel_id ?? '')
  const [calendarioId, setCalendarioId] = useState(processo?.calendario_forense_id ?? '')
  const [notificarCliente, setNotificarCliente] = useState(processo?.notificar_cliente ?? false)
  const [numeroCNJ, setNumeroCNJ] = useState(processo?.numero_cnj ?? '')
  const [tribunal, setTribunal] = useState(processo?.tribunal ?? '')
  // Controlados para o "Buscar dados do tribunal" poder preenchê-los
  const [varaOrgao, setVaraOrgao] = useState(processo?.vara_orgao ?? '')
  const [assunto, setAssunto] = useState(processo?.assunto ?? '')
  const [dataAjuizamento, setDataAjuizamento] = useState(processo?.data_ajuizamento ?? '')
  const [buscandoCapa, setBuscandoCapa] = useState(false)

  async function buscarCapa() {
    setBuscandoCapa(true)
    const res = await buscarCapaTribunal(numeroCNJ)
    if ('error' in res && res.error) {
      toast.error(res.error)
    } else if ('ok' in res) {
      if (res.assunto) setAssunto(res.assunto)
      if (res.varaOrgao) setVaraOrgao(res.varaOrgao)
      if (res.dataAjuizamento) setDataAjuizamento(res.dataAjuizamento)
      const preenchidos = [res.assunto && 'assunto', res.varaOrgao && 'vara/órgão', res.dataAjuizamento && 'data de ajuizamento']
        .filter(Boolean)
        .join(', ')
      toast.success(preenchidos
        ? `Dados do tribunal: ${preenchidos}. Confira antes de salvar.`
        : 'Processo encontrado, mas o tribunal não enviou dados de capa.')
    }
    setBuscandoCapa(false)
  }

  function handleCNJChange(value: string) {
    setNumeroCNJ(value)
    if (validarFormatoCNJ(value)) {
      const resultado = identificarTribunal(value)
      if (resultado?.tribunal && !tribunal) {
        setTribunal(resultado.tribunal.sigla)
      }
    }
  }

  function handleCNJBlur(value: string) {
    const formatado = formatarNumeroCNJ(value)
    if (formatado !== value) {
      setNumeroCNJ(formatado)
      if (validarFormatoCNJ(formatado)) {
        const resultado = identificarTribunal(formatado)
        if (resultado?.tribunal && !tribunal) {
          setTribunal(resultado.tribunal.sigla)
        }
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('status_interno', status)
    fd.set('responsavel_id', responsavel)
    fd.set('calendario_forense_id', calendarioId)
    fd.set('numero_cnj', numeroCNJ)
    fd.set('tribunal', tribunal)
    fd.set('notificar_cliente', notificarCliente ? 'true' : 'false')

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

  const cnjValido = validarFormatoCNJ(numeroCNJ)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="tipo_servico">Tipo / matéria *</Label>
        <Input id="tipo_servico" name="tipo_servico" required defaultValue={processo?.tipo_servico} placeholder="Ex: Ação trabalhista, Consultoria..." />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="numero_cnj">Número CNJ</Label>
        <Input
          id="numero_cnj"
          name="numero_cnj"
          value={numeroCNJ}
          onChange={(e) => handleCNJChange(e.target.value)}
          onBlur={(e) => handleCNJBlur(e.target.value)}
          placeholder="0000000-00.0000.0.00.0000"
          className="font-mono"
        />
        {cnjValido && (
          <div className="flex items-center gap-2 flex-wrap">
            <TribunalBadge numero={numeroCNJ} />
            <Button type="button" size="sm" variant="outline" onClick={buscarCapa} disabled={buscandoCapa}>
              {buscandoCapa
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando... (pode levar até 1 min)</>
                : <><Landmark className="h-3.5 w-3.5" /> Buscar dados do tribunal</>}
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tribunal">Tribunal</Label>
          <Input
            id="tribunal"
            name="tribunal"
            value={tribunal}
            onChange={(e) => setTribunal(e.target.value)}
            placeholder="Ex: TJSP, TRT2..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vara_orgao">Vara / Órgão</Label>
          <Input id="vara_orgao" name="vara_orgao" value={varaOrgao} onChange={(e) => setVaraOrgao(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="parte_autora">Parte autora</Label>
          <Input id="parte_autora" name="parte_autora" defaultValue={processo?.parte_autora ?? ''} placeholder="Ex: Carlos Eduardo Pereira da Silva" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="parte_re">Parte ré</Label>
          <Input id="parte_re" name="parte_re" defaultValue={processo?.parte_re ?? ''} placeholder="Ex: Ricardo Hagop Bertezlian Junior" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="outras_partes">Outras partes envolvidas</Label>
        <Input id="outras_partes" name="outras_partes" defaultValue={processo?.outras_partes ?? ''} placeholder="Ex: Giovanna Medeiros Bastos Selis" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="assunto">Assunto</Label>
          <Input id="assunto" name="assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Ex: Indenização por Dano Moral" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="valor_causa">Valor da causa</Label>
          <Input
            id="valor_causa"
            name="valor_causa"
            inputMode="decimal"
            defaultValue={processo?.valor_causa != null ? processo.valor_causa.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
            placeholder="Ex: 16.210,00"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="data_ajuizamento">Data de ajuizamento</Label>
          <Input id="data_ajuizamento" name="data_ajuizamento" type="date" value={dataAjuizamento} onChange={(e) => setDataAjuizamento(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cidade_origem">Cidade de origem</Label>
          <Input id="cidade_origem" name="cidade_origem" defaultValue={processo?.cidade_origem ?? ''} placeholder="Ex: Campos do Jordão" />
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
      {calendarios.length > 0 && (
        <div className="space-y-1.5">
          <Label>Calendário forense</Label>
          <Select value={calendarioId || '__nacional__'} onValueChange={(v) => setCalendarioId(v === '__nacional__' ? '' : (v ?? ''))}>
            <SelectTrigger><SelectValue placeholder="Somente feriados nacionais" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__nacional__">Somente feriados nacionais</SelectItem>
              {calendarios.map(calendario => (
                <SelectItem key={calendario.id} value={calendario.id}>
                  {calendario.nome} · {calendario.uf}{calendario.comarca ? ` · ${calendario.comarca}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            A versão publicada será usada apenas para sugerir prazos; o advogado confirma a data.
          </p>
        </div>
      )}
      <label className="flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer">
        <input
          type="checkbox"
          checked={notificarCliente}
          onChange={(e) => setNotificarCliente(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        <span className="space-y-0.5">
          <span className="block text-sm font-medium">Notificar cliente por e-mail</span>
          <span className="block text-xs text-muted-foreground">
            Envia um aviso automático ao cliente sempre que um andamento visível for publicado neste processo.
          </span>
        </span>
      </label>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : processo ? 'Salvar alterações' : 'Cadastrar processo'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
