'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClienteSelect } from '@/components/shared/cliente-select'
import { enviarComunicado } from '@/lib/actions/comunicados'
import type { Cliente, PublicoComunicado } from '@/lib/types'

interface Props {
  clientes: (Pick<Cliente, 'id' | 'nome'> & { cpf_cnpj?: string | null })[]
  clientePreSelecionado?: string
  isAdmin?: boolean
}

const PUBLICO_LABEL: Record<PublicoComunicado, string> = {
  todos: 'Todos (clientes + advogados)',
  advogados: 'Advogados',
  clientes: 'Clientes',
}

export function ComunicadoForm({ clientes, clientePreSelecionado, isAdmin = false }: Props) {
  const [loading, setLoading] = useState(false)
  const [publico, setPublico] = useState<PublicoComunicado>('clientes')
  const [clienteId, setClienteId] = useState(clientePreSelecionado ?? '__global__')
  const [key, setKey] = useState(0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('publico', publico)

    if (publico === 'clientes' && clienteId !== '__global__') {
      fd.set('cliente_id', clienteId)
    } else {
      fd.delete('cliente_id')
    }

    const result = await enviarComunicado(fd)
    if (result.error) {
      toast.error(result.error)
    } else {
      const emailsEnviados = result.emailsEnviados ?? 0
      const emailsFalharam = result.emailsFalharam ?? 0
      const resumoEmail = result.emailDesativado
        ? ' E-mail desativado neste ambiente.'
        : ` ${emailsEnviados} e-mail${emailsEnviados === 1 ? '' : 's'} enviado${emailsEnviados === 1 ? '' : 's'}.`
      const tipo =
        result.publico === 'advogados'
          ? 'advogado'
          : result.publico === 'todos'
            ? 'destinatário'
            : 'cliente'
      toast.success(
        `Comunicado enviado a ${result.destinatarios} ${tipo}${result.destinatarios === 1 ? '' : 's'}.${resumoEmail}`
      )
      if (emailsFalharam > 0) {
        toast.warning(
          emailsFalharam === 1
            ? '1 e-mail não pôde ser enviado.'
            : `${emailsFalharam} e-mails não puderam ser enviados.`
        )
      }
      setKey((k) => k + 1)
      setPublico('clientes')
      setClienteId(clientePreSelecionado ?? '__global__')
    }
    setLoading(false)
  }

  return (
    <form key={key} onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4 bg-muted/30">
      <h3 className="text-sm font-semibold">Novo comunicado</h3>

      {isAdmin && (
        <div className="space-y-1.5">
          <Label htmlFor="publico">Destinatários</Label>
          <Select
            value={publico}
            onValueChange={(v) => setPublico(v as PublicoComunicado)}
          >
            <SelectTrigger id="publico">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">{PUBLICO_LABEL.todos}</SelectItem>
              <SelectItem value="advogados">{PUBLICO_LABEL.advogados}</SelectItem>
              <SelectItem value="clientes">{PUBLICO_LABEL.clientes}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {(!isAdmin || publico === 'clientes') && (
        <div className="space-y-1.5">
          <Label>{isAdmin ? 'Cliente específico (opcional)' : 'Destinatário'}</Label>
          <ClienteSelect
            value={clienteId}
            onValueChange={setClienteId}
            clientes={clientes}
            globalOption={{ value: '__global__', label: 'Todos os clientes' }}
            placeholder="Selecionar destinatário..."
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="titulo">Título *</Label>
        <Input id="titulo" name="titulo" required placeholder="Ex: Atualização processual" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mensagem">Mensagem *</Label>
        <Textarea id="mensagem" name="mensagem" required rows={3} placeholder="Descreva o aviso..." />
      </div>

      <Button type="submit" size="sm" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar comunicado'}
      </Button>
    </form>
  )
}
