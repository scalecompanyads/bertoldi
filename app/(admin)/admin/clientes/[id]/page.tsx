import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClienteForm } from '@/components/admin/cliente-form'
import { ClienteAcessoPanel } from '@/components/admin/cliente-acesso-panel'
import { ClienteArquivarBtn } from '@/components/admin/cliente-arquivar-btn'
import { ServicoForm } from '@/components/admin/servico-form'
import { Badge } from '@/components/ui/badge'
import { ProcessoCard } from '@/components/shared/processo-card'
import { STATUS_SERVICO_LABEL } from '@/lib/types'
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href={c.arquivado ? '/admin/clientes?ver=arquivados' : '/admin/clientes'} className="hover:text-foreground">
          Clientes
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{c.nome}</span>
        {c.arquivado && (
          <Badge variant="secondary" className="ml-1 text-[10px]">Arquivado</Badge>
        )}
      </nav>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="processos">Processos ({ps.length})</TabsTrigger>
          <TabsTrigger value="servicos">Serviços ({ss.length})</TabsTrigger>
        </TabsList>

        {/* ABA DADOS */}
        <TabsContent value="dados" className="mt-6 max-w-2xl space-y-6">
          {c.arquivado && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              Este cliente está arquivado e não aparece na listagem principal.
            </div>
          )}
          <ClienteForm cliente={c} />
          {!c.arquivado && <ClienteAcessoPanel cliente={c} />}
          <ClienteArquivarBtn cliente={c} />
        </TabsContent>

        {/* ABA PROCESSOS */}
        <TabsContent value="processos" className="mt-6 space-y-4">
          {!c.arquivado && (
          <div className="flex justify-end">
            <Link href={`/admin/clientes/${id}/processos/novo`} className={buttonVariants({ size: 'sm' })}>
              <Plus className="h-4 w-4 mr-1" />
              Novo processo
            </Link>
          </div>
          )}
          {ps.length > 0 ? (
            <div className="space-y-3">
              {ps.map((p) => (
                <ProcessoCard
                  key={p.id}
                  processo={p}
                  href={`/admin/clientes/${id}/processos/${p.id}`}
                />
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
