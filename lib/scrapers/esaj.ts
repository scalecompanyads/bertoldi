import { parse } from 'node-html-parser'

const ESAJ_BASES: Record<string, string> = {
  tjsp: 'https://esaj.tjsp.jus.br',
  tjsc: 'https://esaj.tjsc.jus.br',
  tjba: 'https://esaj.tjba.jus.br',
  tjce: 'https://esaj.tjce.jus.br',
  tjam: 'https://consultasaj.tjam.jus.br',
  tjms: 'https://esaj.tjms.jus.br',
  tjal: 'https://www2.tjal.jus.br',
  tjrn: 'https://esaj.tjrn.jus.br',
  tjac: 'https://esaj.tjac.jus.br',
}

export interface ScraperResult {
  encontrado: boolean
  ultimoAndamento?: string
  movimentos?: { data: string; hora?: string; descricao: string; orgao?: string }[]
  erro?: string
}

export function isEsajTribunal(tribunalId: string): boolean {
  const base = tribunalId.replace(/2g$/, '').replace(/eproc$/, '').replace(/-e$/, '')
  return base in ESAJ_BASES
}

export function getEsajBase(tribunalId: string): string | null {
  const base = tribunalId.replace(/2g$/, '').replace(/eproc$/, '').replace(/-e$/, '')
  return ESAJ_BASES[base] ?? null
}

function grauPath(tribunalId: string): string {
  return tribunalId.endsWith('2g') ? 'cposg' : 'cpopg'
}

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9',
}

async function fetchHtml(url: string): Promise<{ html: string | null; erro?: string }> {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return { html: null, erro: `Portal retornou HTTP ${res.status}` }
    return { html: await res.text() }
  } catch (err) {
    return { html: null, erro: err instanceof Error ? err.message : 'Timeout ou erro de rede' }
  }
}

function isNaoEncontrado(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes('não encontrado') ||
    lower.includes('nenhum processo') ||
    lower.includes('processo inexistente') ||
    lower.includes('nenhum resultado') ||
    lower.includes('0 processos encontrados')
  )
}

function extrairMovimentos(html: string): { data: string; descricao: string }[] {
  const root = parse(html)

  const tabela =
    root.querySelector('#tabelaTodasMovimentacoes') ||
    root.querySelector('#tabelaUltimasMovimentacoes') ||
    root.querySelector('table.fundoClaro') ||
    null

  if (!tabela) return []

  return tabela
    .querySelectorAll('tr')
    .filter(tr => tr.querySelectorAll('td').length >= 2)
    .slice(0, 15)
    .map(tr => {
      const tds = tr.querySelectorAll('td')
      const data = tds[0]?.text?.trim().replace(/\s+/g, ' ') ?? ''
      const descSpan = tds[tds.length - 1]?.querySelector('span')
      const descricao =
        (descSpan?.text || tds[tds.length - 1]?.text)?.trim().replace(/\s+/g, ' ') ?? ''
      return { data, descricao }
    })
    .filter(m => m.data && m.descricao)
}

// Extrai o processo.codigo embutido no HTML (links, inputs, scripts)
function extrairProcessoCodigo(html: string): string | null {
  // href="show.do?processo.codigo=XXXXXXXX"
  const matchHref = html.match(/show\.do\?processo\.codigo=([A-Z0-9]+)/i)
  if (matchHref) return matchHref[1]

  // value="XXXXXXXX" dentro de input name="processo.codigo"
  const matchInput = html.match(/name=["']processo\.codigo["'][^>]*value=["']([^"']+)["']/i)
    || html.match(/value=["']([^"']+)["'][^>]*name=["']processo\.codigo["']/i)
  if (matchInput) return matchInput[1]

  return null
}

export async function scrapeEsaj(
  numeroCNJ: string,
  tribunalId: string
): Promise<ScraperResult> {
  const esajBase = getEsajBase(tribunalId)
  if (!esajBase) return { encontrado: false, erro: 'Tribunal eSAJ não mapeado.' }

  const grau = grauPath(tribunalId)

  // ── 1ª tentativa: busca pelo número unificado ──────────────────────────────
  const searchUrl = `${esajBase}/${grau}/search.do?cbPesquisa=NUMPROC` +
    `&dadosConsulta.valorConsultaNuUnificado=${encodeURIComponent(numeroCNJ)}` +
    `&dadosConsulta.tipoNuProcesso=UNIFICADO`

  const { html: html1, erro: erro1 } = await fetchHtml(searchUrl)
  if (!html1) return { encontrado: false, erro: erro1 }

  const bodyText = parse(html1).querySelector('body')?.text ?? ''

  if (isNaoEncontrado(bodyText)) return { encontrado: false }

  // Se já tiver tabela de movimentos → retorna direto
  const movsDiretos = extrairMovimentos(html1)
  if (movsDiretos.length > 0) {
    return {
      encontrado: true,
      ultimoAndamento: `${movsDiretos[0].data} — ${movsDiretos[0].descricao}`,
      movimentos: movsDiretos,
    }
  }

  // ── 2ª tentativa: seguir link/código para show.do ─────────────────────────
  const codigo = extrairProcessoCodigo(html1)
  const showUrl = codigo
    ? `${esajBase}/${grau}/show.do?processo.codigo=${codigo}`
    : null

  // Também tenta via href completo que já pode estar na página
  const hrefMatch = html1.match(/href=["']([^"']*show\.do[^"']*)["']/i)
  const showUrlFromHref = hrefMatch
    ? (hrefMatch[1].startsWith('http') ? hrefMatch[1] : `${esajBase}/${grau}/${hrefMatch[1].replace(/^[./]+/, '')}`)
    : null

  const targetUrl = showUrl ?? showUrlFromHref

  if (targetUrl) {
    const { html: html2 } = await fetchHtml(targetUrl)
    if (html2) {
      const movs2 = extrairMovimentos(html2)
      if (movs2.length > 0) {
        return {
          encontrado: true,
          ultimoAndamento: `${movs2[0].data} — ${movs2[0].descricao}`,
          movimentos: movs2,
        }
      }
      // Página carregou mas sem movimentos extraíveis
      if (!isNaoEncontrado(parse(html2).querySelector('body')?.text ?? '')) {
        return { encontrado: true }
      }
    }
  }

  // Processo aparece na página mas não foi possível extrair movimentos
  // (ex: AJAX, captcha, layout diferente)
  return { encontrado: true }
}
