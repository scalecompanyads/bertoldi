import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'
import { STATUS_PROCESSO_LABEL } from '@/lib/types'
import type { Processo } from '@/lib/types'

const STATUS_COR: Record<string, string> = {
  triagem: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  em_analise: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  distribuido: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  em_andamento: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  concluido: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

export default async function ClienteHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('usuario_id', user!.id)
    .single()

  if (!cliente) {
    return (
      <div className="py-16 text-center space-y-2">
        <FileText className="h-10 w-10 mx-auto text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">
          Seu cadastro ainda não foi vinculado a uma conta de acesso.
        </p>
        <p className="text-xs text-muted-foreground/70">Entre em contato com o escritório.</p>
      </div>
    )
  }

  const { data: processos } = await supabase
    .from('processos')
    .select('*')
    .eq('cliente_id', cliente.id)
    .order('criado_em', { ascending: false })

  const ps = (processos ?? []) as Processo[]

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Meus processos</h1>

      {ps.length > 0 ? (
        <div className="space-y-3">
          {ps.map((p) => (
            <Link
              key={p.id}
              href={`/cliente/processos/${p.id}`}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:bg-accent transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.tipo_servico}</p>
                {p.numero_cnj && (
                  <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">{p.numero_cnj}</p>
                )}
                {p.tribunal && (
                  <p className="text-xs text-muted-foreground mt-0.5">{p.tribunal}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COR[p.status_interno]}`}>
                  {STATUS_PROCESSO_LABEL[p.status_interno]}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-2">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum processo cadastrado ainda.</p>
          <p className="text-xs text-muted-foreground/70">
            Aguarde a equipe do escritório registrar seu processo.
          </p>
        </div>
      )}
    </div>
  )
}
