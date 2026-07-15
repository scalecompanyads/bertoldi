import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { identificarTribunal } from '@/lib/cnj-parser'
import { STATUS_PROCESSO_LABEL } from '@/lib/types'
import type { Processo } from '@/lib/types'

const STATUS_COR: Record<string, string> = {
  triagem: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  em_analise: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  distribuido: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  em_andamento: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  concluido: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

function formatarValorCausa(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function tempoRelativo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const dias = Math.floor(diffMs / 86_400_000)
  if (dias <= 0) {
    const horas = Math.floor(diffMs / 3_600_000)
    if (horas <= 0) return 'Há menos de 1 hora'
    return horas === 1 ? 'Há 1 hora' : `Há ${horas} horas`
  }
  if (dias === 1) return 'Há 1 dia'
  if (dias < 30) return `Há ${dias} dias`
  const meses = Math.floor(dias / 30)
  return meses === 1 ? 'Há 1 mês' : `Há ${meses} meses`
}

function dataPorExtenso(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// Nome completo do tribunal a partir do número CNJ, ex:
// "Tribunal de Justiça de São Paulo (TJSP)". Cai para a sigla salva.
function nomeTribunal(p: Processo): string | null {
  if (p.numero_cnj) {
    const t = identificarTribunal(p.numero_cnj)?.tribunal
    if (t) return `${t.nome} (${t.sigla})`
  }
  return p.tribunal
}

// "O processo teve origem em X, na cidade de Y, no Z, em D. Tem como
// partes envolvidas A, B e C" — só com os dados disponíveis.
function resumoOrigem(p: Processo, tribunal: string | null): string | null {
  const trechos: string[] = []
  if (p.vara_orgao) trechos.push(`em ${p.vara_orgao}`)
  if (p.cidade_origem) trechos.push(`na cidade de ${p.cidade_origem}`)
  if (tribunal) trechos.push(`no ${tribunal}`)
  if (p.data_ajuizamento) trechos.push(`em ${dataPorExtenso(p.data_ajuizamento)}`)

  const partes = [p.parte_autora, p.parte_re, p.outras_partes].filter(Boolean) as string[]
  const frases: string[] = []
  if (trechos.length > 0) frases.push(`O processo teve origem ${trechos.join(', ')}.`)
  if (partes.length > 0) {
    const lista = partes.length > 1
      ? `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`
      : partes[0]
    frases.push(`Tem como partes envolvidas ${lista}.`)
  }
  return frases.length > 0 ? frases.join(' ') : null
}

interface Props {
  processo: Processo
  href: string
  ultimaVerificacao?: string | null
  novidade?: boolean
  // Exibido junto ao título — usado no painel interno para mostrar o cliente
  clienteNome?: string | null
}

export function ProcessoCard({ processo: p, href, ultimaVerificacao, novidade, clienteNome }: Props) {
  const tribunal = nomeTribunal(p)
  const titulo = p.parte_autora && p.parte_re
    ? `${p.parte_autora} x ${p.parte_re}`
    : p.tipo_servico
  const resumo = resumoOrigem(p, tribunal)

  const detalhes: { label: string; valor: string }[] = []
  if (tribunal) detalhes.push({ label: 'Origem', valor: tribunal })
  if (p.assunto) detalhes.push({ label: 'Assunto', valor: p.assunto })
  if (p.valor_causa != null) detalhes.push({ label: 'Valor da causa', valor: formatarValorCausa(p.valor_causa) })
  if (p.responsavel?.nome) {
    detalhes.push({ label: 'Advogado(a) responsável', valor: p.responsavel.nome })
  }
  if (ultimaVerificacao) detalhes.push({ label: 'Última verificação', valor: tempoRelativo(ultimaVerificacao) })

  return (
    <Link
      href={href}
      className="block rounded-xl border bg-card p-5 sm:p-6 hover:bg-accent transition-colors space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm px-2.5 py-0.5 rounded-full font-medium ${STATUS_COR[p.status_interno]}`}>
              {STATUS_PROCESSO_LABEL[p.status_interno]}
            </span>
            {novidade && (
              <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400">
                Novidade
              </span>
            )}
          </div>
          <p className="font-semibold text-lg leading-snug">
            {titulo}
            {clienteNome && <span className="text-muted-foreground font-normal"> · {clienteNome}</span>}
          </p>
          <p className="text-sm text-muted-foreground">
            {p.numero_cnj
              ? <>Processo <span className="font-mono">{p.numero_cnj}</span></>
              : p.tipo_servico}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
      </div>

      {detalhes.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {detalhes.map((d) => (
            <div key={d.label} className="min-w-0">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{d.label}</dt>
              <dd className="text-sm font-medium mt-0.5">{d.valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {resumo && (
        <p className="text-sm text-muted-foreground leading-relaxed border-t pt-4">{resumo}</p>
      )}
    </Link>
  )
}
