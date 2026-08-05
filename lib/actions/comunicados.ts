'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { assertAdmin, assertEquipe } from '@/lib/actions/assert-equipe'
import { botaoHtml, emailConfigurado, enviarEmail, escapeHtml, layoutEmail } from '@/lib/email'
import { getSiteUrl } from '@/lib/site-url'
import type { PublicoComunicado } from '@/lib/types'

type ClienteDest = { id: string; nome: string; email: string | null }
type AdvogadoDest = { id: string; nome: string; email: string }

function parsePublico(valor: FormDataEntryValue | null): PublicoComunicado | null {
  if (valor === 'clientes' || valor === 'advogados' || valor === 'todos') return valor
  return null
}

async function enviarEmailsClientes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  comunicadoId: string,
  titulo: string,
  mensagem: string,
  clientes: ClienteDest[]
) {
  let emailsEnviados = 0
  let emailsFalharam = 0

  if (!emailConfigurado()) return { emailsEnviados, emailsFalharam }

  for (const cliente of clientes) {
    if (!cliente.email) continue

    const envio = await enviarEmail({
      para: cliente.email,
      assunto: titulo,
      idempotencyKey: `comunicado/${comunicadoId}/cliente/${cliente.id}`,
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
        .eq('comunicado_id', comunicadoId)
        .eq('cliente_id', cliente.id)
    } else {
      emailsFalharam++
    }
  }

  return { emailsEnviados, emailsFalharam }
}

async function enviarEmailsAdvogados(
  supabase: Awaited<ReturnType<typeof createClient>>,
  comunicadoId: string,
  titulo: string,
  mensagem: string,
  advogados: AdvogadoDest[]
) {
  let emailsEnviados = 0
  let emailsFalharam = 0

  if (!emailConfigurado()) return { emailsEnviados, emailsFalharam }

  for (const adv of advogados) {
    const envio = await enviarEmail({
      para: adv.email,
      assunto: titulo,
      idempotencyKey: `comunicado/${comunicadoId}/usuario/${adv.id}`,
      html: layoutEmail(
        `Olá, ${adv.nome.split(' ')[0]} — novo aviso interno`,
        `<p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.5;">
          <strong>${escapeHtml(titulo)}</strong>
        </p>
        <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.5;white-space:pre-line;">${escapeHtml(mensagem)}</p>
        ${botaoHtml('Ver avisos', `${getSiteUrl()}/admin/comunicados`)}`
      ),
    })

    if (envio.ok) {
      emailsEnviados++
      await supabase
        .from('comunicado_destinatarios_usuario')
        .update({ email_enviado_em: new Date().toISOString() })
        .eq('comunicado_id', comunicadoId)
        .eq('usuario_id', adv.id)
    } else {
      emailsFalharam++
    }
  }

  return { emailsEnviados, emailsFalharam }
}

export async function enviarComunicado(fd: FormData) {
  const publico = parsePublico(fd.get('publico'))
  if (!publico) return { error: 'Selecione o tipo de destinatário.' }

  const auth =
    publico === 'clientes' ? await assertEquipe() : await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const admin = createAdminClient()
  const clienteId = fd.get('cliente_id')?.toString() || null
  const titulo = fd.get('titulo')?.toString().trim() ?? ''
  const mensagem = fd.get('mensagem')?.toString().trim() ?? ''

  if (!titulo || !mensagem) return { error: 'Título e mensagem são obrigatórios.' }

  const incluirClientes = publico === 'clientes' || publico === 'todos'
  const incluirAdvogados = publico === 'advogados' || publico === 'todos'

  let clientes: ClienteDest[] = []
  if (incluirClientes) {
    let clientesQuery = admin
      .from('clientes')
      .select('id, nome, email')
      .eq('arquivado', false)

    if (publico === 'clientes' && clienteId) {
      clientesQuery = clientesQuery.eq('id', clienteId)
    }

    const { data, error: clientesError } = await clientesQuery
    if (clientesError) return { error: clientesError.message }
    clientes = data ?? []
  }

  let advogados: AdvogadoDest[] = []
  if (incluirAdvogados) {
    const { data, error: advError } = await admin
      .from('usuarios')
      .select('id, nome, email')
      .eq('papel', 'advogado')

    if (advError) return { error: advError.message }
    advogados = (data ?? []).filter((u): u is AdvogadoDest => Boolean(u.email))
  }

  const totalDestinatarios = clientes.length + advogados.length
  if (totalDestinatarios === 0) {
    return { error: 'Nenhum destinatário ativo foi encontrado para este público.' }
  }

  const { data: comunicado, error } = await supabase
    .from('comunicados')
    .insert({
      cliente_id: publico === 'clientes' ? clienteId : null,
      publico,
      titulo,
      mensagem,
    })
    .select('id')
    .single()

  if (error || !comunicado) {
    return { error: error?.message ?? 'Não foi possível criar o comunicado.' }
  }

  if (clientes.length > 0) {
    const { error: destinatariosError } = await supabase
      .from('comunicado_destinatarios')
      .insert(
        clientes.map((cliente) => ({
          comunicado_id: comunicado.id,
          cliente_id: cliente.id,
        }))
      )

    if (destinatariosError) {
      await supabase.from('comunicados').delete().eq('id', comunicado.id)
      return { error: destinatariosError.message }
    }
  }

  if (advogados.length > 0) {
    const { error: equipeError } = await supabase
      .from('comunicado_destinatarios_usuario')
      .insert(
        advogados.map((adv) => ({
          comunicado_id: comunicado.id,
          usuario_id: adv.id,
        }))
      )

    if (equipeError) {
      await supabase.from('comunicados').delete().eq('id', comunicado.id)
      return { error: equipeError.message }
    }
  }

  const emailsClientes = await enviarEmailsClientes(
    supabase,
    comunicado.id,
    titulo,
    mensagem,
    clientes
  )
  const emailsAdvogados = await enviarEmailsAdvogados(
    supabase,
    comunicado.id,
    titulo,
    mensagem,
    advogados
  )

  revalidatePath('/admin/comunicados')
  revalidatePath('/admin')
  revalidatePath('/cliente')
  revalidatePath('/cliente/comunicados')
  if (clienteId) revalidatePath(`/admin/clientes/${clienteId}`)

  return {
    ok: true,
    destinatarios: totalDestinatarios,
    emailsEnviados: emailsClientes.emailsEnviados + emailsAdvogados.emailsEnviados,
    emailsFalharam: emailsClientes.emailsFalharam + emailsAdvogados.emailsFalharam,
    emailDesativado: !emailConfigurado(),
    publico,
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

export async function marcarComunicadoEquipeLido(comunicadoId: string) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comunicado_destinatarios_usuario')
    .update({ lido_em: new Date().toISOString() })
    .eq('comunicado_id', comunicadoId)
    .eq('usuario_id', auth.userId)
    .is('lido_em', null)
    .select('comunicado_id')
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Aviso não encontrado ou já lido.' }

  revalidatePath('/admin/comunicados')
  revalidatePath('/admin')
  return { ok: true }
}

export async function removerComunicado(comunicadoId: string) {
  const auth = await assertEquipe()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('comunicados').delete().eq('id', comunicadoId)
  if (error) return { error: error.message }
  revalidatePath('/admin/comunicados')
  return { ok: true }
}
