// Cliente HTTP para a API de Intimações da AASP
// Docs: https://intimacaoapi.aasp.org.br/docapi/
//
// Dois modos:
//   Associado — chave individual por advogado
//   Empresa   — chave da firma + código AASP do associado

const BASE = 'https://intimacaoapi.aasp.org.br/api'

// ─── Tipos de resposta (validados contra a API real em 2026-08-28) ─────────────
export interface AaspJornal {
  nomeJornal?: string
  dataDisponibilizacao_Publicacao?: string  // ISO — ex: "2025-08-28T00:00:00"
  dataTratamento?: string
  termoReferenciaData?: string
  totalIntimacoes?: number
  intimacoesBaixadas?: number
  intimacoesABaixar?: number
}

export interface AaspPublicacao {
  // IDs
  codigoRelacionamento?: number   // ID único da publicação no sistema AASP
  numeroPublicacao?: number
  numeroArquivo?: number
  // Conteúdo
  textoPublicacao?: string
  titulo?: string
  cabecalho?: string
  rodape?: string | null
  // Processo
  numeroUnicoProcesso?: string    // CNJ com máscara, ex: "1003458-20.2023.8.26.0481"
  // Jornal / tribunal
  jornal?: AaspJornal
}

export interface AaspBuscaResult {
  publicacoes: AaspPublicacao[]
  erro?: string
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v))
  }
  return qs.toString()
}

async function get(path: string, params: Record<string, string | number | boolean | undefined>): Promise<AaspBuscaResult> {
  const url = `${BASE}${path}?${toQueryString(params)}`
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { publicacoes: [], erro: `HTTP ${res.status}${body ? ': ' + body.slice(0, 200) : ''}` }
    }
    const data = await res.json()
    // A API retorna { intimacoes: [...], erro: bool, status: string }
    // Se retornar erro com lista vazia (ex: "Data da publicação vazia"), trata como vazio
    if (data?.erro === true && !Array.isArray(data?.intimacoes)) {
      return { publicacoes: [], erro: data.status ?? 'Resposta de erro da AASP' }
    }
    const lista: AaspPublicacao[] = Array.isArray(data)
      ? data
      : (data.intimacoes ?? data.publicacoes ?? data.items ?? data.data ?? [])
    return { publicacoes: lista }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de rede'
    return { publicacoes: [], erro: msg }
  }
}

// `data` é obrigatório — a API retorna erro "Data da publicação vazia" sem ele.
// Use 'yyyy-MM-dd'. Omita `diferencial` (o cron deduplica pelo aasp_id no banco).
export async function buscarIntimacoesAssociado(params: {
  chave: string
  data: string           // 'yyyy-MM-dd' — obrigatório
}): Promise<AaspBuscaResult> {
  return get('/Associado/intimacao/json', {
    chave: params.chave,
    data: params.data,
  })
}

export async function buscarIntimacoesEmpresa(params: {
  chave: string
  codigoPessoaAssociado: number
  data: string           // 'yyyy-MM-dd' — obrigatório
}): Promise<AaspBuscaResult> {
  return get('/Empresa/intimacao/json', {
    chave: params.chave,
    codigoPessoaAssociado: params.codigoPessoaAssociado,
    data: params.data,
  })
}

// Retorna o ID único da publicação (codigoRelacionamento é o mais estável)
export function resolverIdPublicacao(pub: AaspPublicacao): number | null {
  const raw = pub.codigoRelacionamento ?? pub.numeroPublicacao
  if (raw === undefined || raw === null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

// Retorna a data de disponibilização normalizada para 'yyyy-MM-dd'
export function resolverData(pub: AaspPublicacao): string | null {
  const raw = pub.jornal?.dataDisponibilizacao_Publicacao
  if (!raw) return null
  const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}
