'use server'

import { createClient } from '@/lib/supabase/server'

export async function assertEquipe(): Promise<
  { ok: true; userId: string } | { error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('papel')
    .eq('id', user.id)
    .single()

  if (error || !usuario || usuario.papel === 'cliente') {
    return { error: 'Sem permissão' }
  }

  return { ok: true, userId: user.id }
}
