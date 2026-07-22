'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Loader2, Download, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { validarFormatoCNJ, formatarNumeroCNJ } from '@/lib/cnj-parser'
import { isValidCpf, normalizeCpfDigits } from '@/lib/cpf'
import { importarLote, type LinhaImportacao, type ResultadoLinha } from '@/lib/actions/importacao'
import { useRouter } from 'next/navigation'

interface LinhaPrevia extends LinhaImportacao {
  linha: number
  problema?: string
}

// Aceita ; , ou tab como separador — planilhas brasileiras exportam com ;
function detectarSeparador(linha: string): string {
  if (linha.includes('\t')) return '\t'
  if (linha.includes(';')) return ';'
  return ','
}

// Modelo para preencher no Excel: BOM UTF-8 (acentos corretos) e separador ;
// (padrão do Excel em português). As linhas de exemplo são removidas pelo usuário.
function baixarModelo() {
  const linhas = [
    'numero_cnj;cpf_cnpj_cliente;nome_cliente;tipo_servico',
    '0001234-56.2024.8.24.0001;123.456.789-09;Maria da Silva;Ação trabalhista',
    '0007890-12.2023.8.24.0023;98.765.432/0001-10;Padaria Pão Bom Ltda;Consultoria empresarial',
  ]
  const blob = new Blob(['\uFEFF' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'modelo-importacao-processos.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function parseCsv(texto: string): LinhaPrevia[] {
  const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (!linhas.length) return []

  const sep = detectarSeparador(linhas[0])

  // Cabeçalho: primeira linha sem nenhum número CNJ reconhecível
  const primeiraColunas = linhas[0].split(sep)
  const temCabecalho = !validarFormatoCNJ(formatarNumeroCNJ(primeiraColunas[0]?.trim() ?? ''))
  const dados = temCabecalho ? linhas.slice(1) : linhas

  return dados.map((l, i) => {
    const [cnj = '', cpf = '', nome = '', tipo = ''] = l.split(sep).map(c => c.trim().replace(/^"|"$/g, ''))
    const numeroCnj = formatarNumeroCNJ(cnj)
    const doc = normalizeCpfDigits(cpf)

    let problema: string | undefined
    if (!validarFormatoCNJ(numeroCnj)) problema = 'Número CNJ inválido'
    else if (doc.length === 11 && !isValidCpf(doc)) problema = 'CPF inválido'
    else if (doc.length !== 11 && doc.length !== 14) problema = 'CPF/CNPJ deve ter 11 ou 14 dígitos'
    else if (!tipo) problema = 'Tipo de serviço vazio'

    return {
      linha: i + 1,
      numero_cnj: numeroCnj,
      cpf_cnpj: cpf,
      nome,
      tipo_servico: tipo,
      problema,
    }
  })
}

export function ImportacaoForm() {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [arrastando, setArrastando] = useState(false)
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [resultados, setResultados] = useState<ResultadoLinha[] | null>(null)

  const previa = useMemo(() => parseCsv(texto), [texto])
  const validas = previa.filter(l => !l.problema)
  const invalidas = previa.filter(l => l.problema)

  async function carregarArquivo(file: File | undefined) {
    if (!file) return
    if (!/\.(csv|txt)$/i.test(file.name)) {
      toast.error('Escolha um arquivo .csv (exporte pelo Excel como "CSV UTF-8").')
      return
    }
    setResultados(null)
    setNomeArquivo(file.name)
    setTexto(await file.text())
  }

  async function lerArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    await carregarArquivo(e.target.files?.[0])
    e.target.value = ''
  }

  async function soltarArquivo(e: React.DragEvent) {
    e.preventDefault()
    setArrastando(false)
    await carregarArquivo(e.dataTransfer.files?.[0])
  }

  async function importar() {
    if (!validas.length) return
    setEnviando(true)
    setResultados(null)

    const res = await importarLote(
      validas.map(({ numero_cnj, cpf_cnpj, nome, tipo_servico }) => ({ numero_cnj, cpf_cnpj, nome, tipo_servico }))
    )

    if (res.error) {
      toast.error(res.error)
    } else {
      setResultados(res.resultados ?? [])
      setTexto('')
      setNomeArquivo(null)
      toast.success(
        `${res.criados} ${res.criados === 1 ? 'processo criado' : 'processos criados'}` +
        (res.clientesNovos ? ` (${res.clientesNovos} ${res.clientesNovos === 1 ? 'cliente novo' : 'clientes novos'})` : '') +
        (res.duplicados ? `, ${res.duplicados} já cadastrados` : '') +
        (res.erros ? `, ${res.erros} com erro` : '')
      )
      router.refresh()
    }
    setEnviando(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-semibold">Planilha (CSV)</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={baixarModelo}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar modelo CSV
            </button>
            <Dialog>
              <DialogTrigger
                aria-label="Como preencher a planilha"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Como preencher a planilha</DialogTitle>
                </DialogHeader>
                <div className="text-sm text-muted-foreground space-y-3">
                  <p>
                    Baixe o modelo, abra no Excel e preencha <strong>uma linha por processo</strong>, nesta
                    ordem de colunas:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li><strong>Número CNJ</strong> — com ou sem pontuação</li>
                    <li><strong>CPF ou CNPJ do cliente</strong></li>
                    <li><strong>Nome do cliente</strong></li>
                    <li><strong>Tipo de serviço</strong> — ex.: &quot;Ação trabalhista&quot;</li>
                  </ol>
                  <p>Apague as duas linhas de exemplo do modelo antes de importar.</p>
                  <p>
                    O nome só é usado quando o CPF/CNPJ ainda não está cadastrado — se o cliente já
                    existe, os processos são vinculados a ele.
                  </p>
                  <p>
                    No Excel, salve como <strong>CSV</strong> (Arquivo → Salvar como → &quot;CSV
                    UTF-8&quot;). Também dá para colar o conteúdo direto no campo da tela.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <label
          onDragOver={e => { e.preventDefault(); setArrastando(true) }}
          onDragLeave={() => setArrastando(false)}
          onDrop={soltarArquivo}
          className={
            'flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ' +
            (arrastando ? 'border-primary bg-accent' : 'hover:bg-accent/50')
          }
        >
          <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">
            {nomeArquivo ?? 'Arraste o arquivo CSV aqui ou clique para escolher'}
          </span>
          <span className="text-xs text-muted-foreground">
            {nomeArquivo ? 'Clique para trocar de arquivo' : 'Arquivos .csv ou .txt'}
          </span>
          <input type="file" accept=".csv,.txt" className="hidden" onChange={lerArquivo} />
        </label>

        <p className="text-xs text-muted-foreground">Ou cole o conteúdo da planilha:</p>
        <Textarea
          value={texto}
          onChange={e => { setTexto(e.target.value); setResultados(null); setNomeArquivo(null) }}
          rows={6}
          placeholder={'0001234-56.2024.8.24.0001;123.456.789-09;Maria da Silva;Ação trabalhista'}
          className="font-mono text-xs"
        />
      </div>

      {previa.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-semibold">
              Prévia — {previa.length} {previa.length === 1 ? 'linha' : 'linhas'}
              {invalidas.length > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-normal">
                  {' '}({invalidas.length} com problema — serão ignoradas)
                </span>
              )}
            </p>
            <Button size="sm" onClick={importar} disabled={enviando || validas.length === 0}>
              {enviando
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Importando...</>
                : <><Upload className="h-3.5 w-3.5" /> Importar {validas.length} {validas.length === 1 ? 'linha' : 'linhas'}</>}
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr className="text-left">
                  <th className="px-2 py-1.5 font-medium">#</th>
                  <th className="px-2 py-1.5 font-medium">Número CNJ</th>
                  <th className="px-2 py-1.5 font-medium">CPF/CNPJ</th>
                  <th className="px-2 py-1.5 font-medium">Nome</th>
                  <th className="px-2 py-1.5 font-medium">Tipo</th>
                  <th className="px-2 py-1.5 font-medium">Validação</th>
                </tr>
              </thead>
              <tbody>
                {previa.map(l => (
                  <tr key={l.linha} className="border-t">
                    <td className="px-2 py-1.5 text-muted-foreground">{l.linha}</td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">{l.numero_cnj}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{l.cpf_cnpj}</td>
                    <td className="px-2 py-1.5">{l.nome}</td>
                    <td className="px-2 py-1.5">{l.tipo_servico}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      {l.problema
                        ? <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"><XCircle className="h-3 w-3" /> {l.problema}</span>
                        : <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Ok</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resultados && resultados.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-semibold">Resultado da importação</p>
          <div className="max-h-80 overflow-y-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr className="text-left">
                  <th className="px-2 py-1.5 font-medium">#</th>
                  <th className="px-2 py-1.5 font-medium">Número CNJ</th>
                  <th className="px-2 py-1.5 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map(r => (
                  <tr key={`${r.linha}-${r.numero_cnj}`} className="border-t">
                    <td className="px-2 py-1.5 text-muted-foreground">{r.linha}</td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">{r.numero_cnj}</td>
                    <td className="px-2 py-1.5">
                      {r.status === 'criado' && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Criado{r.clienteNovo ? ' (cliente novo)' : ''}
                        </span>
                      )}
                      {r.status === 'duplicado' && (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3" /> {r.mensagem}
                        </span>
                      )}
                      {r.status === 'erro' && (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircle className="h-3 w-3" /> {r.mensagem}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
