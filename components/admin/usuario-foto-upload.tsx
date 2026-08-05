'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { UsuarioAvatar } from '@/components/shared/usuario-avatar'
import { removerFotoUsuario, uploadFotoUsuario } from '@/lib/actions/equipe-foto'

interface Props {
  userId: string
  nome: string
  fotoPath?: string | null
  /** compacto = só avatar clicável; completo = botões explícitos */
  variant?: 'compacto' | 'completo'
  size?: 'sm' | 'default' | 'lg'
  podeRemover?: boolean
}

export function UsuarioFotoUpload({
  userId,
  nome,
  fotoPath,
  variant = 'completo',
  size = 'default',
  podeRemover = true,
}: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function enviar(file: File) {
    setLoading(true)
    const fd = new FormData()
    fd.set('foto', file)
    const res = await uploadFotoUsuario(userId, fd)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Foto atualizada.')
      setPreview(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    await enviar(file)
    e.target.value = ''
  }

  async function remover() {
    if (!confirm('Remover a foto de perfil?')) return
    setLoading(true)
    const res = await removerFotoUsuario(userId)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Foto removida.')
      setPreview(null)
      router.refresh()
    }
    setLoading(false)
  }

  const avatar = (
    <div className="relative shrink-0">
      {preview ? (
        <div
          className={`overflow-hidden rounded-full border border-border ${
            size === 'lg' ? 'size-10' : size === 'sm' ? 'size-6' : 'size-8'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="size-full object-cover" />
        </div>
      ) : (
        <UsuarioAvatar nome={nome} fotoPath={fotoPath} size={size} />
      )}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </span>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onFileChange}
      />

      {variant === 'compacto' ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Alterar foto de perfil"
        >
          {avatar}
          <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border bg-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
            <Camera className="h-3 w-3 text-muted-foreground" />
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-3">
          {avatar}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="h-3.5 w-3.5 mr-1" />
              {fotoPath || preview ? 'Trocar foto' : 'Adicionar foto'}
            </Button>
            {podeRemover && (fotoPath || preview) && (
              <Button type="button" size="sm" variant="ghost" disabled={loading} onClick={remover}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remover
              </Button>
            )}
          </div>
        </div>
      )}

      {variant === 'completo' && (
        <p className="text-xs text-muted-foreground">JPG, PNG ou WebP · máx. 2 MB</p>
      )}
    </div>
  )
}
