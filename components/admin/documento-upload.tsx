'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload, X, Eye, EyeOff, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { uploadDocumento, removerDocumento, toggleVisibilidadeDocumento } from '@/lib/actions/documentos'
import { TIPO_DOCUMENTO_LABEL } from '@/lib/types'
import type { Documento } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface UploadProps {
  processoId: string
  clienteId: string
}

export function DocumentoUpload({ processoId, clienteId }: UploadProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState('outro')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('tipo', tipo)

    const result = await uploadDocumento(processoId, clienteId, fd)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Documento enviado.')
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      setTipo('outro')
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-1" />
        Enviar documento
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-3">
      <p className="text-sm font-medium">Enviar documento</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="arquivo">Arquivo *</Label>
          <input
            ref={inputRef}
            id="arquivo"
            name="arquivo"
            type="file"
            required
            className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-border file:text-xs file:bg-transparent file:cursor-pointer cursor-pointer"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v ?? 'outro')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TIPO_DOCUMENTO_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <input type="hidden" name="visivel_cliente" value="false" />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>{loading ? 'Enviando...' : 'Enviar'}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  )
}

export function DocumentoItem({ doc, clienteId }: { doc: Documento; clienteId: string }) {
  const [loading, setLoading] = useState(false)
  const [visivel, setVisivel] = useState(doc.visivel_cliente)

  async function toggleVisivel() {
    setLoading(true)
    const novoVisivel = !visivel
    const result = await toggleVisibilidadeDocumento(doc.id, novoVisivel, doc.processo_id, clienteId)
    if (result.error) toast.error(result.error)
    else setVisivel(novoVisivel)
    setLoading(false)
  }

  async function handleRemover() {
    if (!confirm(`Remover "${doc.nome_arquivo}"?`)) return
    setLoading(true)
    const result = await removerDocumento(doc.id, doc.url_storage, doc.processo_id, clienteId)
    if (result.error) toast.error(result.error)
    else toast.success('Documento removido.')
    setLoading(false)
  }

  async function handleDownload() {
    const supabase = createClient()
    const { data } = await supabase.storage.from('documentos').createSignedUrl(doc.url_storage, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{doc.nome_arquivo}</p>
        <p className="text-xs text-muted-foreground">{TIPO_DOCUMENTO_LABEL[doc.tipo]}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggleVisivel}
          disabled={loading}
          className={`p-1.5 rounded text-xs transition-colors ${
            visivel ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
          title={visivel ? 'Visível ao cliente — clique para ocultar' : 'Oculto — clique para tornar visível'}
        >
          {visivel ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
        <button onClick={handleDownload} className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Baixar">
          <Download className="h-3.5 w-3.5" />
        </button>
        <button onClick={handleRemover} disabled={loading} className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors" title="Remover">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
