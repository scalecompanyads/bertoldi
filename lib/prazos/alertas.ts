// E-mail diário de prazos (item 1.3): cada membro da equipe recebe um digest
// com as tarefas vencidas, vencendo hoje e vencendo amanhã (dia útil seguinte).
// Módulo comum chamado pelo cron /api/cron/prazos — não é server action.

import { createAdminClient } from '@/lib/supabase/admin'
import { enviarEmail, layoutEmail, itemListaHtml, botaoHtml, escapeHtml, emailConfigurado } from '@/lib/email'
import { getSiteUrl } from '@/lib/site-url'
import { proximoDiaUtil } from '@/lib/prazos'

const TZ = 'America/Sao_Paulo'

// "Hoje" no fuso de Brasília, mesmo com o servidor em UTC
function hojeBrasilia(): Date {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  const [a, m, d] = partes.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export async function enviarAlertasPrazo() {
  if (!emailConfigurado()) return { enviados: 0, pulado: true }

  const admin = createAdminClient()

  const hoje = hojeBrasilia()
  const limite = proximoDiaUtil(hoje) // fim do próximo dia útil cobre "vence amanhã"
  const limiteISO = new Date(
    limite.getFullYear(), limite.getMonth(), limite.getDate(), 23, 59, 59
  ).toISOString()

  const { data: tarefas } = await admin
    .from('tarefas')
    .select('id, usuario_id, titulo, prazo, processos:processo_id(numero_cnj, clientes:cliente_id(nome))')
    .neq('status', 'concluido')
    .not('prazo', 'is', null)
    .lte('prazo', limiteISO)
    .order('prazo')

  if (!tarefas?.length) return { enviados: 0 }

  const { data: equipe } = await admin
    .from('usuarios')
    .select('id, nome, email')
    .in('papel', ['admin', 'advogado', 'secretaria'])

  if (!equipe?.length) return { enviados: 0 }

  const agora = Date.now()
  const fimDeHoje = new Date(
    hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59
  ).getTime()

  let enviados = 0

  for (const membro of equipe) {
    const doMembro = tarefas.filter(t => t.usuario_id === membro.id)
    if (doMembro.length === 0 || !membro.email) continue

    const rotulo = (prazoISO: string) => {
      const t = new Date(prazoISO).getTime()
      if (t < agora) return 'VENCIDO'
      if (t <= fimDeHoje) return 'vence hoje'
      return 'vence amanhã'
    }

    const itens = doMembro.slice(0, 20).map(t => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proc = (t as any).processos as { numero_cnj?: string; clientes?: { nome?: string } } | null
      const contexto = [proc?.clientes?.nome, proc?.numero_cnj].filter(Boolean).join(' · ')
      const dataFmt = new Date(t.prazo!).toLocaleDateString('pt-BR', { timeZone: TZ })
      return itemListaHtml(
        `<strong>${escapeHtml(rotulo(t.prazo!))}</strong> — ${escapeHtml(t.titulo)}`,
        [dataFmt, contexto].filter(Boolean).join(' — ')
      )
    }).join('')

    const excedente = doMembro.length > 20
      ? `<p style="margin:8px 0 0;font-size:13px;color:#71717a;">…e mais ${doMembro.length - 20}.</p>`
      : ''

    const plural = doMembro.length > 1
    const r = await enviarEmail({
      para: membro.email,
      assunto: `⚠ ${doMembro.length} ${plural ? 'prazos exigindo atenção' : 'prazo exigindo atenção'}`,
      html: layoutEmail(
        `Olá, ${membro.nome.split(' ')[0]} — prazos vencendo`,
        `<p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.5;">
          ${plural ? 'Estas tarefas têm prazo vencido ou vencendo até o próximo dia útil' : 'Esta tarefa tem prazo vencido ou vencendo até o próximo dia útil'}:
        </p>
        ${itens}${excedente}
        ${botaoHtml('Abrir minhas tarefas', `${getSiteUrl()}/admin/tarefas`)}`
      ),
    })
    if (r.ok) enviados++
  }

  return { enviados, tarefasComPrazo: tarefas.length }
}

// Lembrete de audiências (item 4.3): e-mail para toda a equipe com as
// audiências de hoje e do próximo dia útil.
export async function enviarLembretesAudiencia() {
  if (!emailConfigurado()) return { enviados: 0, pulado: true }

  const admin = createAdminClient()

  const hoje = hojeBrasilia()
  const limite = proximoDiaUtil(hoje)
  const inicioISO = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
  const limiteISO = new Date(
    limite.getFullYear(), limite.getMonth(), limite.getDate(), 23, 59, 59
  ).toISOString()

  const { data: audiencias } = await admin
    .from('audiencias')
    .select('id, tipo, data_hora, local, link_video, processos:processo_id(numero_cnj, clientes:cliente_id(nome))')
    .gte('data_hora', inicioISO)
    .lte('data_hora', limiteISO)
    .order('data_hora')

  if (!audiencias?.length) return { enviados: 0 }

  const { data: equipe } = await admin
    .from('usuarios')
    .select('nome, email')
    .in('papel', ['admin', 'advogado', 'secretaria'])

  if (!equipe?.length) return { enviados: 0 }

  const fimDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59).getTime()

  const itens = audiencias.map(a => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proc = (a as any).processos as { numero_cnj?: string; clientes?: { nome?: string } } | null
    const quando = new Date(a.data_hora)
    const rotulo = quando.getTime() <= fimDeHoje ? 'HOJE' : 'próximo dia útil'
    const horario = quando.toLocaleString('pt-BR', {
      timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })
    return itemListaHtml(
      `<strong>${escapeHtml(rotulo)}</strong> — ${escapeHtml(horario)}${proc?.clientes?.nome ? ` · ${escapeHtml(proc.clientes.nome)}` : ''}`,
      [proc?.numero_cnj, a.local, a.link_video ? 'videoconferência' : null].filter(Boolean).map(String).map(escapeHtml).join(' — ')
    )
  }).join('')

  let enviados = 0
  const plural = audiencias.length > 1

  for (const membro of equipe) {
    if (!membro.email) continue
    const r = await enviarEmail({
      para: membro.email,
      assunto: `📅 ${audiencias.length} ${plural ? 'audiências próximas' : 'audiência próxima'}`,
      html: layoutEmail(
        `Olá, ${membro.nome.split(' ')[0]} — audiências agendadas`,
        `<p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.5;">
          ${plural ? 'Estas audiências acontecem hoje ou no próximo dia útil' : 'Esta audiência acontece hoje ou no próximo dia útil'}:
        </p>
        ${itens}
        ${botaoHtml('Abrir a agenda', `${getSiteUrl()}/admin/audiencias`)}`
      ),
    })
    if (r.ok) enviados++
  }

  return { enviados, audiencias: audiencias.length }
}
