import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Inbox } from 'lucide-react'
import { IntimacaoCard } from '@/components/admin/intimacao-card'
import { SincronizarIntimacoesBtn } from '@/components/admin/sincronizar-intimacoes-btn'
import { SincronizarAaspBtn } from '@/components/admin/sincronizar-aasp-btn'
import { STATUS_INTIMACAO_LABEL, type Intimacao, type StatusIntimacao } from '@/lib/types'

interface Props {
  searchParams: Promise<{ status?: string }>
}

const FILTROS: (StatusIntimacao | 'todas')[] = ['nao_lida', 'lida', 'tratada', 'todas']

export default async function IntimacoesPage({ searchParams }: Props) {
  const { status } = await searchParams
  const filtro: StatusIntimacao | 'todas' = FILTROS.includes(status as StatusIntimacao)
    ? (status as StatusIntimacao)
    : status === 'todas' ? 'todas' : 'nao_lida'

  const supabase = await createClient()

  let query = supabase
    .from('intimacoes')
    .select(`
      *,
      advogado:advogado_id(id, nome),
      processo:processo_id(
        id, cliente_id, tipo_servico, calendario_forense_id,
        clientes:cliente_id(id, nome),
        calendario:calendario_forense_id(
          id, nome, versao_ativa_id,
          versao_ativa:calendario_forense_versoes!calendarios_versao_ativa_fk(
            id, versao, fonte_url, fonte_descricao, vigencia_inicio, vigencia_fim,
            dias:calendario_forense_dias(*)
          )
        )
      )
    `)
    .order('data_disponibilizacao', { ascending: false })
    .order('criado_em', { ascending: false })
    .limit(200)

  if (filtro !== 'todas') query = query.eq('status', filtro)

  const [{ data: intimacoes }, { count: naoLidas }] = await Promise.all([
    query,
    supabase.from('intimacoes').select('id', { count: 'exact', head: true }).eq('status', 'nao_lida'),
  ])

  const lista = (intimacoes ?? []) as unknown as Intimacao[]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Intimações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Publicações do DJEN e AASP em nome dos advogados do escritório
            {(naoLidas ?? 0) > 0 && (
              <> — <span className="font-medium text-foreground">{naoLidas} não {naoLidas === 1 ? 'lida' : 'lidas'}</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SincronizarAaspBtn />
          <SincronizarIntimacoesBtn />
        </div>
      </div>

      {/* Filtros por status */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTROS.map(f => (
          <Link
            key={f}
            href={f === 'nao_lida' ? '/admin/intimacoes' : `/admin/intimacoes?status=${f}`}
            aria-current={filtro === f ? 'page' : undefined}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
              filtro === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'todas' ? 'Todas' : STATUS_INTIMACAO_LABEL[f]}
          </Link>
        ))}
      </div>

      {lista.length > 0 ? (
        <div className="space-y-2">
          {lista.map(i => (
            <IntimacaoCard key={i.id} intimacao={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {filtro === 'nao_lida'
              ? 'Nenhuma intimação pendente de leitura.'
              : 'Nenhuma intimação encontrada.'}
          </p>
          <p className="text-xs text-muted-foreground/70 max-w-sm">
            A sincronização roda automaticamente em dias úteis. Cadastre a OAB e a chave AASP dos advogados
            em{' '}
            <Link href="/admin/equipe" className="underline hover:text-foreground">
              Equipe
            </Link>{' '}
            para que as publicações sejam monitoradas.
          </p>
        </div>
      )}
    </div>
  )
}
