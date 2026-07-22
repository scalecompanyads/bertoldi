export interface Tribunal {
  id: string
  nome: string
  sigla: string
  segmento: string
  url: string // {CNJ} = número formatado, {RAW} = só dígitos
}

export const TRIBS: Tribunal[] = [
  // SUPERIORES
  { id: 'stf',  nome: 'Supremo Tribunal Federal',      sigla: 'STF',  segmento: '1',
    url: 'https://portal.stf.jus.br/processos/detalhe.asp?incidente={CNJ}' },
  { id: 'stj',  nome: 'Superior Tribunal de Justiça',  sigla: 'STJ',  segmento: '9',
    url: 'https://processo.stj.jus.br/processo/pesquisa/?tipoPesquisa=tipoPesquisaNumeroRegistro&termo={CNJ}' },
  { id: 'tst',  nome: 'Tribunal Superior do Trabalho', sigla: 'TST',  segmento: '5',
    url: 'https://consultaprocessual.tst.jus.br/consultaProcessual/consultaTstNumUnica.do?consulta=Consultar&numeroTst={CNJ}' },
  { id: 'tse',  nome: 'Tribunal Superior Eleitoral',   sigla: 'TSE',  segmento: '2',
    url: 'https://pje.tse.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'stm',  nome: 'Superior Tribunal Militar',     sigla: 'STM',  segmento: '6',
    url: 'https://processos.stm.jus.br/processos/autos/{CNJ}' },

  // TRFs
  { id: 'trf1', nome: 'TRF 1ª Região (AC AM AP BA DF GO MA MG MT PA PI RO RR TO)', sigla: 'TRF1', segmento: '4',
    url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=TRF1&proc={CNJ}&enviar=Pesquisar' },
  { id: 'trf2', nome: 'TRF 2ª Região (RJ ES)', sigla: 'TRF2', segmento: '4',
    url: 'https://eproc.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica&txtPesquisa={CNJ}&todasfases=S&todaspartes=S' },
  { id: 'trf3', nome: 'TRF 3ª Região (SP MS)', sigla: 'TRF3', segmento: '4',
    url: 'https://web.trf3.jus.br/consultas/Internet/ConsultaProcessual?numero_processo={CNJ}' },
  { id: 'trf4', nome: 'TRF 4ª Região (RS SC PR)', sigla: 'TRF4', segmento: '4',
    url: 'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'trf5', nome: 'TRF 5ª Região (PE AL SE CE RN PB)', sigla: 'TRF5', segmento: '4',
    url: 'https://eproc.trf5.jus.br/eproc2trf5/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'trf6', nome: 'TRF 6ª Região (MG)', sigla: 'TRF6', segmento: '4',
    url: 'https://eproc.trf6.jus.br/eproc2trf6/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },

  // JF TRF1
  { id: 'jfac', nome: 'JF Seção AC — 1º Grau', sigla: 'JFAC', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=AC&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfam', nome: 'JF Seção AM — 1º Grau', sigla: 'JFAM', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=AM&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfap', nome: 'JF Seção AP — 1º Grau', sigla: 'JFAP', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=AP&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfba', nome: 'JF Seção BA — 1º Grau', sigla: 'JFBA', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=BA&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfdf', nome: 'JF Seção DF — 1º Grau', sigla: 'JFDF', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=DF&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfgo', nome: 'JF Seção GO — 1º Grau', sigla: 'JFGO', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=GO&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfma', nome: 'JF Seção MA — 1º Grau', sigla: 'JFMA', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=MA&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfmg', nome: 'JF Seção MG — 1º Grau', sigla: 'JFMG', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=MG&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfmt', nome: 'JF Seção MT — 1º Grau', sigla: 'JFMT', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=MT&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfpa', nome: 'JF Seção PA — 1º Grau', sigla: 'JFPA', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=PA&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfpi', nome: 'JF Seção PI — 1º Grau', sigla: 'JFPI', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=PI&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfro', nome: 'JF Seção RO — 1º Grau', sigla: 'JFRO', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=RO&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfrr', nome: 'JF Seção RR — 1º Grau', sigla: 'JFRR', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=RR&proc={CNJ}&enviar=Pesquisar' },
  { id: 'jfto', nome: 'JF Seção TO — 1º Grau', sigla: 'JFTO', segmento: '4', url: 'https://processual.trf1.jus.br/consultaProcessual/numeroProcesso.php?secao=TO&proc={CNJ}&enviar=Pesquisar' },

  // JF TRF2
  { id: 'jfrj', nome: 'JF Seção RJ — 1º Grau', sigla: 'JFRJ', segmento: '4', url: 'https://eproc.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica&txtPesquisa={CNJ}&todasfases=S&todaspartes=S' },
  { id: 'jfes', nome: 'JF Seção ES — 1º Grau', sigla: 'JFES', segmento: '4', url: 'https://eproc.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica&txtPesquisa={CNJ}&todasfases=S&todaspartes=S' },

  // JF TRF3 (PJe)
  { id: 'jfsp', nome: 'JF Seção SP — 1º Grau (PJe)', sigla: 'JFSP', segmento: '4', url: 'https://pje1g.trf3.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'jfms', nome: 'JF Seção MS — 1º Grau (PJe)', sigla: 'JFMS', segmento: '4', url: 'https://pje1g.trf3.jus.br/consultaprocessual/detalhe-processo/{RAW}' },

  // JF TRF4
  { id: 'jfrs', nome: 'JF Seção RS — 1º Grau', sigla: 'JFRS', segmento: '4', url: 'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'jfsc', nome: 'JF Seção SC — 1º Grau', sigla: 'JFSC', segmento: '4', url: 'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'jfpr', nome: 'JF Seção PR — 1º Grau', sigla: 'JFPR', segmento: '4', url: 'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },

  // JF TRF5
  { id: 'jfpe', nome: 'JF Seção PE — 1º Grau', sigla: 'JFPE', segmento: '4', url: 'https://eproc.trf5.jus.br/eproc2trf5/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'jfal', nome: 'JF Seção AL — 1º Grau', sigla: 'JFAL', segmento: '4', url: 'https://eproc.trf5.jus.br/eproc2trf5/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'jfse', nome: 'JF Seção SE — 1º Grau', sigla: 'JFSE', segmento: '4', url: 'https://eproc.trf5.jus.br/eproc2trf5/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'jfce', nome: 'JF Seção CE — 1º Grau', sigla: 'JFCE', segmento: '4', url: 'https://eproc.trf5.jus.br/eproc2trf5/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'jfrn', nome: 'JF Seção RN — 1º Grau', sigla: 'JFRN', segmento: '4', url: 'https://eproc.trf5.jus.br/eproc2trf5/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },
  { id: 'jfpb', nome: 'JF Seção PB — 1º Grau', sigla: 'JFPB', segmento: '4', url: 'https://eproc.trf5.jus.br/eproc2trf5/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },

  // JF TRF6
  { id: 'jfmg2', nome: 'JF Subseções MG — 1º Grau (TRF6)', sigla: 'JFMG2', segmento: '4', url: 'https://eproc.trf6.jus.br/eproc2trf6/controlador.php?acao=consulta_processual_pesquisa&txtPesquisa={CNJ}' },

  // TRTs (PJe)
  { id: 'trt1',  nome: 'TRT 1ª Região (RJ)',        sigla: 'TRT1',  segmento: '5', url: 'https://pje.trt1.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt2',  nome: 'TRT 2ª Região (SP)',        sigla: 'TRT2',  segmento: '5', url: 'https://pje.trt2.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt3',  nome: 'TRT 3ª Região (MG)',        sigla: 'TRT3',  segmento: '5', url: 'https://pje.trt3.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt4',  nome: 'TRT 4ª Região (RS)',        sigla: 'TRT4',  segmento: '5', url: 'https://pje.trt4.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt5',  nome: 'TRT 5ª Região (BA)',        sigla: 'TRT5',  segmento: '5', url: 'https://pje.trt5.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt6',  nome: 'TRT 6ª Região (PE)',        sigla: 'TRT6',  segmento: '5', url: 'https://pje.trt6.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt7',  nome: 'TRT 7ª Região (CE)',        sigla: 'TRT7',  segmento: '5', url: 'https://pje.trt7.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt8',  nome: 'TRT 8ª Região (PA/AP)',     sigla: 'TRT8',  segmento: '5', url: 'https://pje.trt8.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt9',  nome: 'TRT 9ª Região (PR)',        sigla: 'TRT9',  segmento: '5', url: 'https://pje.trt9.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt10', nome: 'TRT 10ª Região (DF/TO)',    sigla: 'TRT10', segmento: '5', url: 'https://pje.trt10.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt11', nome: 'TRT 11ª Região (AM/RR)',    sigla: 'TRT11', segmento: '5', url: 'https://pje.trt11.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt12', nome: 'TRT 12ª Região (SC)',       sigla: 'TRT12', segmento: '5', url: 'https://pje.trt12.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt13', nome: 'TRT 13ª Região (PB)',       sigla: 'TRT13', segmento: '5', url: 'https://pje.trt13.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt14', nome: 'TRT 14ª Região (RO/AC)',    sigla: 'TRT14', segmento: '5', url: 'https://pje.trt14.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt15', nome: 'TRT 15ª Região (Campinas)', sigla: 'TRT15', segmento: '5', url: 'https://pje.trt15.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt16', nome: 'TRT 16ª Região (MA)',       sigla: 'TRT16', segmento: '5', url: 'https://pje.trt16.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt17', nome: 'TRT 17ª Região (ES)',       sigla: 'TRT17', segmento: '5', url: 'https://pje.trt17.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt18', nome: 'TRT 18ª Região (GO)',       sigla: 'TRT18', segmento: '5', url: 'https://pje.trt18.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt19', nome: 'TRT 19ª Região (AL)',       sigla: 'TRT19', segmento: '5', url: 'https://pje.trt19.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt20', nome: 'TRT 20ª Região (SE)',       sigla: 'TRT20', segmento: '5', url: 'https://pje.trt20.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt21', nome: 'TRT 21ª Região (RN)',       sigla: 'TRT21', segmento: '5', url: 'https://pje.trt21.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt22', nome: 'TRT 22ª Região (PI)',       sigla: 'TRT22', segmento: '5', url: 'https://pje.trt22.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt23', nome: 'TRT 23ª Região (MT)',       sigla: 'TRT23', segmento: '5', url: 'https://pje.trt23.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'trt24', nome: 'TRT 24ª Região (MS)',       sigla: 'TRT24', segmento: '5', url: 'https://pje.trt24.jus.br/consultaprocessual/detalhe-processo/{RAW}' },

  // TJs eSAJ
  { id: 'tjsp',   nome: 'TJSP — 1º Grau', sigla: 'TJSP1g',  segmento: '8', url: 'https://esaj.tjsp.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjsp2g', nome: 'TJSP — 2º Grau', sigla: 'TJSP2g',  segmento: '8', url: 'https://esaj.tjsp.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjspeproc', nome: 'TJSP — eProc', sigla: 'TJSP-e', segmento: '826', url: 'https://eproc-consulta.tjsp.jus.br/consulta_1g/externo_controlador.php?acao=processo_consulta_publica&num_processo={CNJ}' },
  { id: 'tjsc',   nome: 'TJSC — 1º Grau', sigla: 'TJSC1g',  segmento: '8', url: 'https://esaj.tjsc.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjsc2g', nome: 'TJSC — 2º Grau', sigla: 'TJSC2g',  segmento: '8', url: 'https://esaj.tjsc.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjba',   nome: 'TJBA — 1º Grau', sigla: 'TJBA1g',  segmento: '8', url: 'https://esaj.tjba.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjba2g', nome: 'TJBA — 2º Grau', sigla: 'TJBA2g',  segmento: '8', url: 'https://esaj.tjba.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjce',   nome: 'TJCE — 1º Grau', sigla: 'TJCE1g',  segmento: '8', url: 'https://esaj.tjce.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjce2g', nome: 'TJCE — 2º Grau', sigla: 'TJCE2g',  segmento: '8', url: 'https://esaj.tjce.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjam',   nome: 'TJAM — 1º Grau', sigla: 'TJAM1g',  segmento: '8', url: 'https://consultasaj.tjam.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjam2g', nome: 'TJAM — 2º Grau', sigla: 'TJAM2g',  segmento: '8', url: 'https://consultasaj.tjam.jus.br/cposg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsultaNuUnificado={CNJ}&dadosConsulta.tipoNuProcesso=UNIFICADO' },
  { id: 'tjms',   nome: 'TJMS — 1º Grau', sigla: 'TJMS1g',  segmento: '8', url: 'https://esaj.tjms.jus.br/cpopg5/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjms2g', nome: 'TJMS — 2º Grau', sigla: 'TJMS2g',  segmento: '8', url: 'https://esaj.tjms.jus.br/cposg5/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjal',   nome: 'TJAL — 1º Grau', sigla: 'TJAL1g',  segmento: '8', url: 'https://www2.tjal.jus.br/cpopg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjal2g', nome: 'TJAL — 2º Grau', sigla: 'TJAL2g',  segmento: '8', url: 'https://www2.tjal.jus.br/cposg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjrn',   nome: 'TJRN — 1º Grau', sigla: 'TJRN1g',  segmento: '8', url: 'https://esaj.tjrn.jus.br/cpopg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjrn2g', nome: 'TJRN — 2º Grau', sigla: 'TJRN2g',  segmento: '8', url: 'https://esaj.tjrn.jus.br/cposg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjac',   nome: 'TJAC — 1º Grau', sigla: 'TJAC1g',  segmento: '8', url: 'https://esaj.tjac.jus.br/cpopg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  { id: 'tjac2g', nome: 'TJAC — 2º Grau', sigla: 'TJAC2g',  segmento: '8', url: 'https://esaj.tjac.jus.br/cposg/show.do?processo.numero={CNJ}&cbPesquisa=NUMPROC' },
  // TJs URL direta
  { id: 'tjrj',  nome: 'TJRJ',  sigla: 'TJRJ',  segmento: '8', url: 'https://www3.tjrj.jus.br/ejuris/ImpConsultarAndamento.aspx?codbztrf={CNJ}&numProcesso={CNJ}' },
  { id: 'tjmg',  nome: 'TJMG',  sigla: 'TJMG',  segmento: '8', url: 'https://www4.tjmg.jus.br/juridico/sf/proc_resultado2.jsp?listaProcessos={CNJ}' },
  { id: 'tjmgeproc', nome: 'TJMG — eProc 1º Grau', sigla: 'TJMG-e', segmento: '813', url: 'https://eproc-consulta-publica-1g.tjmg.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica&num_processo={CNJ}' },
  { id: 'tjrs',  nome: 'TJRS',  sigla: 'TJRS',  segmento: '8', url: 'https://www.tjrs.jus.br/novo/buscas-solr/?q={CNJ}&aba=jurisprudencia&tipo=consulta_por_numero' },
  { id: 'tjpr',  nome: 'TJPR',  sigla: 'TJPR',  segmento: '8', url: 'https://projudi.tjpr.jus.br/projudi/processo.do?acao=consultarProcessoPublico&numeroProcesso={CNJ}' },
  { id: 'tjgo',  nome: 'TJGO',  sigla: 'TJGO',  segmento: '8', url: 'https://projudi.tjgo.jus.br/BuscaProcesso?PaginaAtual=2&NumeroCNJ={CNJ}' },
  { id: 'tjpe',  nome: 'TJPE',  sigla: 'TJPE',  segmento: '8', url: 'https://srv01.tjpe.jus.br/consultaprocessualunificada/processo/{CNJ}' },
  { id: 'tjpa',  nome: 'TJPA',  sigla: 'TJPA',  segmento: '8', url: 'https://libra.tjpa.jus.br/LIBRA/html/consultaProcesso/consultarProcesso.seam?PN={CNJ}' },
  { id: 'tjse',  nome: 'TJSE',  sigla: 'TJSE',  segmento: '8', url: 'https://www.tjse.jus.br/portal/consultas/consulta-processual?numeroProcesso={CNJ}' },
  { id: 'tjdft', nome: 'TJDFT', sigla: 'TJDFT', segmento: '8', url: 'https://www.tjdft.jus.br/consultas/processual/consultaprocessual/pesquisar?numero={CNJ}' },
  { id: 'tjto',  nome: 'TJTO',  sigla: 'TJTO',  segmento: '8', url: 'https://eproc1.tjto.jus.br/eprocV2_prod_1grau/externo_controlador.php?acao=processo_consulta_publica&num_processo={CNJ}' },
  { id: 'tjes',  nome: 'TJES',  sigla: 'TJES',  segmento: '8', url: 'https://sistemas.tjes.jus.br/ediario/index.php/component/ediario/?view=processos&consulta={CNJ}' },
  // TJs PJe
  { id: 'tjma', nome: 'TJMA', sigla: 'TJMA', segmento: '8', url: 'https://pje.tjma.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjmt', nome: 'TJMT', sigla: 'TJMT', segmento: '8', url: 'https://pje.tjmt.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjpb', nome: 'TJPB', sigla: 'TJPB', segmento: '8', url: 'https://pje.tjpb.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjpi', nome: 'TJPI', sigla: 'TJPI', segmento: '8', url: 'https://pje.tjpi.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjrr', nome: 'TJRR', sigla: 'TJRR', segmento: '8', url: 'https://pje.tjrr.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjro', nome: 'TJRO', sigla: 'TJRO', segmento: '8', url: 'https://pje.tjro.jus.br/consultaprocessual/detalhe-processo/{RAW}' },
  { id: 'tjap', nome: 'TJAP', sigla: 'TJAP', segmento: '8', url: 'https://projudi.tjap.jus.br/projudi/processo.do?acao=consultarProcessoPublico&numeroProcesso={CNJ}' },
]

// Índice para lookup rápido por id
export const TRIBS_MAP = Object.fromEntries(TRIBS.map(t => [t.id, t]))
