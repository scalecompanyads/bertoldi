import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarPublicUrl, getInitials } from '@/lib/avatar'
import { cn } from '@/lib/utils'

interface Props {
  nome: string
  fotoPath?: string | null
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function UsuarioAvatar({ nome, fotoPath, size = 'default', className }: Props) {
  const url = getAvatarPublicUrl(fotoPath)

  return (
    <Avatar size={size} className={className}>
      {url ? <AvatarImage src={url} alt={nome} /> : null}
      <AvatarFallback>{getInitials(nome)}</AvatarFallback>
    </Avatar>
  )
}

interface ComNomeProps extends Props {
  mostrarNome?: boolean
  nomeClassName?: string
}

export function UsuarioAvatarComNome({
  nome,
  fotoPath,
  size = 'default',
  className,
  mostrarNome = true,
  nomeClassName,
}: ComNomeProps) {
  return (
    <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
      <UsuarioAvatar nome={nome} fotoPath={fotoPath} size={size} />
      {mostrarNome && (
        <span className={cn('truncate text-sm', nomeClassName)}>
          Olá, <span className="font-medium text-foreground">{nome}</span>
        </span>
      )}
    </div>
  )
}
