// Tradução de juridiquês (item 3.1 do MELHORIAS.md).
// De-para dos movimentos processuais mais comuns da TPU (Tabelas Processuais
// Unificadas do CNJ) para linguagem que o cliente entende. O advogado continua
// vendo o texto técnico; o cliente vê a versão simples.
//
// Fonte dos códigos: TPU/CNJ (https://www.cnj.jus.br/sgt/consulta_publica_movimentos.php)

const TRADUCAO_POR_CODIGO: Record<number, string> = {
  26:    'O processo foi distribuído e passou a tramitar na justiça.',
  36:    'O processo foi redistribuído para outra vara ou juiz.',
  48:    'O caso foi escalado para análise em instância superior.',
  51:    'O processo está com o juiz para análise.',
  60:    'Um documento foi expedido pelo tribunal.',
  67:    'Uma das partes foi oficialmente comunicada sobre o processo (citação).',
  85:    'Foi apresentada uma petição no processo.',
  92:    'Foi publicada uma comunicação oficial no diário da justiça.',
  106:   'Uma decisão do processo foi tornada pública oficialmente.',
  118:   'O processo foi encaminhado para outro setor do tribunal.',
  123:   'O processo está aguardando julgamento de recurso.',
  132:   'O tribunal recebeu um recurso apresentado no processo.',
  193:   'O processo foi arquivado em definitivo.',
  246:   'O processo foi arquivado definitivamente.',
  22:    'O processo foi baixado em definitivo (encerrado nesta instância).',
  228:   'A decisão transitou em julgado — não cabe mais recurso.',
  848:   'O tribunal deu andamento a um pedido feito no processo.',
  861:   'Foi marcada uma audiência.',
  863:   'A audiência marcada foi realizada.',
  866:   'A audiência foi cancelada.',
  871:   'O processo foi suspenso temporariamente ou está aguardando uma providência.',
  893:   'O processo saiu do arquivo para novo andamento (desarquivado).',
  898:   'Os autos foram entregues em carga para uma das partes.',
  962:   'Os autos foram devolvidos ao tribunal.',
  977:   'Houve uma tentativa de conciliação entre as partes.',
  978:   'As partes chegaram a um acordo (homologação de transação).',
  11009: 'O réu/executado foi intimado a cumprir a decisão.',
  11010: 'O tribunal registrou um novo documento nos autos (juntada).',
  11383: 'O processo aguarda decisão de tema com repercussão geral em tribunal superior.',
  12100: 'Foi realizado um leilão/hasta pública de bens do processo.',
  14732: 'A parte foi intimada eletronicamente.',
  12265: 'Foi feita uma penhora de bens ou valores.',
  123105:'O processo está aguardando manifestação de uma das partes.',
  // Sentenças e decisões (categoria 193xx / julgamentos)
  198:   'O juiz proferiu uma decisão no processo.',
  219:   'O pedido foi julgado procedente — decisão favorável ao autor.',
  220:   'O pedido foi julgado improcedente — decisão desfavorável ao autor.',
  221:   'O pedido foi julgado parcialmente procedente — decisão favorável em parte.',
  235:   'O caso foi extinto sem julgamento do mérito (questão processual).',
  236:   'O caso foi extinto com base em acordo, pagamento ou renúncia.',
  240:   'O processo foi extinto por desistência da parte autora.',
  385:   'Foi concedida uma liminar ou tutela de urgência.',
  409:   'O pedido de liminar ou tutela de urgência foi negado.',
  466:   'O juiz homologou o acordo firmado entre as partes.',
  471:   'O recurso não foi aceito pelo tribunal.',
  237:   'O recurso foi julgado — houve decisão da instância superior.',
  242:   'O tribunal deu provimento ao recurso (mudou a decisão anterior).',
  243:   'O tribunal negou provimento ao recurso (manteve a decisão anterior).',
  11373: 'A execução foi suspensa ou o processo está sobrestado.',
  11975: 'O pagamento foi registrado nos autos.',
}

// Fallback para verificações antigas gravadas sem o código: casa pelo início
// do nome técnico do movimento (minúsculas, sem acento)
const TRADUCAO_POR_NOME: [string, string][] = [
  ['conclusos', 'O processo está com o juiz para análise.'],
  ['conclusao', 'O processo está com o juiz para análise.'],
  ['distribuicao', 'O processo foi distribuído e passou a tramitar na justiça.'],
  ['distribuido', 'O processo foi distribuído e passou a tramitar na justiça.'],
  ['juntada', 'O tribunal registrou um novo documento nos autos.'],
  ['expedicao', 'Um documento foi expedido pelo tribunal.'],
  ['publicacao', 'Foi publicada uma comunicação oficial no diário da justiça.'],
  ['disponibilizacao', 'Uma comunicação do processo foi disponibilizada no diário da justiça.'],
  ['citacao', 'Uma das partes foi oficialmente comunicada sobre o processo.'],
  ['intimacao', 'Uma das partes foi notificada sobre um ato do processo.'],
  ['peticao', 'Foi apresentada uma petição no processo.'],
  ['protocolo de peticao', 'Foi apresentada uma petição no processo.'],
  ['audiencia realizada', 'A audiência marcada foi realizada.'],
  ['audiencia cancelada', 'A audiência foi cancelada.'],
  ['audiencia', 'Foi marcada uma audiência.'],
  ['designacao de audiencia', 'Foi marcada uma audiência.'],
  ['sentenca', 'O juiz proferiu a sentença — decisão que encerra esta fase do processo.'],
  ['julgamento', 'O caso foi julgado.'],
  ['procedencia em parte', 'O pedido foi julgado parcialmente procedente — decisão favorável em parte.'],
  ['procedencia', 'O pedido foi julgado procedente — decisão favorável ao autor.'],
  ['improcedencia', 'O pedido foi julgado improcedente — decisão desfavorável ao autor.'],
  ['decisao', 'O juiz proferiu uma decisão no processo.'],
  ['despacho', 'O juiz deu uma ordem de andamento no processo.'],
  ['ato ordinatorio', 'O cartório deu um andamento de rotina no processo.'],
  ['remessa', 'O processo foi encaminhado para outro setor do tribunal.'],
  ['recebimento', 'O processo foi recebido pelo setor de destino no tribunal.'],
  ['transito em julgado', 'A decisão transitou em julgado — não cabe mais recurso.'],
  ['transitado em julgado', 'A decisão transitou em julgado — não cabe mais recurso.'],
  ['arquivamento', 'O processo foi arquivado.'],
  ['arquivado', 'O processo foi arquivado.'],
  ['desarquivamento', 'O processo saiu do arquivo para novo andamento.'],
  ['baixa definitiva', 'O processo foi encerrado nesta instância.'],
  ['suspensao', 'O processo foi suspenso temporariamente.'],
  ['sobrestamento', 'O processo está aguardando a decisão de outro caso para prosseguir.'],
  ['carga', 'Os autos foram entregues em carga para uma das partes.'],
  ['devolucao', 'Os autos foram devolvidos ao tribunal.'],
  ['penhora', 'Foi feita uma penhora de bens ou valores.'],
  ['leilao', 'Foi realizado um leilão de bens do processo.'],
  ['pagamento', 'Um pagamento foi registrado no processo.'],
  ['homologacao de transacao', 'As partes chegaram a um acordo, homologado pelo juiz.'],
  ['homologacao', 'O juiz homologou um ato ou acordo do processo.'],
  ['embargos', 'Foi apresentado um recurso pedindo esclarecimento ou revisão da decisão.'],
  ['recurso', 'Foi apresentado ou julgado um recurso no processo.'],
  ['provimento', 'O tribunal deu provimento ao recurso (mudou a decisão anterior).'],
  ['nao provimento', 'O tribunal negou o recurso (manteve a decisão anterior).'],
  ['liminar', 'Houve decisão sobre pedido de liminar (urgência).'],
  ['tutela', 'Houve decisão sobre pedido de tutela de urgência.'],
  ['extincao da execucao', 'A cobrança judicial foi encerrada.'],
  ['extincao', 'O processo foi extinto.'],
  ['redistribuicao', 'O processo foi redistribuído para outra vara ou juiz.'],
]

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Versão em linguagem simples do movimento, ou null quando não há tradução
// (aí a tela mostra só o texto técnico)
export function traduzirMovimento(codigo?: number | null, nome?: string | null): string | null {
  if (codigo != null && TRADUCAO_POR_CODIGO[codigo]) return TRADUCAO_POR_CODIGO[codigo]
  if (!nome) return null
  const n = normalizar(nome)
  for (const [chaveNome, traducao] of TRADUCAO_POR_NOME) {
    if (n.includes(chaveNome)) return traducao
  }
  return null
}
