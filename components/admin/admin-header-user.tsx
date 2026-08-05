'use client'

import { ThemeToggle } from '@/components/shared/theme-toggle'
import { UsuarioFotoUpload } from '@/components/admin/usuario-foto-upload'

interface Props {
  userId: string
  nome: string
  fotoPath?: string | null
}

export function AdminHeaderUser({ userId, nome, fotoPath }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        Olá, <span className="font-medium text-foreground">{nome}</span>
      </span>
      <UsuarioFotoUpload
        userId={userId}
        nome={nome}
        fotoPath={fotoPath}
        variant="compacto"
        size="default"
      />
      <ThemeToggle />
    </div>
  )
}
