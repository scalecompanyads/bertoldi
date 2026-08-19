import { createClient } from '@/lib/supabase/server'
import { PeticaoForm } from '@/components/admin/peticao-form'
import { DistribuirPeticaoBtn } from '@/components/admin/distribuir-peticao-btn'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, Scale, FileText, Link } from 'lucide-react'
import NextLink from 'next/link'

interface SearchParams { tab?: string }
interface Props { searchParams: Promise<SearchParams> }

function diasDesde(data: string): number {
  return Math.floor((Date.now() - new Date(data).getTime()) / 86400000)
}

export default async function PeticoesPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const abaAtiva = tab === 'distribuidas' ? 'distribuidas' : 'aguardando'

  const supabase = await createClient()

  const [{ data: peticoes }, { data: clientes }, { data: equipe }] = await Promise.all([
    supabase
      .from('peticoes')
      .select('*, clientes(id, nome), responsavel:usuarios(id, nome), processo:processos(id, numero_cnj)')
      .order('criado_em', { ascending: false }),
    supabase.from('clientes').select('id, nome, cpf_cnpj').eq('arquivado', false).order('nome'),
    supabase.from('usuarios').select('id, nome').in('papel', ['admin', 'advogado', 'secretaria']).order('nome'),
  ])

  const aguardando = (peticoes ?? []).filter(p => p.status === 'aguardando')
  const distribuidas = (peticoes ?? []).filter(p => p.status === 'distribuida')
  const canceladas = (peticoes ?? []).filter(p => p.status === 'cancelada')
  const lista = abaAtiva === 'aguardando' ? [...aguardando, ...canceladas] : distribuidas

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Petições</h1>
        <PeticaoForm
          clientes={(clientes ?? []).map(c => ({ id: c.id, nome: c.nome }))}
          equipe={(equipe ?? []).map(u => ({ id: u.id, nome: u.nome }))}
        />
      </div>

      {/* Abas */}
      <div className="flex items-center gap-2">
        <NextLink
          href="/admin/peticoes"
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            abaAtiva === 'aguardando'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'text-muted-foreground hover:text-foreground hover:border-foreground/40'
          }`}
        >
          Em andamento
          {aguardando.length > 0 && (
            <span className="ml-1.5 bg-white/20 text-current px-1.5 rounded-full text-[10px]">
              {aguardando.length}
            </span>
          )}
        </NextLink>
        <NextLink
          href="/admin/peticoes?tab=distribuidas"
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            abaAtiva === 'distribuidas'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'text-muted-foreground hover:text-foreground hover:border-foreground/40'
          }`}
        >
          Distribuídas
          {distribuidas.length > 0 && (
            <span className="ml-1.5 bg-white/20 text-current px-1.5 rounded-full text-[10px]">
              {distribuidas.length}
            </span>
          )}
        </NextLink>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border bg-card py-16 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {abaAtiva === 'aguardando' ? 'Nenhuma petição em andamento.' : 'Nenhuma petição distribuída.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card divide-y divide-border/60 overflow-hidden shadow-sm">
          {lista.map(p => {
            const dias = diasDesde(p.data_contratacao)
            const cancelada = p.status === 'cancelada'
            return (
              <div key={p.id} className={`flex items-start justify-between px-5 py-4 gap-4 ${cancelada ? 'opacity-50' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{p.clientes?.nome ?? '—'}</p>
                    {p.urgente && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 rounded-full gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Urgente
                      </Badge>
                    )}
                    {p.prescricao && (
                      <Badge className="text-[10px] px-1.5 py-0 rounded-full gap-1 bg-orange-500/15 text-orange-500 border-orange-500/30">
                        <Clock className="h-2.5 w-2.5" />
                        Prescrição
                      </Badge>
                    )}
                    {p.decadencia && (
                      <Badge className="text-[10px] px-1.5 py-0 rounded-full gap-1 bg-yellow-500/15 text-yellow-600 border-yellow-500/30">
                        <Scale className="h-2.5 w-2.5" />
                        Decadência
                      </Badge>
                    )}
                    {cancelada && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-full">
                        Cancelada
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mt-0.5">{p.natureza_acao}</p>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground/70 flex-wrap">
                    {p.parte_adversa && <span>vs. {p.parte_adversa}</span>}
                    {p.responsavel?.nome && <span>Resp.: {p.responsavel.nome}</span>}
                    <span className={dias > 30 ? 'text-amber-500 font-medium' : ''}>
                      {dias === 0 ? 'Contratado hoje' : `${dias} dias desde a contratação`}
                    </span>
                  </div>

                  {abaAtiva === 'distribuidas' && p.processo && (
                    <div className="mt-1.5">
                      <NextLink
                        href={`/admin/processos/${p.processo.id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Link className="h-3 w-3" />
                        {p.processo.numero_cnj ?? 'Ver processo'}
                      </NextLink>
                    </div>
                  )}

                  {p.observacoes && (
                    <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-1 italic">{p.observacoes}</p>
                  )}
                </div>

                {abaAtiva === 'aguardando' && !cancelada && (
                  <DistribuirPeticaoBtn id={p.id} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
