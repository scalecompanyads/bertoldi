// Comunica — API pública do DJEN (Diário de Justiça Eletrônico Nacional / CNJ)
// Consulta comunicações (intimações, citações, editais) publicadas em nome de
// um advogado, por número OAB, em todos os tribunais de uma vez.
// Sem chave de API. Docs: https://comunicaapi.pje.jus.br/swagger-ui/index.html

import { parse } from 'node-html-parser'

const BASE_URL = 'https://comunicaapi.pje.jus.br/api/v1/comunicacao'
const ITENS_POR_PAGINA = 100
const MAX_PAGINAS = 20 // trava de segurança — 2.000 comunicações por sincronização

export interface ComunicaItem {
  id: number
  data_disponibilizacao: string // aaaa-mm-dd
  siglaTribunal: string
  tipoComunicacao: string
  nomeOrgao: string
  texto: string // HTML
  numero_processo: string // só dígitos
  numeroprocessocommascara: string
  meio: string
  meiocompleto: string
  link: string | null
  nomeClasse: string
  status: string
  destinatarioadvogados?: {
    advogado?: { nome: string; numero_oab: string; uf_oab: string }
  }[]
}

interface ComunicaResponse {
  status: string
  count: number
  items: ComunicaItem[]
}

export interface BuscaComunicaParams {
  numeroOab: string
  ufOab: string
  /** aaaa-mm-dd */
  dataInicio: string
  /** aaaa-mm-dd */
  dataFim: string
}

export interface BuscaComunicaResult {
  itens: ComunicaItem[]
  erro?: string
}

export async function buscarComunicacoes({
  numeroOab,
  ufOab,
  dataInicio,
  dataFim,
}: BuscaComunicaParams): Promise<BuscaComunicaResult> {
  const itens: ComunicaItem[] = []

  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const url =
      `${BASE_URL}?pagina=${pagina}&itensPorPagina=${ITENS_POR_PAGINA}` +
      `&numeroOab=${encodeURIComponent(numeroOab)}&ufOab=${encodeURIComponent(ufOab)}` +
      `&dataDisponibilizacaoInicio=${dataInicio}&dataDisponibilizacaoFim=${dataFim}`

    let data: ComunicaResponse
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok) {
        return { itens, erro: `Comunica/DJEN retornou HTTP ${res.status}` }
      }
      data = await res.json()
    } catch (err) {
      return {
        itens,
        erro: err instanceof Error ? err.message : 'Timeout ou erro de rede',
      }
    }

    itens.push(...(data.items ?? []))

    // Última página
    if ((data.items?.length ?? 0) < ITENS_POR_PAGINA) break

    // Pausa entre páginas para não saturar a API
    await new Promise(r => setTimeout(r, 400))
  }

  return { itens }
}

// O texto da comunicação vem em HTML — extrai texto plano legível
export function extrairTextoPlano(html: string): string {
  if (!html) return ''
  const texto = parse(html).text ?? ''
  return texto.replace(/\s+/g, ' ').trim()
}
