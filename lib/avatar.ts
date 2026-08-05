const AVATAR_BUCKET = 'avatars'

export function getAvatarPublicUrl(fotoPath: string | null | undefined): string | null {
  if (!fotoPath) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base}/storage/v1/object/public/${AVATAR_BUCKET}/${fotoPath}`
}

export function getInitials(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
}
