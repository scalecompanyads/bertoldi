import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CalendarDays, MapPin, Video, Briefcase, CalendarPlus } from 'lucide-react'
import { AudienciaForm } from '@/components/admin/audiencia-form'
import { TIPO_AUDIENCIA_LABEL, type Audiencia } from '@/lib/types'

export const dynamic = 'force-dynamic'

const TZ = 'America/Sao_Paulo'

function fmtDataHora(iso: string) {
  const d = new Date(iso)
  return {
    data: d.toLocaleDateString('pt-BR', { timeZone: TZ, weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
    hora: d.toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }),
  }
}

function CartaoAudiencia({ a, processos, passada }: {
  a: Audiencia
  processos: { id: string; numero_cnj: string | null; tipo_servico: string; clientes?: { nome: string } | null }[]
  passada?: boolean
}) {
  const { data, hora } = fmtDataHora(a.data_hora)
  return (
    <div className={`rounded-lg border p-4 space-y-2 ${passada ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {TIPO_AUDIENCIA_LABEL[a.tipo]}
          </span>
          <span className="text-sm font-medium">{data} às {hora}</span>
        </div>
        <AudienciaForm processos={processos} audiencia={a} />
      </div>

      {a.processo && (
        <Link
          href={`/admin/clientes/${a.processo.cliente_id}/processos/${a.processo.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Briefcase className="h-3 w-3" />
          {a.processo.clientes?.nome ?? a.processo.tipo_servico}
          {a.processo.numero_cnj && <span className="font-mono font-normal text-muted-foreground"> · {a.processo.numero_cnj}</span>}
        </Link>
      )}

      <div className="space-y-1 text-xs text-muted-foreground">
        {a.local && (
          <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" /> {a.local}</p>
        )}
        {a.link_video && (
          <a href={a.link_video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
            <Video className="h-3 w-3 shrink-0" /> Entrar na videoconferência
          </a>
        )}
        {a.observacoes && <p>{a.observacoes}</p>}
      </div>
    </div>
  )
}

export default async function AudienciasPage() {
  const supabase = await createClient()

  const agora = new Date().toISOString()
  const [{ data: futuras }, { data: passadas }, { data: processos }] = await Promise.all([
    supabase
      .from('audiencias')
      .select('*, processo:processo_id(id, cliente_id, numero_cnj, tipo_servico, clientes:cliente_id(id, nome))')
      .gte('data_hora', agora)
      .order('data_hora'),
    supabase
      .from('audiencias')
      .select('*, processo:processo_id(id, cliente_id, numero_cnj, tipo_servico, clientes:cliente_id(id, nome))')
      .lt('data_hora', agora)
      .order('data_hora', { ascending: false })
      .limit(10),
    supabase
      .from('processos')
      .select('id, numero_cnj, tipo_servico, clientes:cliente_id(nome)')
      .neq('status_interno', 'concluido')
      .order('criado_em', { ascending: false }),
  ])

  const proximas = (futuras ?? []) as unknown as Audiencia[]
  const anteriores = (passadas ?? []) as unknown as Audiencia[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opcoesProcesso = (processos ?? []) as any[]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Audiências</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agenda centralizada do escritório — lembrete por e-mail na véspera
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/ics"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Exportar (.ics)
          </a>
          <AudienciaForm processos={opcoesProcesso} />
        </div>
      </div>

      {proximas.length === 0 ? (
        <div className="rounded-lg border py-12 text-center space-y-1">
          <CalendarDays className="h-6 w-6 text-muted-foreground/50 mx-auto" />
          <p className="text-sm text-muted-foreground">Nenhuma audiência agendada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {proximas.map(a => <CartaoAudiencia key={a.id} a={a} processos={opcoesProcesso} />)}
        </div>
      )}

      {anteriores.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Realizadas recentemente</h2>
          {anteriores.map(a => <CartaoAudiencia key={a.id} a={a} processos={opcoesProcesso} passada />)}
        </div>
      )}
    </div>
  )
}
