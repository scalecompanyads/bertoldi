'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 2 * 1024 * 1024

type PermOk = {
  ok: true
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  fotoPath?: string | null
}

async function assertPodeAlterarFoto(targetUserId: string): Promise<PermOk | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  if (user.id === targetUserId) {
    const { data: eu } = await supabase
      .from('usuarios')
      .select('papel, foto_path')
      .eq('id', user.id)
      .single()
    if (!eu || eu.papel === 'cliente') return { error: 'Sem permissão' }
    return { ok: true, supabase, userId: user.id, fotoPath: eu.foto_path }
  }

  const { data: eu } = await supabase
    .from('usuarios')
    .select('papel')
    .eq('id', user.id)
    .single()

  if (eu?.papel !== 'admin') return { error: 'Sem permissão' }

  const admin = createAdminClient()
  const { data: alvo } = await admin
    .from('usuarios')
    .select('papel, foto_path')
    .eq('id', targetUserId)
    .single()

  if (!alvo || alvo.papel === 'cliente') return { error: 'Usuário não encontrado' }

  return { ok: true, supabase, userId: user.id, fotoPath: alvo.foto_path }
}

function extensaoPorTipo(tipo: string): string {
  if (tipo === 'image/png') return 'png'
  if (tipo === 'image/webp') return 'webp'
  return 'jpg'
}

export async function uploadFotoUsuario(targetUserId: string, formData: FormData) {
  const perm = await assertPodeAlterarFoto(targetUserId)
  if ('error' in perm) return { error: perm.error }

  const arquivo = formData.get('foto') as File | null
  if (!arquivo || arquivo.size === 0) return { error: 'Selecione uma imagem.' }
  if (!TIPOS_PERMITIDOS.has(arquivo.type)) {
    return { error: 'Use JPG, PNG ou WebP (máx. 2 MB).' }
  }
  if (arquivo.size > MAX_BYTES) return { error: 'A imagem deve ter no máximo 2 MB.' }

  const path = `${targetUserId}/avatar.${extensaoPorTipo(arquivo.type)}`

  const { error: uploadError } = await perm.supabase.storage
    .from('avatars')
    .upload(path, arquivo, { upsert: true, contentType: arquivo.type })

  if (uploadError) return { error: uploadError.message }

  const db = perm.userId === targetUserId ? perm.supabase : createAdminClient()
  const { error: dbError } = await db
    .from('usuarios')
    .update({ foto_path: path })
    .eq('id', targetUserId)

  if (dbError) return { error: dbError.message }

  revalidatePath('/admin/equipe')
  revalidatePath('/admin', 'layout')
  return { ok: true, fotoPath: path }
}

export async function removerFotoUsuario(targetUserId: string) {
  const perm = await assertPodeAlterarFoto(targetUserId)
  if ('error' in perm) return { error: perm.error }
  if (!perm.fotoPath) return { ok: true }

  await perm.supabase.storage.from('avatars').remove([perm.fotoPath])

  const db = perm.userId === targetUserId ? perm.supabase : createAdminClient()
  const { error } = await db.from('usuarios').update({ foto_path: null }).eq('id', targetUserId)
  if (error) return { error: error.message }

  revalidatePath('/admin/equipe')
  revalidatePath('/admin', 'layout')
  return { ok: true }
}
