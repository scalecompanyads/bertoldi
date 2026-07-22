'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { assertEquipe } from '@/lib/actions/assert-equipe'
import { botaoHtml, emailConfigurado, enviarEmail, escapeHtml, layoutEmail } from '@/lib/email'
import { getSiteUrl } from '@/lib/site-url'

export async function enviarComunicado(fd: FormData) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const clienteId = fd.get('cliente_id')?.toString() || null
  const titulo = fd.get('titulo')?.toString().trim() ?? ''
  const mensagem = fd.get('mensagem')?.toString().trim() ?? ''

  if (!titulo || !mensagem) return { error: 'Título e mensagem são obrigatórios.' }

  let clientesQuery = supabase
    .from('clientes')
    .select('id, nome, email')
    .eq('arquivado', false)

  if (clienteId) clientesQuery = clientesQuery.eq('id', clienteId)

  const { data: clientes, error: clientesError } = await clientesQuery
  if (clientesError) return { error: clientesError.message }
  if (!clientes?.length) return { error: 'Nenhum destinatário ativo foi encontrado.' }

  const { data: comunicado, error } = await supabase
    .from('comunicados')
    .insert({ cliente_id: clienteId, titulo, mensagem })
    .select('id')
    .single()

  if (error || !comunicado) return { error: error?.message ?? 'Não foi possível criar o comunicado.' }

  const { error: destinatariosError } = await supabase
    .from('comunicado_destinatarios')
    .insert(clientes.map(cliente => ({
      comunicado_id: comunicado.id,
      cliente_id: cliente.id,
    })))

  if (destinatariosError) {
    await supabase.from('comunicados').delete().eq('id', comunicado.id)
    return { error: destinatariosError.message }
  }

  let emailsEnviados = 0
  let emailsFalharam = 0

  if (emailConfigurado()) {
    for (const cliente of clientes) {
      if (!cliente.email) continue

      const envio = await enviarEmail({
        para: cliente.email,
        assunto: titulo,
        idempotencyKey: `comunicado/${comunicado.id}/cliente/${cliente.id}`,
        html: layoutEmail(
          `Olá, ${cliente.nome.split(' ')[0]} — você recebeu um novo aviso`,
          `<p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.5;">
            <strong>${escapeHtml(titulo)}</strong>
          </p>
          <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.5;white-space:pre-line;">${escapeHtml(mensagem)}</p>
          ${botaoHtml('Ler aviso', `${getSiteUrl()}/cliente/comunicados`)}`
        ),
      })

      if (envio.ok) {
        emailsEnviados++
        await supabase
          .from('comunicado_destinatarios')
          .update({ email_enviado_em: new Date().toISOString() })
          .eq('comunicado_id', comunicado.id)
          .eq('cliente_id', cliente.id)
      } else {
        emailsFalharam++
      }
    }
  }

  revalidatePath('/admin/comunicados')
  revalidatePath('/cliente')
  revalidatePath('/cliente/comunicados')
  if (clienteId) revalidatePath(`/admin/clientes/${clienteId}`)
  return {
    ok: true,
    destinatarios: clientes.length,
    emailsEnviados,
    emailsFalharam,
    emailDesativado: !emailConfigurado(),
  }
}

export async function marcarComoLido(comunicadoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('usuario_id', user.id)
    .maybeSingle()

  if (!cliente) return { error: 'Cliente não encontrado.' }

  const admin = createAdminClient()
  const { data: destinatario, error } = await admin
    .from('comunicado_destinatarios')
    .update({ lido_em: new Date().toISOString() })
    .eq('comunicado_id', comunicadoId)
    .eq('cliente_id', cliente.id)
    .is('lido_em', null)
    .select('comunicado_id')
    .maybeSingle()

  if (error) return { error: error.message }
  if (!destinatario) return { error: 'Comunicado não encontrado ou já lido.' }

  revalidatePath('/cliente')
  revalidatePath('/cliente/comunicados')
  return { ok: true }
}

export async function removerComunicado(comunicadoId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('comunicados').delete().eq('id', comunicadoId)
  if (error) return { error: error.message }
  revalidatePath('/admin/comunicados')
  return { ok: true }
}
