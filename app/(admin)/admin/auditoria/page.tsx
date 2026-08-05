import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldAlert, History } from 'lucide-react'
import { DiffAuditoria } from '@/components/admin/diff-auditoria'
import { cn } from '@/lib/utils'
import type { PapelUsuario } from '@/lib/types'

export const dynamic = 'force-dynamic'

const TABELA_LABEL: Record<string, string> = {
  processos: 'Processo',
  documentos: 'Documento',
  linha_do_tempo: 'Linha do tempo',
  clientes: 'Cliente',
  audiencias: 'Audiência',
  observacoes: 'Observação',
  calendarios_forenses: 'Calendário forense',
  calendario_forense_versoes: 'Versão de calendário',
  calendario_forense_dias: 'Dia de calendário',
}

const PAPEL_LABEL: Record<PapelUsuario, string> = {
  admin: 'Administrador',
  advogado: 'Advogado(a)',
  secretaria: 'Secretaria',
  cliente: 'Cliente',
}

interface Log {
  id: string
  tabela: string
  registro_id: string
  usuario_id: string | null
  acao: 'insert' | 'update' | 'delete'
  diff: Record<string, { de: unknown; para: unknown }> | Record<string, unknown>
  criado_em: string
}

type FiltroPapel = 'advogados' | 'equipe' | 'todos'

function filtrarPorPapel(
  logs: Log[],
  papeis: Map<string, PapelUsuario>,
  filtro: FiltroPapel
): Log[] {
  if (filtro === 'todos') return logs

  return logs.filter((log) => {
    if (!log.usuario_id) return false
    const papel = papeis.get(log.usuario_id)
    if (!papel || papel === 'cliente') return false
    if (filtro === 'advogados') return papel === 'advogado'
    return true
  })
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ papel?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: eu } = await supabase
    .from('usuarios')
    .select('papel')
    .eq('id', user.id)
    .single()

  if (eu?.papel !== 'admin') {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center max-w-md mx-auto">
        <ShieldAlert className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Acesso restrito</p>
        <p className="text-sm text-muted-foreground">
          Apenas administradores consultam o registro de auditoria.
        </p>
      </div>
    )
  }

  const { papel: filtroParam } = await searchParams
  const filtro: FiltroPapel =
    filtroParam === 'equipe' || filtroParam === 'todos' ? filtroParam : 'advogados'

  const admin = createAdminClient()
  const { data: logs } = await admin
    .from('logs_auditoria')
    .select('*')
    .not('usuario_id', 'is', null)
    .order('criado_em', { ascending: false })
    .limit(300)

  const bruta = (logs ?? []) as Log[]

  const idsUsuarios = [...new Set(bruta.map((l) => l.usuario_id).filter(Boolean))] as string[]
  const nomes = new Map<string, string>()
  const papeis = new Map<string, PapelUsuario>()

  if (idsUsuarios.length > 0) {
    const { data: usuarios } = await admin
      .from('usuarios')
      .select('id, nome, papel')
      .in('id', idsUsuarios)
    for (const u of usuarios ?? []) {
      nomes.set(u.id, u.nome)
      papeis.set(u.id, u.papel as PapelUsuario)
    }
  }

  const lista = filtrarPorPapel(bruta, papeis, filtro)

  const filtros: { id: FiltroPapel; label: string }[] = [
    { id: 'advogados', label: 'Advogados' },
    { id: 'equipe', label: 'Toda equipe' },
    { id: 'todos', label: 'Todos' },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">Auditoria</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro de inclusões, alterações e exclusões manuais — últimas 300 ações com autor identificado
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filtros.map((f) => (
          <Link
            key={f.id}
            href={f.id === 'advogados' ? '/admin/auditoria' : `/admin/auditoria?papel=${f.id}`}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filtro === f.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="rounded-lg border py-12 text-center space-y-1">
          <History className="h-6 w-6 text-muted-foreground/50 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Nenhuma alteração manual registrada
            {filtro === 'advogados' ? ' por advogados' : ''} ainda.
          </p>
          <p className="text-xs text-muted-foreground mt-2 px-6">
            O registro exige a migration 0016 (base) e 0019 (inclusões e identificação do autor).
            Alterações feitas por rotinas automáticas não aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {lista.length} registro{lista.length === 1 ? '' : 's'}
          </p>
          {lista.map((log) => (
            <DiffAuditoria
              key={log.id}
              tabela={TABELA_LABEL[log.tabela] ?? log.tabela}
              acao={log.acao}
              diff={log.diff}
              usuario={
                log.usuario_id
                  ? (nomes.get(log.usuario_id) ?? 'Usuário removido')
                  : 'Autor não identificado'
              }
              papel={
                log.usuario_id && papeis.get(log.usuario_id)
                  ? PAPEL_LABEL[papeis.get(log.usuario_id)!]
                  : null
              }
              quando={log.criado_em}
            />
          ))}
        </div>
      )}
    </div>
  )
}
