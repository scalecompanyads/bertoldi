import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Briefcase, CheckCircle2, Bell, ArrowRight, Activity, Clock, Inbox, AlarmClock } from 'lucide-react'
import { STATUS_PROCESSO_LABEL } from '@/lib/types'
import { diasUteisRestantes } from '@/lib/prazos'
import type { Cliente, Processo } from '@/lib/types'

const STATUS_COR: Record<string, string> = {
  triagem:      'bg-slate-400/10 text-slate-500 dark:bg-slate-300/10 dark:text-slate-300',
  em_analise:   'bg-amber-400/10 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300',
  distribuido:  'bg-violet-400/10 text-violet-700 dark:bg-violet-300/10 dark:text-violet-300',
  em_andamento: 'bg-sky-400/10 text-sky-700 dark:bg-sky-300/10 dark:text-sky-300',
  concluido:    'bg-emerald-400/10 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300',
}

type ProcessoRef = Pick<Processo, 'id' | 'tipo_servico' | 'cliente_id' | 'status_interno'> & {
  clientes: Pick<Cliente, 'id' | 'nome'> | null
}

type Movimentacao = {
  id: string
  processo_id: string
  verificado_em: string
  ultimo_andamento: string | null
  processos: ProcessoRef | null
}

type ProcessoParado = Pick<Processo, 'id' | 'tipo_servico' | 'cliente_id' | 'status_interno' | 'criado_em'> & {
  atualizado_em: string | null
  clientes: Pick<Cliente, 'id' | 'nome'> | null
}

function diasAtras(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'há 1 dia'
  return `há ${dias} dias`
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const ontem = new Date(Date.now() - 24 * 3_600_000).toISOString()
  const em7dias = new Date(Date.now() + 7 * 86_400_000).toISOString()

  const [
    { count: totalClientes },
    { count: totalAtivos },
    { count: totalConcluidos },
    { count: comunicadosNaoLidos },
    { data: movimentacoes },
    { data: parados },
    { data: intimacoesNaoLidas, count: totalIntimacoesNaoLidas },
    { data: prazosSemana },
    { data: movimentadasOntem },
  ] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('arquivado', false),
    supabase.from('processos').select('*', { count: 'exact', head: true }).in('status_interno', ['em_analise', 'distribuido', 'em_andamento']),
    supabase.from('processos').select('*', { count: 'exact', head: true }).eq('status_interno', 'concluido'),
    supabase.from('comunicado_destinatarios').select('*', { count: 'exact', head: true }).is('lido_em', null),
    supabase
      .from('verificacoes_datajud')
      .select('id, processo_id, verificado_em, ultimo_andamento, processos(id, tipo_servico, cliente_id, status_interno, clientes(id, nome))')
      .eq('houve_movimentacao', true)
      .order('verificado_em', { ascending: false })
      .limit(40),
    supabase
      .from('processos')
      .select('id, tipo_servico, cliente_id, status_interno, criado_em, atualizado_em, clientes(id, nome)')
      .in('status_interno', ['distribuido', 'em_andamento'])
      .order('atualizado_em', { ascending: true, nullsFirst: true })
      .limit(5),
    // Visão do dia: intimações não lidas
    supabase
      .from('intimacoes')
      .select('id, sigla_tribunal, nome_classe, numero_cnj, data_disponibilizacao', { count: 'exact' })
      .eq('status', 'nao_lida')
      .order('data_disponibilizacao', { ascending: false })
      .limit(5),
    // Visão do dia: minhas tarefas com prazo em até 7 dias (ou vencido)
    supabase
      .from('tarefas')
      .select('id, titulo, prazo')
      .eq('usuario_id', user?.id ?? '')
      .neq('status', 'concluido')
      .not('prazo', 'is', null)
      .lte('prazo', em7dias)
      .order('prazo')
      .limit(5),
    // Visão do dia: movimentação nova nas últimas 24h
    supabase
      .from('verificacoes_datajud')
      .select('id, processo_id, verificado_em, ultimo_andamento, processos(id, tipo_servico, cliente_id, clientes(id, nome))')
      .eq('houve_movimentacao', true)
      .gte('verificado_em', ontem)
      .order('verificado_em', { ascending: false })
      .limit(5),
  ])

  // Uma verificação nova é gravada a cada consulta ao tribunal, então o mesmo
  // processo pode ter várias linhas — mostramos só a mais recente de cada um.
  const vistos = new Set<string>()
  const movs = ((movimentacoes ?? []) as unknown as Movimentacao[])
    .filter((m) => {
      if (vistos.has(m.processo_id)) return false
      vistos.add(m.processo_id)
      return true
    })
    .slice(0, 8)
  const paradosList = (parados ?? []) as unknown as ProcessoParado[]

  const intimacoes = (intimacoesNaoLidas ?? []) as { id: string; sigla_tribunal: string | null; nome_classe: string | null; numero_cnj: string | null; data_disponibilizacao: string }[]
  const prazos = (prazosSemana ?? []) as { id: string; titulo: string; prazo: string }[]
  const deOntem = ((movimentadasOntem ?? []) as unknown as Movimentacao[])

  const corPrazo = (prazoISO: string) => {
    const d = new Date(prazoISO)
    if (d.getTime() < Date.now()) return 'text-red-600 dark:text-red-400 font-semibold'
    const r = diasUteisRestantes(d)
    if (r < 2) return 'text-red-600 dark:text-red-400 font-semibold'
    if (r <= 5) return 'text-amber-600 dark:text-amber-400 font-medium'
    return 'text-emerald-600 dark:text-emerald-400'
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Visão do dia</h1>

      {/* O que exige atenção hoje, em ordem de urgência */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Intimações não lidas */}
        <Link href="/admin/intimacoes" className="rounded-2xl border bg-card p-4 hover:bg-accent shadow-sm hover:shadow-md transition-all duration-150 space-y-3 block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className={`h-4 w-4 ${(totalIntimacoesNaoLidas ?? 0) > 0 ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'}`} />
              <h2 className="text-sm font-semibold">Intimações não lidas</h2>
            </div>
            <span className={`text-2xl font-semibold tabular-nums ${(totalIntimacoesNaoLidas ?? 0) > 0 ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'}`}>
              {totalIntimacoesNaoLidas ?? 0}
            </span>
          </div>
          {intimacoes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma pendente — tudo tratado.</p>
          ) : (
            <ul className="space-y-1">
              {intimacoes.map(i => (
                <li key={i.id} className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground truncate">
                  <span className="font-medium text-foreground">{i.sigla_tribunal}</span>
                  {' '}· {i.nome_classe ?? 'Comunicação'}
                  {i.numero_cnj && <span className="font-mono"> · {i.numero_cnj}</span>}
                </li>
              ))}
            </ul>
          )}
        </Link>

        {/* Prazos da semana (do usuário logado) */}
        <Link href="/admin/tarefas" className="rounded-2xl border bg-card p-4 hover:bg-accent shadow-sm hover:shadow-md transition-all duration-150 space-y-3 block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlarmClock className={`h-4 w-4 ${prazos.length > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground'}`} />
              <h2 className="text-sm font-semibold">Meus prazos da semana</h2>
            </div>
            <span className={`text-2xl font-semibold tabular-nums ${prazos.length > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground'}`}>
              {prazos.length}
            </span>
          </div>
          {prazos.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum prazo nos próximos 7 dias.</p>
          ) : (
            <ul className="space-y-1">
              {prazos.map(t => (
                <li key={t.id} className="rounded-lg bg-secondary/60 px-3 py-2 text-xs flex items-center gap-2 truncate">
                  <span className={`shrink-0 font-semibold tabular-nums ${corPrazo(t.prazo)}`}>
                    {new Date(t.prazo).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <span className="text-muted-foreground truncate">{t.titulo}</span>
                </li>
              ))}
            </ul>
          )}
        </Link>

        {/* Movimentações desde ontem */}
        <Link href="/admin/processos" className="rounded-2xl border bg-card p-4 hover:bg-accent shadow-sm hover:shadow-md transition-all duration-150 space-y-3 block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className={`h-4 w-4 ${deOntem.length > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-muted-foreground'}`} />
              <h2 className="text-sm font-semibold">Movimentações (24h)</h2>
            </div>
            <span className={`text-2xl font-semibold tabular-nums ${deOntem.length > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-muted-foreground'}`}>
              {deOntem.length}
            </span>
          </div>
          {deOntem.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nada novo nos tribunais desde ontem.</p>
          ) : (
            <ul className="space-y-1">
              {deOntem.map(m => (
                <li key={m.id} className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground truncate">
                  <span className="font-medium text-foreground">{m.processos?.clientes?.nome ?? 'Processo'}</span>
                  {m.ultimo_andamento && <> · {m.ultimo_andamento}</>}
                </li>
              ))}
            </ul>
          )}
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/admin/clientes" className="rounded-2xl border bg-card p-5 hover:bg-accent shadow-sm hover:shadow-md transition-all duration-150 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Users className="h-4 w-4 text-muted-foreground" />
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">{totalClientes ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Clientes</p>
          </div>
        </Link>

        <Link href="/admin/processos" className="rounded-2xl border bg-card p-5 hover:bg-accent shadow-sm hover:shadow-md transition-all duration-150 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-tight tabular-nums text-primary">{totalAtivos ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Processos ativos</p>
          </div>
        </Link>

        <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          <div>
            <p className="text-3xl font-semibold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">{totalConcluidos ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Concluídos</p>
          </div>
        </div>

        <Link href="/admin/comunicados" className="rounded-2xl border bg-card p-5 hover:bg-accent shadow-sm hover:shadow-md transition-all duration-150 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Bell className={`h-4 w-4 ${(comunicadosNaoLidos ?? 0) > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground'}`} />
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
          <div>
            <p className={`text-3xl font-semibold tracking-tight tabular-nums ${(comunicadosNaoLidos ?? 0) > 0 ? 'text-amber-500 dark:text-amber-400' : ''}`}>
              {comunicadosNaoLidos ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Avisos não lidos</p>
          </div>
        </Link>
      </div>

      {/* Novas movimentações — o que exige atenção hoje */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Novas movimentações</h2>
        </div>
        <div className="rounded-2xl border bg-card divide-y divide-border/60 overflow-hidden">
          {movs.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">Nenhuma movimentação nova nos tribunais.</p>
          ) : (
            movs.map((m) => (
              <Link
                key={m.id}
                href={m.processos ? `/admin/clientes/${m.processos.cliente_id}/processos/${m.processo_id}` : '#'}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-accent transition-colors"
              >
                <div className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {m.processos?.tipo_servico ?? 'Processo'}
                    <span className="text-muted-foreground font-normal"> · {m.processos?.clientes?.nome}</span>
                  </p>
                  {m.ultimo_andamento && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{m.ultimo_andamento}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground/70 shrink-0 mt-0.5 tabular-nums">{diasAtras(m.verificado_em)}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Processos parados há mais tempo */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Sem atualização há mais tempo</h2>
        </div>
        <div className="rounded-2xl border bg-card divide-y divide-border/60 overflow-hidden">
          {paradosList.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">Nenhum processo em andamento.</p>
          ) : (
            paradosList.map((p) => (
              <Link
                key={p.id}
                href={`/admin/clientes/${p.cliente_id}/processos/${p.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.tipo_servico}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{p.clientes?.nome}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COR[p.status_interno] ?? ''}`}>
                    {STATUS_PROCESSO_LABEL[p.status_interno as keyof typeof STATUS_PROCESSO_LABEL]}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70">
                    {diasAtras(p.atualizado_em ?? p.criado_em)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
