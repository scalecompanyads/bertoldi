'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getAuthCallbackUrl } from '@/lib/site-url'
import type { PapelUsuario } from '@/lib/types'

const PAPEIS_EQUIPE: PapelUsuario[] = ['admin', 'advogado', 'secretaria']
const UFS = new Set([
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
])

async function assertAdmin(): Promise<{ ok: true; userId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('papel')
    .eq('id', user.id)
    .single()

  if (usuario?.papel !== 'admin') {
    return { error: 'Apenas administradores podem gerenciar a equipe.' }
  }
  return { ok: true, userId: user.id }
}

function validarOab(numero: string, uf: string): { error: string } | { ok: true; numero: string | null; uf: string | null } {
  const numeroLimpo = numero.replace(/\D/g, '')
  const ufLimpa = uf.trim().toUpperCase()

  // OAB é opcional (secretária não tem), mas se um campo vier, o outro é obrigatório
  if (!numeroLimpo && !ufLimpa) return { ok: true, numero: null, uf: null }
  if (!numeroLimpo || !ufLimpa) {
    return { error: 'Preencha número e UF da OAB juntos, ou deixe ambos em branco.' }
  }
  if (!UFS.has(ufLimpa)) return { error: `UF da OAB inválida: ${ufLimpa}` }

  return { ok: true, numero: numeroLimpo, uf: ufLimpa }
}

export async function atualizarMembro(id: string, formData: FormData) {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  const nome = (formData.get('nome') as string)?.trim()
  if (!nome) return { error: 'Nome é obrigatório.' }

  const papel = formData.get('papel') as PapelUsuario
  if (!PAPEIS_EQUIPE.includes(papel)) return { error: 'Papel inválido.' }

  const oab = validarOab(
    (formData.get('oab_numero') as string) ?? '',
    (formData.get('oab_uf') as string) ?? ''
  )
  if ('error' in oab) return { error: oab.error }

  // Trava de segurança: não deixar o escritório sem nenhum admin
  const admin = createAdminClient()
  if (auth.userId === id && papel !== 'admin') {
    const { count } = await admin
      .from('usuarios')
      .select('id', { count: 'exact', head: true })
      .eq('papel', 'admin')
    if ((count ?? 0) <= 1) {
      return { error: 'Você é o único administrador — promova outra pessoa antes de mudar seu papel.' }
    }
  }

  const { error } = await admin
    .from('usuarios')
    .update({ nome, papel, oab_numero: oab.numero, oab_uf: oab.uf })
    .eq('id', id)
    .neq('papel', 'cliente') // esta tela nunca altera contas de cliente

  if (error) return { error: error.message }
  revalidatePath('/admin/equipe')
  return { ok: true }
}

export async function convidarMembro(formData: FormData) {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  const nome = (formData.get('nome') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const papel = formData.get('papel') as PapelUsuario

  if (!nome) return { error: 'Nome é obrigatório.' }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'E-mail inválido.' }
  if (!PAPEIS_EQUIPE.includes(papel)) return { error: 'Papel inválido.' }

  const oab = validarOab(
    (formData.get('oab_numero') as string) ?? '',
    (formData.get('oab_uf') as string) ?? ''
  )
  if ('error' in oab) return { error: oab.error }

  const admin = createAdminClient()

  const { data: existente } = await admin
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existente) return { error: 'Já existe um usuário com este e-mail.' }

  // O trigger handle_new_user cria a linha em usuarios com o papel do convite
  const { data: convite, error: conviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: getAuthCallbackUrl('/auth/definir-senha'),
    data: { nome, papel },
  })

  if (conviteError) return { error: `Falha ao enviar convite: ${conviteError.message}` }

  // OAB não passa pelo trigger — grava direto após a criação
  if (oab.numero && convite.user) {
    await admin
      .from('usuarios')
      .update({ oab_numero: oab.numero, oab_uf: oab.uf })
      .eq('id', convite.user.id)
  }

  revalidatePath('/admin/equipe')
  return { ok: true, message: `Convite enviado para ${email}.` }
}

export async function removerMembro(id: string) {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  if (auth.userId === id) return { error: 'Você não pode remover a si mesmo.' }

  const admin = createAdminClient()

  const { data: membro } = await admin
    .from('usuarios')
    .select('papel')
    .eq('id', id)
    .single()

  if (!membro) return { error: 'Membro não encontrado.' }
  if (membro.papel === 'cliente') return { error: 'Contas de cliente são gerenciadas na ficha do cliente.' }

  // Remove do Auth — o cascade apaga a linha em usuarios; processos do
  // responsável ficam com responsavel_id nulo (on delete set null)
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { error: error.message }

  revalidatePath('/admin/equipe')
  return { ok: true }
}
