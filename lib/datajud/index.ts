// Datajud — API pública do CNJ (Elasticsearch)
// Docs: https://datajud-wiki.cnj.jus.br/api-publica/

const BASE_URL = 'https://api-publica.datajud.cnj.jus.br'
const API_KEY = process.env.DATAJUD_API_KEY ?? 'cDZHYzlZa0JadVREZDJCendFbzVlQTU2S3A1djVuT3A='

// Tribunais com cobertura confirmada no Datajud (enviam dados via PJe ou integração direta)
// TJs que usam eSAJ (TJSP, TJSC, TJBA, TJCE, TJAM, TJMS, TJAL, TJRN, TJAC) NÃO estão cobertos
// TJRJ e TJRS usam sistemas próprios — também sem cobertura
const COBERTOS = new Set([
  // Superiores
  'stf', 'stj', 'tst', 'tse', 'stm',
  // TRFs (todos cobertos)
  'trf1', 'trf2', 'trf3', 'trf4', 'trf5', 'trf6',
  // JFs (apontam para o TRF pai)
  'jfac', 'jfam', 'jfap', 'jfba', 'jfdf', 'jfgo', 'jfma', 'jfmg', 'jfmt', 'jfpa',
  'jfpi', 'jfro', 'jfrr', 'jfto', 'jfrj', 'jfes', 'jfsp', 'jfms',
  'jfrs', 'jfsc', 'jfpr', 'jfpe', 'jfal', 'jfse', 'jfce', 'jfrn', 'jfpb', 'jfmg2',
  // TRTs (todos cobertos)
  'trt1', 'trt2', 'trt3', 'trt4', 'trt5', 'trt6', 'trt7', 'trt8', 'trt9', 'trt10',
  'trt11', 'trt12', 'trt13', 'trt14', 'trt15', 'trt16', 'trt17', 'trt18', 'trt19',
  'trt20', 'trt21', 'trt22', 'trt23', 'trt24',
  // TJs que usam PJe (cobertura confirmada)
  'tjal', 'tjam', 'tjap', 'tjdft', 'tjgo', 'tjma', 'tjmg', 'tjmt', 'tjpa',
  'tjpb', 'tjpe', 'tjpi', 'tjpr', 'tjrn', 'tjro', 'tjrr', 'tjse', 'tjto', 'tjes',
  // Variantes 2g e eproc apontam para o mesmo índice
  'tjmgeproc', 'tjmg2g',
])

// TJs fora do Datajud (eSAJ ou sistema próprio)
// Nota: tjspeproc (seq >= 4M) usa eProc e SIM envia dados ao Datajud — não está aqui
const NAO_COBERTOS: Record<string, string> = {
  tjsp: 'eSAJ (esaj.tjsp.jus.br)',
  tjsc: 'eSAJ (esaj.tjsc.jus.br)',
  tjba: 'eSAJ (esaj.tjba.jus.br)',
  tjce: 'eSAJ (esaj.tjce.jus.br)',
  tjrj: 'Sistema próprio (tjrj.jus.br)',
  tjrs: 'Sistema próprio (tjrs.jus.br)',
  tjms: 'eSAJ (esaj.tjms.jus.br)',
  tjal: 'eSAJ (tjal.jus.br)',
  tjrn: 'eSAJ (tjrn.jus.br)',
  tjac: 'eSAJ (tjac.jus.br)',
}

export function tribunalCobertoPorDatajud(tribunalId: string): boolean {
  const base = tribunalId.replace(/2g$/, '').replace(/eproc$/, '').replace(/-e$/, '')
  return COBERTOS.has(base) && !NAO_COBERTOS[base]
}

export function motivoNaoCobertoDatajud(tribunalId: string): string | null {
  const base = tribunalId.replace(/2g$/, '').replace(/eproc$/, '').replace(/-e$/, '')
  if (NAO_COBERTOS[base]) return NAO_COBERTOS[base]
  return null
}

// Mapeamento de JF para o índice do TRF pai
const JF_PARA_TRF: Record<string, string> = {
  jfac: 'trf1', jfam: 'trf1', jfap: 'trf1', jfba: 'trf1', jfdf: 'trf1',
  jfgo: 'trf1', jfma: 'trf1', jfmg: 'trf1', jfmt: 'trf1', jfpa: 'trf1',
  jfpi: 'trf1', jfro: 'trf1', jfrr: 'trf1', jfto: 'trf1',
  jfrj: 'trf2', jfes: 'trf2',
  jfsp: 'trf3', jfms: 'trf3',
  jfrs: 'trf4', jfsc: 'trf4', jfpr: 'trf4',
  jfpe: 'trf5', jfal: 'trf5', jfse: 'trf5', jfce: 'trf5', jfrn: 'trf5', jfpb: 'trf5',
  jfmg2: 'trf6',
}

export function getDatajudIndex(tribunalId: string): string {
  // Normaliza variantes (tjsp2g → tjsp, tjmgeproc → tjmg, tjsp-e → tjsp)
  const base = tribunalId.replace(/2g$/, '').replace(/eproc$/, '').replace(/-e$/, '')
  const id = JF_PARA_TRF[base] ?? base
  return `api_${id}_index`
}

export interface DatajudMovimento {
  codigo: number
  nome: string
  dataHora: string
  complementosTabelados?: { codigo: number; nome: string; valor: string }[]
}

export interface DatajudProcesso {
  id: string
  numeroProcesso: string
  classe?: { codigo: number; nome: string }
  sistema?: { codigo: number; nome: string }
  tribunal?: string
  dataHoraUltimaAtualizacao?: string
  movimentos?: DatajudMovimento[]
  orgaoJulgador?: { codigo: number; nome: string; codigoMunicipioIBGE?: number }
}

export interface DatajudResult {
  encontrado: boolean
  processo?: DatajudProcesso
  ultimoAndamento?: string
  movimentos?: { data: string; descricao: string }[]
  dataUltimaAtualizacao?: string
  rawResponse?: unknown
  erro?: string
}

export async function consultarDatajud(
  numeroCNJ: string,
  tribunalId: string
): Promise<DatajudResult> {
  const index = getDatajudIndex(tribunalId)
  const url = `${BASE_URL}/${index}/_search`

  // Query simplificada — sem sort para evitar rejeição de campos não mapeados
  const body = {
    query: {
      match: { numeroProcesso: numeroCNJ },
    },
    size: 1,
  }

  let rawResponse: unknown
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `APIKey ${API_KEY}`,
      },
      body: JSON.stringify(body),
      // Sem cache — sempre buscar dado fresco
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })

    rawResponse = await res.json()

    if (!res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (rawResponse as any)?.error?.reason ?? (rawResponse as any)?.error?.type ?? ''
      const erro = res.status === 401
        ? 'Chave de API inválida (401). Verifique DATAJUD_API_KEY no .env.local.'
        : res.status === 403
          ? `Acesso negado ao índice ${index} (403)${detail ? `: ${detail}` : ''}. O tribunal pode não ter cobertura no Datajud ou o índice não existe.`
          : res.status === 404
            ? `Índice não encontrado: ${index}. Tribunal pode não estar disponível no Datajud.`
            : `API retornou ${res.status}${detail ? `: ${detail}` : ''}`
      return { encontrado: false, erro, rawResponse }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = rawResponse as any
    const hits: DatajudProcesso[] = data?.hits?.hits?.map((h: any) => h._source) ?? []

    if (hits.length === 0) {
      return { encontrado: false, rawResponse }
    }

    const processo = hits[0]
    const movimentosRaw: DatajudMovimento[] = processo.movimentos ?? []

    const movimentos = movimentosRaw.slice(0, 15).map(m => {
      const data = m.dataHora
        ? new Date(m.dataHora).toLocaleDateString('pt-BR')
        : ''
      const complemento = m.complementosTabelados?.length
        ? ` — ${m.complementosTabelados.map(c => c.valor).join(', ')}`
        : ''
      return { data, descricao: m.nome + complemento }
    })

    const ultimoAndamento = movimentos[0]
      ? `${movimentos[0].data} — ${movimentos[0].descricao}`
      : undefined

    return {
      encontrado: true,
      processo,
      ultimoAndamento,
      movimentos,
      dataUltimaAtualizacao: processo.dataHoraUltimaAtualizacao,
      rawResponse,
    }
  } catch (err) {
    return {
      encontrado: false,
      erro: err instanceof Error ? err.message : 'Erro desconhecido',
      rawResponse,
    }
  }
}
