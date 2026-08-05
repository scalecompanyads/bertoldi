export type PapelUsuario = 'admin' | 'advogado' | 'secretaria' | 'cliente'
export type StatusProcesso = 'triagem' | 'em_analise' | 'distribuido' | 'em_andamento' | 'concluido'
export type StatusServico = 'ativo' | 'concluido' | 'cancelado'
export type TipoDocumento = 'contrato' | 'peticao' | 'procuracao' | 'comprovante' | 'decisao' | 'outro'
export type OrigemVerificacao = 'automatica' | 'manual'

export interface Usuario {
  id: string
  nome: string
  email: string
  papel: PapelUsuario
  oab_numero: string | null
  oab_uf: string | null
  foto_path: string | null
  criado_em: string
}

export interface Cliente {
  id: string
  usuario_id: string | null
  nome: string
  cpf_cnpj: string | null
  telefone: string | null
  email: string | null
  arquivado: boolean
  arquivado_em: string | null
  arquivado_por: string | null
  criado_em: string
  atualizado_em: string | null
  atualizado_por: string | null
}

export interface ServicoContratado {
  id: string
  cliente_id: string
  tipo_servico: string
  data_contratacao: string
  status: StatusServico
  criado_em: string
}

export interface Processo {
  id: string
  cliente_id: string
  responsavel_id: string | null
  numero_cnj: string | null
  tribunal: string | null
  vara_orgao: string | null
  tipo_servico: string
  parte_autora: string | null
  parte_re: string | null
  outras_partes: string | null
  assunto: string | null
  valor_causa: number | null
  data_ajuizamento: string | null
  cidade_origem: string | null
  calendario_forense_id: string | null
  notificar_cliente: boolean
  status_interno: StatusProcesso
  data_contratacao: string
  criado_em: string
  atualizado_em: string | null
  atualizado_por: string | null
  clientes?: Pick<Cliente, 'id' | 'nome'>
  responsavel?: Pick<Usuario, 'id' | 'nome'>
}

export interface EventoLinhaDotTempo {
  id: string
  processo_id: string
  data_evento: string
  descricao: string
  visivel_cliente: boolean
  criado_por: string
  criado_em: string
  autor?: Pick<Usuario, 'id' | 'nome'>
}

export interface Documento {
  id: string
  processo_id: string
  nome_arquivo: string
  url_storage: string
  tipo: TipoDocumento
  visivel_cliente: boolean
  enviado_por: string
  criado_em: string
}

export interface Observacao {
  id: string
  processo_id: string
  texto: string
  visivel_cliente: boolean
  autor_id: string
  criado_em: string
  autor?: Pick<Usuario, 'id' | 'nome'>
}

// Labels para exibição
export const STATUS_PROCESSO_LABEL: Record<StatusProcesso, string> = {
  triagem: 'Triagem',
  em_analise: 'Em análise',
  distribuido: 'Distribuído',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}

export const STATUS_SERVICO_LABEL: Record<StatusServico, string> = {
  ativo: 'Ativo',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export const TIPO_DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
  contrato: 'Contrato',
  peticao: 'Petição',
  procuracao: 'Procuração',
  comprovante: 'Comprovante',
  decisao: 'Decisão',
  outro: 'Outro',
}

export type StatusTarefa = 'a_fazer' | 'em_andamento' | 'aguardando' | 'concluido'

export interface Tarefa {
  id: string
  usuario_id: string
  processo_id: string | null
  titulo: string
  descricao: string | null
  status: StatusTarefa
  prazo: string | null
  ordem: number
  concluida_em: string | null
  prazo_contexto: PrazoContexto | null
  criado_em: string
  processo?: Pick<Processo, 'id' | 'cliente_id' | 'numero_cnj' | 'tipo_servico'> & {
    clientes?: Pick<Cliente, 'id' | 'nome'>
  } | null
}

export interface PrazoContexto {
  calendario_id: string | null
  versao_id: string | null
  versao: number | null
  calendario_nome: string
  fonte_url: string | null
  dias_uteis: number
  vencimento_sugerido: string | null
  ajuste_manual: boolean
}

export type EscopoCalendario = 'estadual' | 'municipal' | 'tribunal' | 'comarca'
export type StatusVersaoCalendario = 'rascunho' | 'publicado' | 'substituido'
export type TipoDiaNaoUtil = 'feriado_estadual' | 'feriado_municipal' | 'recesso' | 'suspensao' | 'ponto_facultativo'

export interface CalendarioForenseDia {
  id: string
  versao_id: string
  data_inicio: string
  data_fim: string
  tipo: TipoDiaNaoUtil
  descricao: string
  criado_em: string
}

export interface CalendarioForenseVersao {
  id: string
  calendario_id: string
  versao: number
  status: StatusVersaoCalendario
  vigencia_inicio: string
  vigencia_fim: string
  fonte_url: string
  fonte_descricao: string
  criado_em: string
  publicado_em: string | null
  dias?: CalendarioForenseDia[]
}

export interface CalendarioForense {
  id: string
  nome: string
  escopo: EscopoCalendario
  uf: string
  comarca: string | null
  tribunal: string | null
  ativo: boolean
  versao_ativa_id: string | null
  criado_em: string
  versao_ativa?: CalendarioForenseVersao | null
  versoes?: CalendarioForenseVersao[]
}

export const STATUS_TAREFA_LABEL: Record<StatusTarefa, string> = {
  a_fazer: 'A fazer',
  em_andamento: 'Em andamento',
  aguardando: 'Aguardando',
  concluido: 'Concluído',
}

export interface Comunicado {
  id: string
  cliente_id: string | null
  titulo: string
  mensagem: string
  enviado_em: string
  lido: boolean // legado; novas leituras ficam em ComunicadoDestinatario.lido_em
  cliente?: Pick<Cliente, 'id' | 'nome'> | null
}

export interface ComunicadoDestinatario {
  comunicado_id: string
  cliente_id: string
  lido_em: string | null
  email_enviado_em: string | null
  criado_em: string
  comunicado?: Comunicado
}

export type StatusIntimacao = 'nao_lida' | 'lida' | 'tratada'

export interface Intimacao {
  id: string
  comunica_id: number
  advogado_id: string | null
  processo_id: string | null
  numero_cnj: string | null
  sigla_tribunal: string | null
  tipo_comunicacao: string | null
  nome_orgao: string | null
  nome_classe: string | null
  meio: string | null
  link: string | null
  texto: string | null
  data_disponibilizacao: string
  status: StatusIntimacao
  criado_em: string
  advogado?: Pick<Usuario, 'id' | 'nome'> | null
  processo?: (Pick<Processo, 'id' | 'cliente_id' | 'tipo_servico' | 'calendario_forense_id'> & {
    clientes?: Pick<Cliente, 'id' | 'nome'>
    calendario?: CalendarioForense | null
  }) | null
}

export const STATUS_INTIMACAO_LABEL: Record<StatusIntimacao, string> = {
  nao_lida: 'Não lida',
  lida: 'Lida',
  tratada: 'Tratada',
}

export type TipoAudiencia = 'conciliacao' | 'instrucao' | 'julgamento' | 'una' | 'justificacao' | 'outra'

export interface Audiencia {
  id: string
  processo_id: string | null
  tipo: TipoAudiencia
  data_hora: string
  local: string | null
  link_video: string | null
  observacoes: string | null
  criado_por: string | null
  criado_em: string
  atualizado_em: string | null
  processo?: (Pick<Processo, 'id' | 'cliente_id' | 'numero_cnj' | 'tipo_servico'> & {
    clientes?: Pick<Cliente, 'id' | 'nome'>
  }) | null
}

export const TIPO_AUDIENCIA_LABEL: Record<TipoAudiencia, string> = {
  conciliacao: 'Conciliação',
  instrucao: 'Instrução',
  julgamento: 'Julgamento',
  una: 'Una',
  justificacao: 'Justificação',
  outra: 'Outra',
}
