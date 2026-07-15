// Datajud — API pública do CNJ (Elasticsearch)
// Docs: https://datajud-wiki.cnj.jus.br/api-publica/

const BASE_URL = 'https://api-publica.datajud.cnj.jus.br'
// Chave pública documentada na wiki (pode ser rotacionada pelo CNJ — prefira a env var)
const API_KEY = process.env.DATAJUD_API_KEY ?? 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='

// Tribunais com cobertura confirmada no Datajud (enviam dados via PJe, eProc ou integração direta)
// TJSC, TJRS e TJRJ migraram para o eProc e enviam dados ao Datajud
// (verificado em 15/07/2026: api_publica_tjsc com atualização de 13/07/2026)
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
  // TJs que usam eProc (cobertura confirmada)
  'tjsc', 'tjrs', 'tjrj',
  // Variantes 2g e eproc apontam para o mesmo índice
  'tjmgeproc', 'tjmg2g',
])

// TJs fora do Datajud (eSAJ ou sistema próprio)
// Nota: tjspeproc (seq >= 4M) usa eProc e SIM envia dados ao Datajud — não está aqui
// Nota: tjsc, tjrs e tjrj migraram para o eProc e passaram a ter cobertura — removidos daqui
const NAO_COBERTOS: Record<string, string> = {
  tjsp: 'eSAJ (esaj.tjsp.jus.br)',
  tjba: 'eSAJ (esaj.tjba.jus.br)',
  tjce: 'eSAJ (esaj.tjce.jus.br)',
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
  // Alias oficial da API pública: https://datajud-wiki.cnj.jus.br/api-publica/endpoints
  return `api_publica_${id}`
}

export interface DatajudMovimento {
  codigo: number
  nome: string
  dataHora: string
  // `nome` é o valor legível (ex: "para julgamento"); `valor` é o código numérico
  complementosTabelados?: { codigo: number; nome?: string; valor?: number | string; descricao?: string }[]
  orgaoJulgador?: { codigo: number | string; nome: string }
}

export interface DatajudProcesso {
  id: string
  numeroProcesso: string
  classe?: { codigo: number; nome: string }
  assuntos?: { codigo: number; nome: string }[]
  sistema?: { codigo: number; nome: string }
  formato?: { codigo: number; nome: string }
  tribunal?: string
  grau?: string
  dataAjuizamento?: string
  nivelSigilo?: number
  dataHoraUltimaAtualizacao?: string
  movimentos?: DatajudMovimento[]
  orgaoJulgador?: { codigo: number; nome: string; codigoMunicipioIBGE?: number }
}

// Movimento formatado para exibição. `data` fica sem hora de propósito:
// mesmoAndamento() ignora datas dd/mm/aaaa mas não horários, então a hora
// entra em campo separado para não gerar falso houve_movimentacao.
export interface Movimento {
  data: string
  hora?: string
  descricao: string
  orgao?: string
}

// Dados de capa do processo conforme registrados no tribunal
export interface DatajudCapa {
  numeroProcesso?: string
  classe?: string
  assuntos?: string[]
  orgaoJulgador?: string
  tribunal?: string
  grau?: string
  sistema?: string
  formato?: string
  dataAjuizamento?: string
  nivelSigilo?: number
  ultimaAtualizacao?: string
}

export interface DatajudResult {
  encontrado: boolean
  processo?: DatajudProcesso
  capa?: DatajudCapa
  ultimoAndamento?: string
  movimentos?: Movimento[]
  dataUltimaAtualizacao?: string
  rawResponse?: unknown
  erro?: string
}

const GRAU_LEGIVEL: Record<string, string> = {
  G1: '1º Grau',
  G2: '2º Grau',
  GS: 'Instância Superior',
  JE: 'Juizado Especial',
  TR: 'Turma Recursal',
  TRU: 'Turma Regional de Uniformização',
  TNU: 'Turma Nacional de Uniformização',
  SUP: 'Instância Superior',
}

// Datajud registra dataAjuizamento como "aaaammddhhmmss"
function formatarDataAjuizamento(raw?: string): string | undefined {
  const m = raw?.match(/^(\d{4})(\d{2})(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : undefined
}

export async function consultarDatajud(
  numeroCNJ: string,
  tribunalId: string
): Promise<DatajudResult> {
  const index = getDatajudIndex(tribunalId)
  const url = `${BASE_URL}/${index}/_search`

  // O Datajud armazena numeroProcesso apenas com dígitos (sem pontuação CNJ)
  const numeroLimpo = numeroCNJ.replace(/\D/g, '')

  // Query simplificada — sem sort para evitar rejeição de campos não mapeados
  const body = {
    query: {
      match: { numeroProcesso: numeroLimpo },
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
      // A API pública é lenta em índices grandes (30s+ observados) — timeout generoso
      signal: AbortSignal.timeout(60_000),
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

    const data = rawResponse as { hits?: { hits?: { _source: DatajudProcesso }[] } }
    const hits: DatajudProcesso[] = data?.hits?.hits?.map(h => h._source) ?? []

    if (hits.length === 0) {
      return { encontrado: false, rawResponse }
    }

    const processo = hits[0]
    // A ordem dos movimentos no índice não é garantida — ordena do mais recente ao mais antigo
    const movimentosRaw: DatajudMovimento[] = [...(processo.movimentos ?? [])].sort(
      (a, b) => new Date(b.dataHora ?? 0).getTime() - new Date(a.dataHora ?? 0).getTime()
    )

    // Horário oficial do processo é o de Brasília — o servidor pode rodar em UTC
    const TZ = 'America/Sao_Paulo'
    const movimentos: Movimento[] = movimentosRaw.map(m => {
      const dt = m.dataHora ? new Date(m.dataHora) : null
      const data = dt ? dt.toLocaleDateString('pt-BR', { timeZone: TZ }) : ''
      const hora = dt
        ? dt.toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
        : undefined
      const complemento = m.complementosTabelados?.length
        ? ` — ${m.complementosTabelados.map(c => c.nome ?? c.valor).filter(Boolean).join(', ')}`
        : ''
      return { data, hora, descricao: m.nome + complemento, orgao: m.orgaoJulgador?.nome }
    })

    const ultimoAndamento = movimentos[0]
      ? `${movimentos[0].data} — ${movimentos[0].descricao}`
      : undefined

    const capa: DatajudCapa = {
      numeroProcesso: processo.numeroProcesso,
      classe: processo.classe?.nome,
      assuntos: (processo.assuntos ?? []).map(a => a.nome).filter(Boolean),
      orgaoJulgador: processo.orgaoJulgador?.nome,
      tribunal: processo.tribunal,
      grau: processo.grau ? (GRAU_LEGIVEL[processo.grau] ?? processo.grau) : undefined,
      sistema: processo.sistema?.nome,
      formato: processo.formato?.nome,
      dataAjuizamento: formatarDataAjuizamento(processo.dataAjuizamento),
      nivelSigilo: processo.nivelSigilo,
      ultimaAtualizacao: processo.dataHoraUltimaAtualizacao,
    }

    return {
      encontrado: true,
      processo,
      capa,
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
