'use client'

import { useState, useCallback } from 'react'
import { Search, Copy, ExternalLink, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

// ─── Dados dos tribunais ───────────────────────────────────────────────────

interface Tribunal {
  id: string
  nome: string
  abr: string
  segmento: string
  url: string // {CNJ} = formatado, {RAW} = só dígitos
}

const TRIBS: Tribunal[] = [
  { id: 'stf',  nome: 'Supremo Tribunal Federal',      abr: 'STF',  segmento: '1', url: 'https://portal.stf.jus.br/processos/detalhe.asp?incidente={CNJ}' },
  { id: 'stj',  nome: 'Superior Tribunal de Justiça',  abr: 'STJ',  segmento: '9', url: 'https://processo.stj.jus.br/processo/pesquisa/?tipoPesquisa=tipoPesquisaNumeroRegistro&termo={CNJ}' },
  { id: 'tst',  nome: 'Tribunal Superior do Trabalho', abr: 'TST',  segmento: '5', url: 'https://consultaprocessual.tst.jus.br/consultaProcessual/consultaTstNumUnica.do?consulta=Consultar&numeroTst={CNJ}' },
  { id: 'tse',  nome: 'Tribunal Superior Eleitoral',   abr: 'TSE',  segmento: '2', url: 'https://pje.tse.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'stm',  nome: 'Superior Tribunal Militar',     abr: 'STM',  segmento: '6', url: 'https://processos.stm.jus.br/processos/autos/{CNJ}' },
  { id: 'trf1', nome: 'TRF 1ª Região (AC AM AP BA DF GO MA MG MT PA PI RO RR TO)', abr: 'TRF1', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=TRF1&proc={CNJ}&enviar=Pesquisar' },
  { id: 'trf2', nome: 'TRF 2ª Região (RJ ES)', abr: 'TRF2', segmento: '4', url: 'https://eproc.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica&txtPesquisa={CNJ}&todasfases=S&todaspartes=S' },
  { id: 'trf3', nome: 'TRF 3ª Região (SP MS)', abr: 'TRF3', segmento: '4', url: 'https://web.trf3.jus.br/consultas/Internet/ConsultaProcessual?numero_processo={CNJ}' },
  { id: 'trf4', nome: 'TRF 4ª Região (RS SC PR)', abr: 'TRF4', segmento: '4', url: 'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'trf5', nome: 'TRF 5ª Região (PE AL SE CE RN PB)', abr: 'TRF5', segmento: '4', url: 'https://eproc.trf5.jus.br/eproc2trf5/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'trf6', nome: 'TRF 6ª Região (MG)', abr: 'TRF6', segmento: '4', url: 'https://eproc.trf6.jus.br/eproc2trf6/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  // JF TRF1
  { id: 'jfac', nome: 'JF Seção AC — 1º Grau', abr: 'JFAC', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=AC&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfam', nome: 'JF Seção AM — 1º Grau', abr: 'JFAM', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=AM&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfba', nome: 'JF Seção BA — 1º Grau', abr: 'JFBA', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=BA&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfdf', nome: 'JF Seção DF — 1º Grau', abr: 'JFDF', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=DF&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfgo', nome: 'JF Seção GO — 1º Grau', abr: 'JFGO', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=GO&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfmg', nome: 'JF Seção MG — 1º Grau', abr: 'JFMG', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=MG&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfpa', nome: 'JF Seção PA — 1º Grau', abr: 'JFPA', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=PA&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfsp', nome: 'JF Seção SP — 1º Grau (PJe)', abr: 'JFSP', segmento: '4', url: 'https://pje1g.trf3.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'jfms', nome: 'JF Seção MS — 1º Grau (PJe)', abr: 'JFMS', segmento: '4', url: 'https://pje1g.trf3.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'jfrj', nome: 'JF Seção RJ — 1º Grau', abr: 'JFRJ', segmento: '4', url: 'https://eproc.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica&txtPesquisa={CNJ}&todasfases=S&todaspartes=S' },
  { id: 'jfes', nome: 'JF Seção ES — 1º Grau', abr: 'JFES', segmento: '4', url: 'https://eproc.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica&txtPesquisa={CNJ}&todasfases=S&todaspartes=S' },
  { id: 'jfrs', nome: 'JF Seção RS — 1º Grau', abr: 'JFRS', segmento: '4', url: 'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'jfsc', nome: 'JF Seção SC — 1º Grau', abr: 'JFSC', segmento: '4', url: 'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'jfpr', nome: 'JF Seção PR — 1º Grau', abr: 'JFPR', segmento: '4', url: 'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  // TRTs
  { id: 'trt1',  nome: 'TRT 1ª Região (RJ)',    abr: 'TRT1',  segmento: '5', url: 'https://pje.trt1.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt2',  nome: 'TRT 2ª Região (SP)',    abr: 'TRT2',  segmento: '5', url: 'https://pje.trt2.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt3',  nome: 'TRT 3ª Região (MG)',    abr: 'TRT3',  segmento: '5', url: 'https://pje.trt3.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt4',  nome: 'TRT 4ª Região (RS)',    abr: 'TRT4',  segmento: '5', url: 'https://pje.trt4.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt5',  nome: 'TRT 5ª Região (BA)',    abr: 'TRT5',  segmento: '5', url: 'https://pje.trt5.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt6',  nome: 'TRT 6ª Região (PE)',    abr: 'TRT6',  segmento: '5', url: 'https://pje.trt6.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt9',  nome: 'TRT 9ª Região (PR)',    abr: 'TRT9',  segmento: '5', url: 'https://pje.trt9.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt12', nome: 'TRT 12ª Região (SC)',   abr: 'TRT12', segmento: '5', url: 'https://pje.trt12.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt15', nome: 'TRT 15ª Região (Campinas)', abr: 'TRT15', segmento: '5', url: 'https://pje.trt15.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  // TJs eSAJ
  { id: 'tjsp',   nome: 'TJSP — 1º Grau',  abr: 'TJSP1g',  segmento: '8', url: 'https://esaj.tjsp.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjsp2g', nome: 'TJSP — 2º Grau',  abr: 'TJSP2g',  segmento: '8', url: 'https://esaj.tjsp.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjspeproc1g', nome: 'TJSP — eproc 1º Grau', abr: 'TJSP-e1g', segmento: '826', url: 'https://eproc-consulta.tjsp.jus.br/consulta_1g/externo_controlador.php?acao=tjsp@consulta_unificada_publica/consultar&hash=ed2215016033e517baaf4ff37bd4c428' },
  { id: 'tjmg',   nome: 'TJMG',  abr: 'TJMG',  segmento: '8', url: 'https://www4.tjmg.jus.br/juridico/sf/proc_resultado2.jsp?listaProcessos={CNJ}' },
  { id: 'tjrs',   nome: 'TJRS',  abr: 'TJRS',  segmento: '8', url: 'https://www.tjrs.jus.br/novo/buscas-solr/?q={CNJ}&aba=jurisprudencia&tipo=consulta_por_numero' },
  { id: 'tjpr',   nome: 'TJPR',  abr: 'TJPR',  segmento: '8', url: 'https://projudi.tjpr.jus.br/projudi/processo.do?acao=consultarProcessoPublico&numeroProcesso={CNJ}' },
  { id: 'tjsc',   nome: 'TJSC — 1º Grau', abr: 'TJSC1g', segmento: '8', url: 'https://esaj.tjsc.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjsc2g', nome: 'TJSC — 2º Grau', abr: 'TJSC2g', segmento: '8', url: 'https://esaj.tjsc.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjrj',   nome: 'TJRJ',  abr: 'TJRJ',  segmento: '8', url: 'https://www3.tjrj.jus.br/ejuris/ImpConsultarAndamento.aspx?codbztrf={CNJ}&numProcesso={CNJ}' },
  { id: 'tjgo',   nome: 'TJGO',  abr: 'TJGO',  segmento: '8', url: 'https://projudi.tjgo.jus.br/BuscaProcesso?PaginaAtual=2&NumeroCNJ={CNJ}' },
  { id: 'tjpe',   nome: 'TJPE',  abr: 'TJPE',  segmento: '8', url: 'https://srv01.tjpe.jus.br/consultaprocessualunificada/processo/{CNJ}' },
  { id: 'tjms',   nome: 'TJMS — 1º Grau', abr: 'TJMS1g', segmento: '8', url: 'https://esaj.tjms.jus.br/cpopg5/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjms2g', nome: 'TJMS — 2º Grau', abr: 'TJMS2g', segmento: '8', url: 'https://esaj.tjms.jus.br/cposg5/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjdft',  nome: 'TJDFT', abr: 'TJDFT', segmento: '8', url: 'https://www.tjdft.jus.br/consultas/processual/consultaprocessual/pesquisar?numero={CNJ}' },
  { id: 'tjba',   nome: 'TJBA — 1º Grau', abr: 'TJBA1g', segmento: '8', url: 'https://esaj.tjba.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjba2g', nome: 'TJBA — 2º Grau', abr: 'TJBA2g', segmento: '8', url: 'https://esaj.tjba.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjce',   nome: 'TJCE — 1º Grau', abr: 'TJCE1g', segmento: '8', url: 'https://esaj.tjce.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjce2g', nome: 'TJCE — 2º Grau', abr: 'TJCE2g', segmento: '8', url: 'https://esaj.tjce.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjam',   nome: 'TJAM — 1º Grau', abr: 'TJAM1g', segmento: '8', url: 'https://consultasaj.tjam.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjam2g', nome: 'TJAM — 2º Grau', abr: 'TJAM2g', segmento: '8', url: 'https://consultasaj.tjam.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjal',   nome: 'TJAL — 1º Grau', abr: 'TJAL1g', segmento: '8', url: 'https://www2.tjal.jus.br/cpopg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjal2g', nome: 'TJAL — 2º Grau', abr: 'TJAL2g', segmento: '8', url: 'https://www2.tjal.jus.br/cposg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjrn',   nome: 'TJRN — 1º Grau', abr: 'TJRN1g', segmento: '8', url: 'https://esaj.tjrn.jus.br/cpopg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjrn2g', nome: 'TJRN — 2º Grau', abr: 'TJRN2g', segmento: '8', url: 'https://esaj.tjrn.jus.br/cposg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjse',   nome: 'TJSE', abr: 'TJSE', segmento: '8', url: 'https://www.tjse.jus.br/portal/consultas/consulta-processual?numeroProcesso={CNJ}' },
  { id: 'tjto',   nome: 'TJTO', abr: 'TJTO', segmento: '8', url: 'https://eproc1.tjto.jus.br/eprocV2_prod_1grau/externo_controlador.php?acao=processo_consulta_publica&num_processo={CNJ}' },
  { id: 'tjes',   nome: 'TJES', abr: 'TJES', segmento: '8', url: 'https://sistemas.tjes.jus.br/ediario/index.php/component/ediario/?view=processos&consulta={CNJ}' },
  { id: 'tjma',   nome: 'TJMA', abr: 'TJMA', segmento: '8', url: 'https://pje.tjma.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjmt',   nome: 'TJMT', abr: 'TJMT', segmento: '8', url: 'https://pje.tjmt.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjpb',   nome: 'TJPB', abr: 'TJPB', segmento: '8', url: 'https://pje.tjpb.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjpi',   nome: 'TJPI', abr: 'TJPI', segmento: '8', url: 'https://pje.tjpi.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjrr',   nome: 'TJRR', abr: 'TJRR', segmento: '8', url: 'https://pje.tjrr.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjro',   nome: 'TJRO', abr: 'TJRO', segmento: '8', url: 'https://pje.tjro.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjpa',   nome: 'TJPA', abr: 'TJPA', segmento: '8', url: 'https://libra.tjpa.jus.br/LIBRA/html/consultaProcesso/consultarProcesso.seam?PN={CNJ}' },
  { id: 'tjap',   nome: 'TJAP', abr: 'TJAP', segmento: '8', url: 'https://projudi.tjap.jus.br/projudi/processo.do?acao=consultarProcessoPublico&numeroProcesso={CNJ}' },
]

const CMAP: Record<string, string[]> = {
  '100': ['stf'], '900': ['stj'], '200': ['tse'], '600': ['stm'], '500': ['tst'],
  '401': ['trf1','jfac','jfam','jfba','jfdf','jfgo','jfmg','jfpa'],
  '402': ['trf2','jfrj','jfes'],
  '403': ['trf3','jfsp','jfms'],
  '404': ['trf4','jfrs','jfsc','jfpr'],
  '405': ['trf5'],
  '406': ['trf6'],
  '501': ['trt1'],'502': ['trt2'],'503': ['trt3'],'504': ['trt4'],
  '505': ['trt5'],'506': ['trt6'],'509': ['trt9'],
  '512': ['trt12'],'515': ['trt15'],
  '801': ['tjac'],'802': ['tjal','tjal2g'],'803': ['tjam','tjam2g'],'804': ['tjap'],
  '805': ['tjba','tjba2g'],'806': ['tjce','tjce2g'],'807': ['tjdft'],'808': ['tjes'],
  '809': ['tjgo'],'810': ['tjma'],'811': ['tjmt'],'812': ['tjms','tjms2g'],
  '813': ['tjmg'],'814': ['tjpa'],'815': ['tjpb'],'816': ['tjpr'],
  '817': ['tjpe'],'818': ['tjpi'],'819': ['tjrj'],'820': ['tjrn','tjrn2g'],
  '821': ['tjrs'],'822': ['tjro'],'823': ['tjrr'],'824': ['tjsc','tjsc2g'],
  '825': ['tjse'],'826': ['tjsp','tjsp2g','tjspeproc1g'],'827': ['tjto'],
}

const SEG_NOMES: Record<string, string> = {
  '1': 'STF', '2': 'Eleitoral', '4': 'Federal', '5': 'Trabalhista',
  '6': 'Mil. Federal', '7': 'Mil. Estadual', '8': 'Estadual', '9': 'Superior',
}

const SEGMENTOS = [
  { valor: '', label: 'Todos os segmentos' },
  { valor: '1', label: 'STF (J1)' },
  { valor: '9', label: 'Superior — STJ (J9)' },
  { valor: '4', label: 'Federal — TRF / JF (J4)' },
  { valor: '5', label: 'Trabalhista — TRT (J5)' },
  { valor: '8', label: 'Estadual — TJ (J8)' },
  { valor: '2', label: 'Eleitoral — TSE / TRE (J2)' },
  { valor: '6', label: 'Militar Federal — STM (J6)' },
]

// ─── CNJ helpers ──────────────────────────────────────────────────────────

function formatarCNJ(raw: string): string {
  let m = ''
  for (let i = 0; i < raw.length; i++) {
    if (i === 7) m += '-'
    else if (i === 9) m += '.'
    else if (i === 13) m += '.'
    else if (i === 14) m += '.'
    else if (i === 16) m += '.'
    m += raw[i]
  }
  return m
}

function identificarTribunais(raw: string): string[] {
  const chave = raw[13] + raw[14] + raw[15]
  const ids = CMAP[chave]
  if (!ids) {
    const j = raw[13]
    return TRIBS.filter(t => t.segmento === j).map(t => t.id)
  }

  if (chave === '826') {
    const seq = parseInt(raw.slice(0, 7), 10)
    if (seq >= 4000000) return ids.filter(id => id === 'tjspeproc1g')
    const oooo = parseInt(raw.slice(16, 20), 10)
    const eSAJ = ids.filter(id => id !== 'tjspeproc1g')
    const e1g = eSAJ.filter(id => !id.endsWith('2g'))
    const e2g = eSAJ.filter(id => id.endsWith('2g'))
    if (e1g.length && e2g.length) return oooo >= 9000 ? e2g : e1g
    return eSAJ
  }

  const ids1g = ids.filter(id => !id.endsWith('2g'))
  const ids2g = ids.filter(id => id.endsWith('2g'))
  if (ids1g.length && ids2g.length) {
    const oooo = parseInt(raw.slice(16, 20), 10)
    return oooo >= 9000 ? ids2g : ids1g
  }
  return ids
}

function buildUrl(t: Tribunal, cnj: string, raw: string): string {
  return t.url.replaceAll('{CNJ}', cnj).replaceAll('{RAW}', raw)
}

// ─── Tipos de resultado ───────────────────────────────────────────────────

interface Resultado {
  tribunal: Tribunal
  url: string
  cnj: string
  raw: string
}

// ─── Componente principal ─────────────────────────────────────────────────

export default function ConsultaPage() {
  const [cnj, setCnj] = useState('')
  const [segmento, setSegmento] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [copiados, setCopiados] = useState<Set<string>>(new Set())

  const raw = cnj.replace(/\D/g, '')
  const valido = raw.length === 20
  const cnj_fmt = valido ? formatarCNJ(raw) : ''

  function handleCNJInput(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 20)
    setCnj(formatarCNJ(digits))
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    const digits = text.replace(/\D/g, '').slice(0, 20)
    setCnj(formatarCNJ(digits))
  }

  const buscar = useCallback(() => {
    if (!valido) return
    setBuscando(true)
    setTimeout(() => {
      const competentes = identificarTribunais(raw)
      const filtrados = segmento
        ? competentes.filter(id => {
            const t = TRIBS.find(t => t.id === id)
            return t && (t.segmento === segmento || t.segmento.startsWith(segmento))
          })
        : competentes

      const lista: Resultado[] = filtrados.map(id => {
        const t = TRIBS.find(t => t.id === id)!
        return { tribunal: t, url: buildUrl(t, cnj_fmt, raw), cnj: cnj_fmt, raw }
      }).filter(r => r.tribunal)

      setResultados(lista)
      setAbertos(new Set(lista.map(r => r.tribunal.id)))
      setCopiados(new Set())
      setBuscando(false)
    }, 200)
  }, [valido, raw, cnj_fmt, segmento])

  function toggleAberto(id: string) {
    setAbertos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function copiarEAbrir(r: Resultado) {
    try { await navigator.clipboard.writeText(r.cnj) } catch {}
    window.open(r.url, '_blank', 'noopener,noreferrer')
    setCopiados(prev => new Set(prev).add(r.tribunal.id))
    toast.success(`${r.cnj} copiado! Cole no portal com Ctrl+V.`)
  }

  const ano  = raw.length >= 13 ? raw.slice(9, 13) : '—'
  const j    = raw.length >= 14 ? raw[13] : '—'
  const tt   = raw.length >= 16 ? raw.slice(14, 16) : '—'

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Consulta Processual</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Informe o número CNJ — o sistema identifica o tribunal e abre o portal oficial.
        </p>
      </div>

      {/* Card de busca */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cnj-input">Número CNJ do Processo</Label>
          <div className="relative">
            <Input
              id="cnj-input"
              value={cnj}
              onChange={handleCNJInput}
              onPaste={handlePaste}
              onKeyDown={e => { if (e.key === 'Enter') buscar() }}
              placeholder="0000000-00.0000.0.00.0000"
              className="font-mono text-base tracking-wide pr-10"
              maxLength={25}
              inputMode="numeric"
              autoComplete="off"
            />
            {raw.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base">
                {valido ? '✅' : '⚠️'}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Formato: <span className="font-mono">NNNNNNN-DD.AAAA.J.TT.OOOO</span>
            {valido && (
              <span className="ml-2 text-muted-foreground/70">
                · Ano: {ano} · Segmento: {SEG_NOMES[j] ?? j} · Tribunal: {tt}
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Filtrar por segmento</Label>
            <Select value={segmento} onValueChange={(v) => setSegmento(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os segmentos" />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTOS.map(s => (
                  <SelectItem key={s.valor || 'todos'} value={s.valor || 'todos'}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!valido || buscando}
              onClick={buscar}
            >
              <Search className="h-4 w-4 mr-2" />
              {buscando ? 'Identificando...' : 'Consultar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {resultados.length} tribunal{resultados.length !== 1 ? 'is' : ''} competente{resultados.length !== 1 ? 's' : ''}
            </p>
            <Badge variant="secondary" className="text-xs">
              CNJ: {cnj_fmt}
            </Badge>
          </div>

          <div className="space-y-2">
            {resultados.map(r => {
              const isAberto = abertos.has(r.tribunal.id)
              const copiado = copiados.has(r.tribunal.id)
              return (
                <div key={r.tribunal.id} className="rounded-xl border bg-card overflow-hidden shadow-sm">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors text-left gap-3"
                    onClick={() => toggleAberto(r.tribunal.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className="text-xs shrink-0 font-mono">
                        {r.tribunal.abr}
                      </Badge>
                      <span className="text-sm font-medium truncate">{r.tribunal.nome}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {isAberto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isAberto && (
                    <div className="border-t px-4 py-3 space-y-3">
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 border px-3 py-2.5">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Número CNJ</p>
                          <p className="font-mono font-bold text-sm">{r.cnj}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={copiado ? 'secondary' : 'default'}
                          onClick={() => copiarEAbrir(r)}
                          className="shrink-0 gap-1.5"
                        >
                          {copiado ? (
                            <><CheckCircle2 className="h-3.5 w-3.5" /> Copiado</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" /> Copiar e abrir<ExternalLink className="h-3 w-3 opacity-60" /></>
                          )}
                        </Button>
                      </div>

                      {r.tribunal.id === 'tjspeproc1g' && (
                        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs text-blue-600 dark:text-blue-400">
                          No portal eproc: cole o número em <strong>Nº Processo</strong>, selecione <strong>Primeiro Grau</strong> e clique em Consultar.
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded bg-muted/40 px-2.5 py-1.5">
                          <p className="text-muted-foreground mb-0.5">Ano</p>
                          <p className="font-medium">{ano}</p>
                        </div>
                        <div className="rounded bg-muted/40 px-2.5 py-1.5">
                          <p className="text-muted-foreground mb-0.5">Segmento</p>
                          <p className="font-medium">{SEG_NOMES[j] ?? j}</p>
                        </div>
                        <div className="rounded bg-muted/40 px-2.5 py-1.5">
                          <p className="text-muted-foreground mb-0.5">Vara / Foro</p>
                          <p className="font-medium">{parseInt(r.raw.slice(16, 20), 10)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {resultados.length === 0 && valido && !buscando && (
        <div className="rounded-xl border bg-card px-4 py-8 text-center">
          <AlertCircle className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Clique em Consultar para identificar os tribunais competentes.</p>
        </div>
      )}
    </div>
  )
}
