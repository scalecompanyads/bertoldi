'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarCliente(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('clientes').insert({
    nome: formData.get('nome') as string,
    cpf_cnpj: (formData.get('cpf_cnpj') as string) || null,
    telefone: (formData.get('telefone') as string) || null,
    email: (formData.get('email') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/clientes')
  return { ok: true }
}

export async function atualizarCliente(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('clientes').update({
    nome: formData.get('nome') as string,
    cpf_cnpj: (formData.get('cpf_cnpj') as string) || null,
    telefone: (formData.get('telefone') as string) || null,
    email: (formData.get('email') as string) || null,
    atualizado_em: new Date().toISOString(),
    atualizado_por: user.id,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${id}`)
  return { ok: true }
}
