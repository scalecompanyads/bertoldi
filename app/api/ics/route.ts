import { createClient } from '@/lib/supabase/server'
import { TIPO_AUDIENCIA_LABEL, type Audiencia } from '@/lib/types'

// Exporta a agenda de audiências como iCalendar (.ics) para importar no
// Google Calendar/Outlook. Requer sessão de equipe (o download sai do browser
// logado); a RLS de audiencias já bloqueia clientes.

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function icsData(iso: string): string {
  // UTC no formato aaaammddThhmmssZ
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Não autorizado.', { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('papel')
    .eq('id', user.id)
    .single()
  if (!usuario || usuario.papel === 'cliente') {
    return new Response('Não autorizado.', { status: 403 })
  }

  const { data } = await supabase
    .from('audiencias')
    .select('*, processo:processo_id(numero_cnj, tipo_servico, clientes:cliente_id(nome))')
    .order('data_hora')

  const audiencias = (data ?? []) as unknown as Audiencia[]

  const eventos = audiencias.map(a => {
    const titulo = [
      `Audiência de ${TIPO_AUDIENCIA_LABEL[a.tipo].toLowerCase()}`,
      a.processo?.clientes?.nome,
    ].filter(Boolean).join(' — ')

    const descricao = [
      a.processo?.numero_cnj && `Processo: ${a.processo.numero_cnj}`,
      a.link_video && `Vídeo: ${a.link_video}`,
      a.observacoes,
    ].filter(Boolean).join('\n')

    const fim = new Date(new Date(a.data_hora).getTime() + 60 * 60_000) // bloco de 1h

    return [
      'BEGIN:VEVENT',
      `UID:audiencia-${a.id}@bertoldi`,
      `DTSTAMP:${icsData(a.criado_em)}`,
      `DTSTART:${icsData(a.data_hora)}`,
      `DTEND:${icsData(fim.toISOString())}`,
      `SUMMARY:${icsEscape(titulo)}`,
      a.local ? `LOCATION:${icsEscape(a.local)}` : null,
      descricao ? `DESCRIPTION:${icsEscape(descricao)}` : null,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Audiência amanhã',
      'END:VALARM',
      'END:VEVENT',
    ].filter(Boolean).join('\r\n')
  }).join('\r\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bertoldi Advocacia//Agenda de Audiencias//PT-BR',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Audiências — Bertoldi Advocacia',
    eventos,
    'END:VCALENDAR',
  ].join('\r\n')

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="audiencias-bertoldi.ics"',
    },
  })
}
