import { scrapeEsaj, isEsajTribunal, type ScraperResult } from './esaj'
import { consultarDatajud } from '@/lib/datajud'

export type { ScraperResult }

export interface AnaliseResult extends ScraperResult {
  fonte: 'esaj' | 'datajud' | 'erro'
}

// Tribunais que usam eProc e NÃO devem ir ao eSAJ — vai direto ao Datajud
const EPROC_TRIBUNAIS = new Set(['tjspeproc', 'tjmgeproc', 'tjspeproc2g'])

function normalizar(tribunalId: string): string {
  return tribunalId.replace(/2g$/, '').replace(/eproc$/, '').replace(/-e$/, '')
}

export async function analisarProcesso(
  numeroCNJ: string,
  tribunalId: string
): Promise<AnaliseResult> {
  // ── eProc: nunca usa eSAJ → tenta Datajud diretamente ───────────────────
  if (EPROC_TRIBUNAIS.has(tribunalId)) {
    const dj = await tentarDatajud(numeroCNJ, tribunalId)
    if (dj) return dj
    return {
      encontrado: false,
      fonte: 'erro',
      erro: 'Processo tramita no eProc. Consulte diretamente no portal do tribunal.',
    }
  }

  const baseId = normalizar(tribunalId)

  // ── Tentativa 1: eSAJ (tribunais que usam esse portal) ──────────────────
  if (isEsajTribunal(baseId)) {
    const r = await scrapeEsaj(numeroCNJ, tribunalId)

    // Encontrou com movimentos → retorna
    if (r.encontrado && r.movimentos?.length) {
      return { ...r, fonte: 'esaj' }
    }

    // Encontrou mas sem movimentos extraíveis → tenta Datajud como fallback
    if (r.encontrado) {
      const dj = await tentarDatajud(numeroCNJ, tribunalId)
      if (dj) return dj
      // Retorna eSAJ mesmo sem movimentos
      return { encontrado: true, fonte: 'esaj', ultimoAndamento: r.ultimoAndamento }
    }

    // eSAJ deu erro de rede → tenta Datajud antes de desistir
    if (r.erro) {
      const dj = await tentarDatajud(numeroCNJ, tribunalId)
      if (dj) return dj
      return { encontrado: false, fonte: 'esaj', erro: r.erro }
    }

    // Não encontrado no eSAJ
    return { encontrado: false, fonte: 'esaj' }
  }

  // ── Tentativa 2: Datajud para todos os demais tribunais ──────────────────
  const dj = await tentarDatajud(numeroCNJ, tribunalId)
  if (dj) return dj

  // ── Nenhum método funcionou ──────────────────────────────────────────────
  return {
    encontrado: false,
    fonte: 'erro',
    erro: 'Não foi possível consultar este processo automaticamente. Tente acessar o portal do tribunal diretamente.',
  }
}

async function tentarDatajud(
  numeroCNJ: string,
  tribunalId: string
): Promise<AnaliseResult | null> {
  const result = await consultarDatajud(numeroCNJ, tribunalId)

  if (result.encontrado) {
    return {
      encontrado: true,
      ultimoAndamento: result.ultimoAndamento,
      movimentos: result.movimentos,
      fonte: 'datajud',
    }
  }

  // 403/404 significa que o tribunal não está naquele índice — não é um erro real, tenta próximo método
  if (result.erro?.includes('403') || result.erro?.includes('404') || result.erro?.includes('Índice')) {
    return null
  }

  // Erro real (rede, autenticação, etc.) → propaga
  if (result.erro) {
    return { encontrado: false, fonte: 'datajud', erro: result.erro }
  }

  // Processo simplesmente não encontrado no índice
  return null
}
