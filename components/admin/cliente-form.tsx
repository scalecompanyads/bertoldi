'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { criarCliente, atualizarCliente } from '@/lib/actions/clientes'
import { salvarLinkConviteNaSessao } from '@/components/admin/cliente-acesso-panel'
import { formatCpfInput } from '@/lib/cpf'
import type { Cliente } from '@/lib/types'

export function ClienteForm({ cliente }: { cliente?: Cliente }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [liberarAcesso, setLiberarAcesso] = useState(true)
  const [cpf, setCpf] = useState(cliente?.cpf_cnpj ?? '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('cpf_cnpj', cpf)

    if (!cliente && liberarAcesso) {
      fd.set('liberar_acesso', 'on')
    }

    const result = cliente
      ? await atualizarCliente(cliente.id, fd)
      : await criarCliente(fd)

    if ('error' in result && result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    if ('warning' in result && typeof result.warning === 'string') {
      toast.warning(result.warning)
    } else if ('message' in result && typeof result.message === 'string') {
      if ('emailEnviado' in result && result.emailEnviado === false) {
        toast.warning(result.message)
      } else {
        toast.success(result.message)
      }
    } else {
      toast.success(cliente ? 'Cliente atualizado.' : 'Cliente cadastrado.')
    }

    if ('linkConvite' in result && typeof result.linkConvite === 'string') {
      salvarLinkConviteNaSessao(result.linkConvite)
    }

    if (!cliente && 'id' in result && result.id) {
      router.push(`/admin/clientes/${result.id}`)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome *</Label>
        <Input id="nome" name="nome" required defaultValue={cliente?.nome} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cpf_cnpj">CPF *</Label>
        <Input
          id="cpf_cnpj"
          name="cpf_cnpj"
          inputMode="numeric"
          required={!cliente && liberarAcesso}
          value={cpf}
          placeholder="000.000.000-00"
          onChange={(e) => setCpf(formatCpfInput(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">Usado pelo cliente para entrar na área restrita.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail {(!cliente && liberarAcesso) ? '*' : ''}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required={!cliente && liberarAcesso}
          defaultValue={cliente?.email ?? ''}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="telefone">Telefone</Label>
        <Input id="telefone" name="telefone" defaultValue={cliente?.telefone ?? ''} />
      </div>

      {!cliente && (
        <label className="flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
          <input
            type="checkbox"
            name="liberar_acesso"
            checked={liberarAcesso}
            onChange={(e) => setLiberarAcesso(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-sm leading-snug">
            <span className="font-medium">Enviar convite de acesso por e-mail</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              O cliente receberá um link para criar a senha e entrar com CPF.
            </span>
          </span>
        </label>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
