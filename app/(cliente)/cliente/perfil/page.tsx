import { createClient } from '@/lib/supabase/server'
import { User, Phone, Mail, CreditCard } from 'lucide-react'
import { STATUS_SERVICO_LABEL } from '@/lib/types'
import type { Cliente, ServicoContratado } from '@/lib/types'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('usuario_id', user!.id)
    .single()

  const { data: servicos } = cliente
    ? await supabase
        .from('servicos_contratados')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('data_contratacao', { ascending: false })
    : { data: [] }

  const c = cliente as Cliente | null
  const ss = (servicos ?? []) as ServicoContratado[]

  const STATUS_DOT: Record<string, string> = {
    ativo: 'bg-green-500',
    concluido: 'bg-slate-400',
    cancelado: 'bg-red-400',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Meu perfil</h1>

      {/* Dados cadastrais */}
      <section className="rounded-xl border bg-card divide-y">
        <div className="flex items-center gap-3 px-4 py-3">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Nome</p>
            <p className="text-sm font-medium">{c?.nome ?? '—'}</p>
          </div>
        </div>
        {c?.cpf_cnpj && (
          <div className="flex items-center gap-3 px-4 py-3">
            <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">CPF / CNPJ</p>
              <p className="text-sm">{c.cpf_cnpj}</p>
            </div>
          </div>
        )}
        {c?.email && (
          <div className="flex items-center gap-3 px-4 py-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm">{c.email}</p>
            </div>
          </div>
        )}
        {c?.telefone && (
          <div className="flex items-center gap-3 px-4 py-3">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="text-sm">{c.telefone}</p>
            </div>
          </div>
        )}
      </section>

      {/* Serviços contratados */}
      {ss.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Serviços contratados</h2>
          <div className="rounded-xl border bg-card divide-y">
            {ss.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{s.tipo_servico}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(s.data_contratacao + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s.status]}`} />
                  <span className="text-xs text-muted-foreground">{STATUS_SERVICO_LABEL[s.status]}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rodapé */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        Para atualizar seus dados, entre em contato com o escritório.
      </p>
    </div>
  )
}
