// Cliente HTTP para a API de Intimações da AASP
// Docs: https://intimacaoapi.aasp.org.br/docapi/
//
// Dois modos:
//   Associado — chave individual por advogado
//   Empresa   — chave da firma + código AASP do associado

const BASE = 'https://intimacaoapi.aasp.org.br/api'

// ─── Tipos de resposta ────────────────────────────────────────────────────────
// Esses campos são inferidos com base na convenção da API AASP.
// Valide com um request real via Swagger e ajuste conforme necessário.
export interface AaspPublicacao {
  id?: number | string
  codigoPublicacao?: number
  dataDisponibilizacao?: string   // 'yyyy-MM-dd' ou ISO
  dataPublicacao?: string
  numeroProcesso?: string         // CNJ com máscara
  jornal?: string                 // Tribunal / caderno (ex: "TJSP")
  secao?: string
  caderno?: string
  pagina?: number
  texto?: string
  nomeAdvogado?: string
  oab?: string
  ufOab?: string
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
    // A API pode retornar array direto ou objeto com publicacoes/items/data
    const lista: AaspPublicacao[] = Array.isArray(data)
      ? data
      : (data.publicacoes ?? data.items ?? data.data ?? [])
    return { publicacoes: lista }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de rede'
    return { publicacoes: [], erro: msg }
  }
}

export async function buscarIntimacoesAssociado(params: {
  chave: string
  data?: string         // 'yyyy-MM-dd' — omitir = hoje
  diferencial?: boolean // true = só não consultadas
}): Promise<AaspBuscaResult> {
  return get('/Associado/intimacao/json', {
    chave: params.chave,
    data: params.data,
    diferencial: params.diferencial,
  })
}

export async function buscarIntimacoesEmpresa(params: {
  chave: string
  codigoPessoaAssociado: number
  data?: string
  diferencial?: boolean
}): Promise<AaspBuscaResult> {
  return get('/Empresa/intimacao/json', {
    chave: params.chave,
    codigoPessoaAssociado: params.codigoPessoaAssociado,
    data: params.data,
    diferencial: params.diferencial,
  })
}

// Retorna o ID único da publicação — tenta campos conhecidos em ordem de preferência
export function resolverIdPublicacao(pub: AaspPublicacao): number | null {
  const raw = pub.codigoPublicacao ?? pub.id
  if (raw === undefined || raw === null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

// Retorna a data de disponibilização normalizada para 'yyyy-MM-dd'
export function resolverData(pub: AaspPublicacao): string | null {
  const raw = pub.dataDisponibilizacao ?? pub.dataPublicacao
  if (!raw) return null
  // Aceita ISO ou 'yyyy-MM-dd'
  const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}
