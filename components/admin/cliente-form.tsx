'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { criarCliente, atualizarCliente } from '@/lib/actions/clientes'
import type { Cliente } from '@/lib/types'

export function ClienteForm({ cliente }: { cliente?: Cliente }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    const result = cliente
      ? await atualizarCliente(cliente.id, fd)
      : await criarCliente(fd)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(cliente ? 'Cliente atualizado.' : 'Cliente cadastrado.')
      if (!cliente) router.push('/admin/clientes')
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
        <Label htmlFor="cpf_cnpj">CPF / CNPJ</Label>
        <Input id="cpf_cnpj" name="cpf_cnpj" defaultValue={cliente?.cpf_cnpj ?? ''} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={cliente?.email ?? ''} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="telefone">Telefone</Label>
        <Input id="telefone" name="telefone" defaultValue={cliente?.telefone ?? ''} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
