'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, X, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { atualizarMembro, removerMembro } from '@/lib/actions/equipe'
import { UsuarioAvatar } from '@/components/shared/usuario-avatar'
import { UsuarioFotoUpload } from '@/components/admin/usuario-foto-upload'
import type { Usuario, PapelUsuario } from '@/lib/types'

const PAPEL_LABEL: Record<Exclude<PapelUsuario, 'cliente'>, string> = {
  admin: 'Administrador',
  advogado: 'Advogado(a)',
  secretaria: 'Secretaria',
}

function nomeExibicao({ nome, email }: Pick<Usuario, 'nome' | 'email'>): string {
  const limpo = nome.trim()
  if (!limpo) return 'Nome não informado'
  if (limpo.toLowerCase() === email.trim().toLowerCase() || limpo.includes('@')) {
    return limpo.split('@')[0]
  }
  return limpo
}

export function MembroEquipeCard({ membro, usuarioAtualId }: { membro: Usuario; usuarioAtualId: string }) {
  const [editando, setEditando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [papel, setPapel] = useState<PapelUsuario>(membro.papel)

  const souEu = membro.id === usuarioAtualId

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('papel', papel)
    const res = await atualizarMembro(membro.id, fd)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Membro atualizado.')
      setEditando(false)
    }
    setLoading(false)
  }

  async function remover() {
    if (!confirm(`Remover ${nomeExibicao(membro)} da equipe? O acesso ao sistema será revogado imediatamente.`)) return
    setLoading(true)
    const res = await removerMembro(membro.id)
    if (res.error) toast.error(res.error)
    else toast.success('Membro removido.')
    setLoading(false)
  }

  if (editando) {
    return (
      <form onSubmit={salvar} className="rounded-lg border border-primary/40 p-4 space-y-3">
        <UsuarioFotoUpload
          userId={membro.id}
          nome={membro.nome}
          fotoPath={membro.foto_path}
          variant="completo"
          size="lg"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`nome-${membro.id}`}>Nome</Label>
            <Input id={`nome-${membro.id}`} name="nome" required defaultValue={membro.nome} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`email-${membro.id}`}>E-mail de acesso</Label>
            <Input
              id={`email-${membro.id}`}
              name="email"
              type="email"
              required
              defaultValue={membro.email}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Papel</Label>
            <Select value={papel} onValueChange={(v) => setPapel((v as PapelUsuario) ?? membro.papel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="advogado">Advogado(a)</SelectItem>
                <SelectItem value="secretaria">Secretaria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`oab-${membro.id}`}>OAB (nº)</Label>
            <Input
              id={`oab-${membro.id}`}
              name="oab_numero"
              inputMode="numeric"
              defaultValue={membro.oab_numero ?? ''}
              placeholder="Ex: 55353"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`oabuf-${membro.id}`}>UF da OAB</Label>
            <Input
              id={`oabuf-${membro.id}`}
              name="oab_uf"
              maxLength={2}
              defaultValue={membro.oab_uf ?? ''}
              placeholder="Ex: SC"
              className="uppercase"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`aasp-${membro.id}`}>Chave AASP</Label>
          <Input
            id={`aasp-${membro.id}`}
            name="aasp_chave"
            defaultValue={membro.aasp_chave ?? ''}
            placeholder="Token fornecido pela AASP"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Token individual fornecido pela AASP. Preencha para monitorar publicações via AASP além do DJEN.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditando(false)}>
            <X className="h-3.5 w-3.5 mr-1" />
            Cancelar
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="rounded-lg border p-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <UsuarioAvatar nome={membro.nome} fotoPath={membro.foto_path} size="lg" className="mt-0.5" />
        <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-base font-semibold leading-snug">{nomeExibicao(membro)}</p>
          <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {PAPEL_LABEL[membro.papel as Exclude<PapelUsuario, 'cliente'>] ?? membro.papel}
          </span>
          {souEu && (
            <span className="text-[10px] text-muted-foreground">(você)</span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/70 truncate" title={membro.email}>
          {membro.email}
        </p>
        {membro.oab_numero ? (
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <BadgeCheck className="h-3 w-3 text-green-600 dark:text-green-400" />
            OAB {membro.oab_numero}/{membro.oab_uf} — DJEN monitorado
          </p>
        ) : membro.papel !== 'secretaria' ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">Sem OAB — DJEN não monitorado</p>
        ) : null}
        {membro.aasp_chave ? (
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <BadgeCheck className="h-3 w-3 text-blue-500" />
            AASP configurada
          </p>
        ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setEditando(true)}
          disabled={loading}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          title="Editar membro"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {!souEu && (
          <button
            onClick={remover}
            disabled={loading}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-accent transition-colors disabled:opacity-50"
            title="Remover da equipe"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
