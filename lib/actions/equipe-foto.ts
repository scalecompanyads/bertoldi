'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 2 * 1024 * 1024

type PermOk = {
  ok: true
  userId: string
  fotoPath: string | null
}

async function getFotoPath(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('usuarios')
    .select('foto_path')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.foto_path ?? null
}

function erroDbFoto(message: string) {
  if (/foto_path|column.*does not exist/i.test(message)) {
    return 'Fotos de perfil ainda não estão habilitadas no banco. Aplique a migration 0017_usuario_foto.sql no Supabase.'
  }
  return message
}

function erroStorageFoto(message: string) {
  if (/bucket.*not found|does not exist/i.test(message)) {
    return 'Bucket de avatars não configurado. Aplique a migration 0017_usuario_foto.sql no Supabase.'
  }
  if (/row-level security|permission|policy/i.test(message)) {
    return 'Sem permissão para enviar a foto. Confirme que a migration 0017_usuario_foto.sql foi aplicada.'
  }
  return message
}

async function assertPodeAlterarFoto(targetUserId: string): Promise<PermOk | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  if (user.id === targetUserId) {
    const { data: eu, error } = await supabase
      .from('usuarios')
      .select('papel')
      .eq('id', user.id)
      .single()
    if (error || !eu || eu.papel === 'cliente') return { error: 'Sem permissão' }
    const fotoPath = await getFotoPath(user.id)
    return { ok: true, userId: user.id, fotoPath }
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
    .select('papel')
    .eq('id', targetUserId)
    .single()

  if (!alvo || alvo.papel === 'cliente') return { error: 'Usuário não encontrado' }

  const fotoPath = await getFotoPath(targetUserId)
  return { ok: true, userId: user.id, fotoPath }
}

function normalizarTipo(arquivo: File): string | null {
  if (TIPOS_PERMITIDOS.has(arquivo.type)) return arquivo.type
  if (arquivo.type === 'image/jpg') return 'image/jpeg'

  const ext = arquivo.name.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return null
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

  const contentType = normalizarTipo(arquivo)
  if (!contentType) {
    return { error: 'Use JPG, PNG ou WebP (máx. 2 MB).' }
  }
  if (arquivo.size > MAX_BYTES) return { error: 'A imagem deve ter no máximo 2 MB.' }

  const admin = createAdminClient()
  const path = `${targetUserId}/${Date.now()}.${extensaoPorTipo(contentType)}`

  if (perm.fotoPath) {
    await admin.storage.from('avatars').remove([perm.fotoPath])
  }

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, arquivo, { upsert: false, contentType })

  if (uploadError) return { error: erroStorageFoto(uploadError.message) }

  const { error: dbError } = await admin
    .from('usuarios')
    .update({ foto_path: path })
    .eq('id', targetUserId)

  if (dbError) {
    await admin.storage.from('avatars').remove([path])
    return { error: erroDbFoto(dbError.message) }
  }

  revalidatePath('/admin/equipe')
  revalidatePath('/admin', 'layout')
  return { ok: true, fotoPath: path }
}

export async function removerFotoUsuario(targetUserId: string) {
  const perm = await assertPodeAlterarFoto(targetUserId)
  if ('error' in perm) return { error: perm.error }
  if (!perm.fotoPath) return { ok: true }

  const admin = createAdminClient()
  await admin.storage.from('avatars').remove([perm.fotoPath])

  const { error } = await admin.from('usuarios').update({ foto_path: null }).eq('id', targetUserId)
  if (error) return { error: erroDbFoto(error.message) }

  revalidatePath('/admin/equipe')
  revalidatePath('/admin', 'layout')
  return { ok: true }
}
