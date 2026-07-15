import { createClient } from '@/lib/supabase/server'
import { FileText } from 'lucide-react'
import { ProcessoCard } from '@/components/shared/processo-card'
import type { Processo } from '@/lib/types'

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
    .select('*, responsavel:responsavel_id(id, nome)')
    .eq('cliente_id', cliente.id)
    .order('criado_em', { ascending: false })

  const ps = (processos ?? []) as Processo[]

  // Última verificação de cada processo + indicador de movimentação nova
  const comNovidade = new Set<string>()
  const ultimaVerificacao = new Map<string, string>()
  if (ps.length > 0) {
    const { data: verificacoes } = await supabase
      .from('verificacoes_datajud')
      .select('processo_id, houve_movimentacao, verificado_em')
      .in('processo_id', ps.map((p) => p.id))
      .order('verificado_em', { ascending: false })

    for (const v of verificacoes ?? []) {
      if (ultimaVerificacao.has(v.processo_id)) continue
      ultimaVerificacao.set(v.processo_id, v.verificado_em)
      if (v.houve_movimentacao) comNovidade.add(v.processo_id)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Meus processos</h1>

      {ps.length > 0 ? (
        <div className="space-y-3">
          {ps.map((p) => (
            <ProcessoCard
              key={p.id}
              processo={p}
              href={`/cliente/processos/${p.id}`}
              ultimaVerificacao={ultimaVerificacao.get(p.id)}
              novidade={comNovidade.has(p.id)}
            />
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
