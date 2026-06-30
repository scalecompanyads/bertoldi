import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClienteForm } from '@/components/admin/cliente-form'
import { ServicoForm } from '@/components/admin/servico-form'
import { STATUS_PROCESSO_LABEL, STATUS_SERVICO_LABEL } from '@/lib/types'
import type { Cliente, Processo, ServicoContratado } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClienteDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: cliente }, { data: processos }, { data: servicos }] = await Promise.all([
    supabase.from('clientes').select('*').eq('id', id).single(),
    supabase.from('processos').select('*').eq('cliente_id', id).order('criado_em', { ascending: false }),
    supabase.from('servicos_contratados').select('*').eq('cliente_id', id).order('data_contratacao', { ascending: false }),
  ])

  if (!cliente) notFound()

  const c = cliente as Cliente
  const ps = (processos ?? []) as Processo[]
  const ss = (servicos ?? []) as ServicoContratado[]

  const STATUS_COR: Record<string, string> = {
    triagem: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    em_analise: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    distribuido: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    em_andamento: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    concluido: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/admin/clientes" className="hover:text-foreground">Clientes</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{c.nome}</span>
      </nav>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="processos">Processos ({ps.length})</TabsTrigger>
          <TabsTrigger value="servicos">Serviços ({ss.length})</TabsTrigger>
        </TabsList>

        {/* ABA DADOS */}
        <TabsContent value="dados" className="mt-6 max-w-lg">
          <ClienteForm cliente={c} />
        </TabsContent>

        {/* ABA PROCESSOS */}
        <TabsContent value="processos" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Link href={`/admin/clientes/${id}/processos/novo`} className={buttonVariants({ size: 'sm' })}>
              <Plus className="h-4 w-4 mr-1" />
              Novo processo
            </Link>
          </div>
          {ps.length > 0 ? (
            <div className="rounded-lg border divide-y">
              {ps.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/clientes/${id}/processos/${p.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{p.tipo_servico}</p>
                    {p.numero_cnj && <p className="text-xs text-muted-foreground mt-0.5 font-mono">{p.numero_cnj}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COR[p.status_interno]}`}>
                    {STATUS_PROCESSO_LABEL[p.status_interno]}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum processo cadastrado.</p>
          )}
        </TabsContent>

        {/* ABA SERVIÇOS */}
        <TabsContent value="servicos" className="mt-6 space-y-4">
          <ServicoForm clienteId={id} />
          {ss.length > 0 && (
            <div className="rounded-lg border divide-y mt-4">
              {ss.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{s.tipo_servico}</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.data_contratacao).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{STATUS_SERVICO_LABEL[s.status]}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
