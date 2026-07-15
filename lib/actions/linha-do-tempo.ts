'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { enviarEmail, layoutEmail, botaoHtml, escapeHtml, emailConfigurado } from '@/lib/email'
import { getSiteUrl } from '@/lib/site-url'

// Avisa o cliente por e-mail quando um andamento visível é publicado — apenas
// se o processo estiver com "notificar cliente" ativado e o cliente tiver e-mail.
// Falha de e-mail nunca bloqueia a publicação.
async function notificarClienteSeAtivado(processoId: string, descricao: string) {
  if (!emailConfigurado()) return

  const admin = createAdminClient()
  const { data: processo } = await admin
    .from('processos')
    .select('id, tipo_servico, notificar_cliente, clientes:cliente_id(nome, email)')
    .eq('id', processoId)
    .single()

  if (!processo?.notificar_cliente) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cliente = processo.clientes as any as { nome: string; email: string | null } | null
  if (!cliente?.email) return

  await enviarEmail({
    para: cliente.email,
    assunto: 'Seu processo teve uma atualização',
    html: layoutEmail(
      `Olá, ${cliente.nome.split(' ')[0]} — há uma novidade no seu processo`,
      `<p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.5;">
        O escritório publicou uma atualização em <strong>${escapeHtml(processo.tipo_servico ?? 'seu processo')}</strong>:
      </p>
      <div style="padding:12px;border-left:3px solid #18181b;background-color:#fafafa;margin-bottom:8px;">
        <p style="margin:0;font-size:14px;color:#18181b;line-height:1.5;">${escapeHtml(descricao)}</p>
      </div>
      ${botaoHtml('Acompanhar meu processo', `${getSiteUrl()}/cliente/processos/${processoId}`)}`,
      'Você recebe este aviso porque o escritório ativou notificações para o seu processo.'
    ),
  })
}

export async function adicionarEvento(processoId: string, clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const visivelCliente = formData.get('visivel_cliente') === 'true'
  const descricao = formData.get('descricao') as string

  const { error } = await supabase.from('linha_do_tempo').insert({
    processo_id: processoId,
    data_evento: formData.get('data_evento') as string,
    descricao,
    visivel_cliente: visivelCliente,
    criado_por: user.id,
  })

  if (error) return { error: error.message }

  if (visivelCliente) {
    await notificarClienteSeAtivado(processoId, descricao)
  }

  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)
  return { ok: true }
}

// Converte "dd/mm/aaaa" (formato dos portais) para "aaaa-mm-dd"; datas já ISO passam direto
function paraDataISO(data: string): string {
  const br = data.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  const iso = data.match(/^\d{4}-\d{2}-\d{2}/)
  if (iso) return iso[0]
  return new Date().toISOString().slice(0, 10)
}

export async function publicarMovimento(processoId: string, clienteId: string, movimento: { data: string; descricao: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const dataEvento = paraDataISO(movimento.data)

  // evita duplicar o mesmo movimento na linha do tempo
  const { data: existente } = await supabase
    .from('linha_do_tempo')
    .select('id')
    .eq('processo_id', processoId)
    .eq('data_evento', dataEvento)
    .eq('descricao', movimento.descricao)
    .limit(1)

  if (existente && existente.length > 0) return { error: 'Este movimento já está na linha do tempo.' }

  const { error } = await supabase.from('linha_do_tempo').insert({
    processo_id: processoId,
    data_evento: dataEvento,
    descricao: movimento.descricao,
    visivel_cliente: true,
    criado_por: user.id,
  })

  if (error) return { error: error.message }

  await notificarClienteSeAtivado(processoId, movimento.descricao)

  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)
  return { ok: true }
}

export async function editarEvento(eventoId: string, processoId: string, clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('linha_do_tempo').update({
    data_evento: formData.get('data_evento') as string,
    descricao: formData.get('descricao') as string,
    visivel_cliente: formData.get('visivel_cliente') === 'true',
  }).eq('id', eventoId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)
  return { ok: true }
}

export async function removerEvento(eventoId: string, processoId: string, clienteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('linha_do_tempo').delete().eq('id', eventoId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clientes/${clienteId}/processos/${processoId}`)
  return { ok: true }
}
