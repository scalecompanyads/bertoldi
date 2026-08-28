export interface PortalTribunal {
  id: string
  nome: string
  abr: string
  segmento: string
  url: string // {CNJ} = formatado, {RAW} = só dígitos
}

export const PORTAIS_TRIBS: PortalTribunal[] = [
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
  { id: 'trt1',  nome: 'TRT 1ª Região (RJ)',       abr: 'TRT1',  segmento: '5', url: 'https://pje.trt1.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt2',  nome: 'TRT 2ª Região (SP)',       abr: 'TRT2',  segmento: '5', url: 'https://pje.trt2.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt3',  nome: 'TRT 3ª Região (MG)',       abr: 'TRT3',  segmento: '5', url: 'https://pje.trt3.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt4',  nome: 'TRT 4ª Região (RS)',       abr: 'TRT4',  segmento: '5', url: 'https://pje.trt4.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt5',  nome: 'TRT 5ª Região (BA)',       abr: 'TRT5',  segmento: '5', url: 'https://pje.trt5.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt6',  nome: 'TRT 6ª Região (PE)',       abr: 'TRT6',  segmento: '5', url: 'https://pje.trt6.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt9',  nome: 'TRT 9ª Região (PR)',       abr: 'TRT9',  segmento: '5', url: 'https://pje.trt9.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt12', nome: 'TRT 12ª Região (SC)',      abr: 'TRT12', segmento: '5', url: 'https://pje.trt12.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt15', nome: 'TRT 15ª Região (Campinas)', abr: 'TRT15', segmento: '5', url: 'https://pje.trt15.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  // TJs
  { id: 'tjsp',       nome: 'TJSP — 1º Grau',       abr: 'TJSP1g',   segmento: '8', url: 'https://esaj.tjsp.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjsp2g',     nome: 'TJSP — 2º Grau',       abr: 'TJSP2g',   segmento: '8', url: 'https://esaj.tjsp.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjspeproc1g',nome: 'TJSP — eproc 1º Grau', abr: 'TJSP-e1g', segmento: '826', url: 'https://eproc-consulta.tjsp.jus.br/consulta_1g/externo_controlador.php?acao=tjsp@consulta_unificada_publica/consultar&hash=ed2215016033e517baaf4ff37bd4c428' },
  { id: 'tjmg',  nome: 'TJMG',               abr: 'TJMG',   segmento: '8', url: 'https://www4.tjmg.jus.br/juridico/sf/proc_resultado2.jsp?listaProcessos={CNJ}' },
  { id: 'tjrs',  nome: 'TJRS',               abr: 'TJRS',   segmento: '8', url: 'https://www.tjrs.jus.br/novo/buscas-solr/?q={CNJ}&aba=jurisprudencia&tipo=consulta_por_numero' },
  { id: 'tjpr',  nome: 'TJPR',               abr: 'TJPR',   segmento: '8', url: 'https://projudi.tjpr.jus.br/projudi/processo.do?acao=consultarProcessoPublico&numeroProcesso={CNJ}' },
  { id: 'tjsc',  nome: 'TJSC — 1º Grau',    abr: 'TJSC1g', segmento: '8', url: 'https://esaj.tjsc.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjsc2g',nome: 'TJSC — 2º Grau',    abr: 'TJSC2g', segmento: '8', url: 'https://esaj.tjsc.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjrj',  nome: 'TJRJ',              abr: 'TJRJ',   segmento: '8', url: 'https://www3.tjrj.jus.br/ejuris/ImpConsultarAndamento.aspx?codbztrf={CNJ}&numProcesso={CNJ}' },
  { id: 'tjgo',  nome: 'TJGO',              abr: 'TJGO',   segmento: '8', url: 'https://projudi.tjgo.jus.br/BuscaProcesso?PaginaAtual=2&NumeroCNJ={CNJ}' },
  { id: 'tjpe',  nome: 'TJPE',              abr: 'TJPE',   segmento: '8', url: 'https://srv01.tjpe.jus.br/consultaprocessualunificada/processo/{CNJ}' },
  { id: 'tjms',  nome: 'TJMS — 1º Grau',   abr: 'TJMS1g', segmento: '8', url: 'https://esaj.tjms.jus.br/cpopg5/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjms2g',nome: 'TJMS — 2º Grau',   abr: 'TJMS2g', segmento: '8', url: 'https://esaj.tjms.jus.br/cposg5/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjdft', nome: 'TJDFT',             abr: 'TJDFT',  segmento: '8', url: 'https://www.tjdft.jus.br/consultas/processual/consultaprocessual/pesquisar?numero={CNJ}' },
  { id: 'tjba',  nome: 'TJBA — 1º Grau',   abr: 'TJBA1g', segmento: '8', url: 'https://esaj.tjba.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjba2g',nome: 'TJBA — 2º Grau',   abr: 'TJBA2g', segmento: '8', url: 'https://esaj.tjba.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjce',  nome: 'TJCE — 1º Grau',   abr: 'TJCE1g', segmento: '8', url: 'https://esaj.tjce.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjce2g',nome: 'TJCE — 2º Grau',   abr: 'TJCE2g', segmento: '8', url: 'https://esaj.tjce.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjam',  nome: 'TJAM — 1º Grau',   abr: 'TJAM1g', segmento: '8', url: 'https://consultasaj.tjam.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjam2g',nome: 'TJAM — 2º Grau',   abr: 'TJAM2g', segmento: '8', url: 'https://consultasaj.tjam.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjal',  nome: 'TJAL — 1º Grau',   abr: 'TJAL1g', segmento: '8', url: 'https://www2.tjal.jus.br/cpopg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjal2g',nome: 'TJAL — 2º Grau',   abr: 'TJAL2g', segmento: '8', url: 'https://www2.tjal.jus.br/cposg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjrn',  nome: 'TJRN — 1º Grau',   abr: 'TJRN1g', segmento: '8', url: 'https://esaj.tjrn.jus.br/cpopg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjrn2g',nome: 'TJRN — 2º Grau',   abr: 'TJRN2g', segmento: '8', url: 'https://esaj.tjrn.jus.br/cposg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjse',  nome: 'TJSE',              abr: 'TJSE',   segmento: '8', url: 'https://www.tjse.jus.br/portal/consultas/consulta-processual?numeroProcesso={CNJ}' },
  { id: 'tjto',  nome: 'TJTO',              abr: 'TJTO',   segmento: '8', url: 'https://eproc1.tjto.jus.br/eprocV2_prod_1grau/externo_controlador.php?acao=processo_consulta_publica&num_processo={CNJ}' },
  { id: 'tjes',  nome: 'TJES',              abr: 'TJES',   segmento: '8', url: 'https://sistemas.tjes.jus.br/ediario/index.php/component/ediario/?view=processos&consulta={CNJ}' },
  { id: 'tjma',  nome: 'TJMA',              abr: 'TJMA',   segmento: '8', url: 'https://pje.tjma.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjmt',  nome: 'TJMT',              abr: 'TJMT',   segmento: '8', url: 'https://pje.tjmt.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjpb',  nome: 'TJPB',              abr: 'TJPB',   segmento: '8', url: 'https://pje.tjpb.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjpi',  nome: 'TJPI',              abr: 'TJPI',   segmento: '8', url: 'https://pje.tjpi.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjrr',  nome: 'TJRR',              abr: 'TJRR',   segmento: '8', url: 'https://pje.tjrr.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjro',  nome: 'TJRO',              abr: 'TJRO',   segmento: '8', url: 'https://pje.tjro.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjpa',  nome: 'TJPA',              abr: 'TJPA',   segmento: '8', url: 'https://libra.tjpa.jus.br/LIBRA/html/consultaProcesso/consultarProcesso.seam?PN={CNJ}' },
  { id: 'tjap',  nome: 'TJAP',              abr: 'TJAP',   segmento: '8', url: 'https://projudi.tjap.jus.br/projudi/processo.do?acao=consultarProcessoPublico&numeroProcesso={CNJ}' },
]

const PORTAIS_CMAP: Record<string, string[]> = {
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

export const SEG_NOMES: Record<string, string> = {
  '1': 'STF', '2': 'Eleitoral', '4': 'Federal', '5': 'Trabalhista',
  '6': 'Mil. Federal', '7': 'Mil. Estadual', '8': 'Estadual', '9': 'Superior',
}

// raw20 = 20 dígitos sem pontuação
export function identificarPortais(raw20: string): PortalTribunal[] {
  const chave = raw20[13] + raw20[14] + raw20[15]
  const ids = PORTAIS_CMAP[chave]

  if (!ids) {
    const j = raw20[13]
    return PORTAIS_TRIBS.filter(t => t.segmento === j)
  }

  let idsFinais = ids

  if (chave === '826') {
    const seq = parseInt(raw20.slice(0, 7), 10)
    if (seq >= 4_000_000) {
      idsFinais = ids.filter(id => id === 'tjspeproc1g')
    } else {
      const oooo = parseInt(raw20.slice(16, 20), 10)
      const eSAJ = ids.filter(id => id !== 'tjspeproc1g')
      const e1g = eSAJ.filter(id => !id.endsWith('2g'))
      const e2g = eSAJ.filter(id => id.endsWith('2g'))
      if (e1g.length && e2g.length) idsFinais = oooo >= 9000 ? e2g : e1g
      else idsFinais = eSAJ
    }
  } else {
    const ids1g = ids.filter(id => !id.endsWith('2g'))
    const ids2g = ids.filter(id => id.endsWith('2g'))
    if (ids1g.length && ids2g.length) {
      const oooo = parseInt(raw20.slice(16, 20), 10)
      idsFinais = oooo >= 9000 ? ids2g : ids1g
    }
  }

  return idsFinais.map(id => PORTAIS_TRIBS.find(t => t.id === id)!).filter(Boolean)
}

export function buildPortalUrl(t: PortalTribunal, cnj: string, raw20: string): string {
  return t.url.replaceAll('{CNJ}', cnj).replaceAll('{RAW}', raw20)
}
