import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldAlert, History } from 'lucide-react'
import { DiffAuditoria } from '@/components/admin/diff-auditoria'

export const dynamic = 'force-dynamic'

const TABELA_LABEL: Record<string, string> = {
  processos: 'Processo',
  documentos: 'Documento',
  linha_do_tempo: 'Linha do tempo',
  clientes: 'Cliente',
}

interface Log {
  id: string
  tabela: string
  registro_id: string
  usuario_id: string | null
  acao: 'update' | 'delete'
  diff: Record<string, { de: unknown; para: unknown }>
  criado_em: string
}

export default async function AuditoriaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  const admin = createAdminClient()
  const { data: logs } = await admin
    .from('logs_auditoria')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(100)

  const lista = (logs ?? []) as Log[]

  // Nome de quem alterou (uma consulta só, mapeada em memória)
  const idsUsuarios = [...new Set(lista.map(l => l.usuario_id).filter(Boolean))] as string[]
  const nomes = new Map<string, string>()
  if (idsUsuarios.length > 0) {
    const { data: usuarios } = await admin
      .from('usuarios')
      .select('id, nome')
      .in('id', idsUsuarios)
    for (const u of usuarios ?? []) nomes.set(u.id, u.nome)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">Auditoria</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Alterações e exclusões em processos, clientes, documentos e linha do tempo — últimas 100
        </p>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-lg border py-12 text-center space-y-1">
          <History className="h-6 w-6 text-muted-foreground/50 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Nenhuma alteração registrada ainda. O registro começa após a migration 0016.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map(log => (
            <DiffAuditoria
              key={log.id}
              tabela={TABELA_LABEL[log.tabela] ?? log.tabela}
              acao={log.acao}
              diff={log.diff}
              usuario={log.usuario_id ? (nomes.get(log.usuario_id) ?? 'Usuário removido') : 'Rotina automática'}
              quando={log.criado_em}
            />
          ))}
        </div>
      )}
    </div>
  )
}
