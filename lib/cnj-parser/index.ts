import { TRIBS, Tribunal } from './tribunais'

// Formato CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO
// segmento J: 1=STF 2=CNJ/TRE 3=STJ 4=JF 5=TRT 6=STM 7=MJ 8=TJ 9=TST
// TT = código do tribunal
const CNJ_REGEX = /^(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/

export interface NumeroCNJ {
  nnnnnnn: string
  dd: string
  aaaa: string
  j: string
  tt: string
  oooo: string
  formatted: string
  raw: string
}

export interface ResultadoCNJ {
  numero: NumeroCNJ
  tribunal: Tribunal | null
  urlPortal: string | null
}

export function parseCNJ(raw: string): NumeroCNJ | null {
  const limpo = raw.replace(/\s/g, '').toUpperCase()
  const m = limpo.match(CNJ_REGEX)
  if (!m) return null
  return {
    nnnnnnn: m[1],
    dd: m[2],
    aaaa: m[3],
    j: m[4],
    tt: m[5],
    oooo: m[6],
    formatted: limpo,
    raw: limpo.replace(/[^0-9]/g, ''),
  }
}

export function validarFormatoCNJ(raw: string): boolean {
  return CNJ_REGEX.test(raw.replace(/\s/g, ''))
}

// Mapa segmento+código → tribunal id
// Chave: `${j}-${tt}` onde tt sem zero à esquerda quando necessário
const CMAP: Record<string, string> = {
  // Superiores (TT = 00)
  '1-00': 'stf',
  '3-00': 'stj',
  '5-00': 'tst',
  '2-00': 'tse',
  '6-00': 'stm',

  // TRFs (J=4, TT = número do tribunal)
  '4-01': 'trf1',
  '4-02': 'trf2',
  '4-03': 'trf3',
  '4-04': 'trf4',
  '4-05': 'trf5',
  '4-06': 'trf6',

  // JFs dentro do TRF1 (TT = 01)
  // distinguimos pela OOOO (subseção)
  // Não é possível distinguir JFs de TRF só pelo TT — apontamos para o TRF
  // JFs do TRF3 (SP/MS) — TT=03 1g
  // mantemos o TRF como fallback

  // TRTs (J=5, TT = número do tribunal 01-24)
  '5-01': 'trt1',
  '5-02': 'trt2',
  '5-03': 'trt3',
  '5-04': 'trt4',
  '5-05': 'trt5',
  '5-06': 'trt6',
  '5-07': 'trt7',
  '5-08': 'trt8',
  '5-09': 'trt9',
  '5-10': 'trt10',
  '5-11': 'trt11',
  '5-12': 'trt12',
  '5-13': 'trt13',
  '5-14': 'trt14',
  '5-15': 'trt15',
  '5-16': 'trt16',
  '5-17': 'trt17',
  '5-18': 'trt18',
  '5-19': 'trt19',
  '5-20': 'trt20',
  '5-21': 'trt21',
  '5-22': 'trt22',
  '5-23': 'trt23',
  '5-24': 'trt24',

  // TJs estaduais (J=8, TT = código do tribunal segundo tabela CNJ)
  '8-01': 'tjac',
  '8-02': 'tjal',
  '8-03': 'tjap',
  '8-04': 'tjam',
  '8-05': 'tjba',
  '8-06': 'tjce',
  '8-07': 'tjdft',
  '8-08': 'tjes',
  '8-09': 'tjgo',
  '8-10': 'tjma',
  '8-11': 'tjmt',
  '8-12': 'tjms',
  '8-13': 'tjmg',
  '8-14': 'tjpa',
  '8-15': 'tjpb',
  '8-16': 'tjpr',
  '8-17': 'tjpe',
  '8-18': 'tjpi',
  '8-19': 'tjrj',
  '8-20': 'tjrn',
  '8-21': 'tjrs',
  '8-22': 'tjro',
  '8-23': 'tjrr',
  '8-24': 'tjsc',
  '8-25': 'tjse',
  '8-26': 'tjsp',
  '8-27': 'tjto',
}

export function identificarTribunal(raw: string): ResultadoCNJ | null {
  const numero = parseCNJ(raw)
  if (!numero) return null

  const chave = `${numero.j}-${numero.tt.replace(/^0+/, '') || '0'}`
  let tribunalId = CMAP[chave]

  // TJSP: sequencial >= 4.000.000 → eProc (sistema diferente do eSAJ)
  if (tribunalId === 'tjsp') {
    const seq = parseInt(numero.nnnnnnn, 10)
    if (seq >= 4_000_000) {
      tribunalId = 'tjspeproc'
    }
  }

  let tribunal: Tribunal | null = null
  if (tribunalId) {
    tribunal = TRIBS.find(t => t.id === tribunalId) ?? null
  }

  let urlPortal: string | null = null
  if (tribunal) {
    urlPortal = tribunal.url
      .replace('{CNJ}', numero.formatted)
      .replace('{RAW}', numero.raw)
  }

  return { numero, tribunal, urlPortal }
}

export function formatarNumeroCNJ(raw: string): string {
  const digitos = raw.replace(/\D/g, '')
  if (digitos.length !== 20) return raw
  // NNNNNNN-DD.AAAA.J.TT.OOOO
  return `${digitos.slice(0, 7)}-${digitos.slice(7, 9)}.${digitos.slice(9, 13)}.${digitos.slice(13, 14)}.${digitos.slice(14, 16)}.${digitos.slice(16, 20)}`
}
