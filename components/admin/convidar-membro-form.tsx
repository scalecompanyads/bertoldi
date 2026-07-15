'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { UserPlus, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { convidarMembro } from '@/lib/actions/equipe'
import type { PapelUsuario } from '@/lib/types'

export function ConvidarMembroForm() {
  const [aberto, setAberto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [papel, setPapel] = useState<PapelUsuario>('advogado')
  const formRef = useRef<HTMLFormElement>(null)

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('papel', papel)
    const res = await convidarMembro(fd)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.message ?? 'Convite enviado.')
      formRef.current?.reset()
      setAberto(false)
    }
    setLoading(false)
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Convidar membro
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    )
  }

  return (
    <form ref={formRef} onSubmit={enviar} className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Convidar membro da equipe</p>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="convite-nome">Nome *</Label>
          <Input id="convite-nome" name="nome" required placeholder="Ex: Ana Souza" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="convite-email">E-mail *</Label>
          <Input id="convite-email" name="email" type="email" required placeholder="ana@escritorio.com.br" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Papel</Label>
          <Select value={papel} onValueChange={(v) => setPapel((v as PapelUsuario) ?? 'advogado')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="advogado">Advogado(a)</SelectItem>
              <SelectItem value="secretaria">Secretaria</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="convite-oab">OAB (nº)</Label>
          <Input id="convite-oab" name="oab_numero" inputMode="numeric" placeholder="Opcional" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="convite-oabuf">UF da OAB</Label>
          <Input id="convite-oabuf" name="oab_uf" maxLength={2} placeholder="Ex: SC" className="uppercase" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        A pessoa recebe um e-mail com link para definir a senha. Com OAB preenchida, as intimações
        dela no DJEN passam a ser monitoradas automaticamente.
      </p>

      <Button type="submit" size="sm" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar convite'}
      </Button>
    </form>
  )
}
