'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { distribuirPeticao } from '@/lib/actions/peticoes'

export function DistribuirPeticaoBtn({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await distribuirPeticao(id, fd)
    setLoading(false)

    if (result?.error) { toast.error(result.error); return }
    toast.success('Petição distribuída! Processo criado.')
    setOpen(false)
    if (result.processoId) {
      router.push(`/admin/processos/${result.processoId}`)
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => setOpen(true)}>
        <Send className="h-3 w-3 mr-1" />
        Distribuir
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Distribuir petição</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Preencha os dados do processo recém-distribuído. Um processo será criado automaticamente.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="numero_cnj">Número CNJ</Label>
              <Input
                id="numero_cnj"
                name="numero_cnj"
                placeholder="0000000-00.0000.0.00.0000"
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tribunal">Tribunal</Label>
              <Input
                id="tribunal"
                name="tribunal"
                placeholder="Ex: TJSP, TRT15, TRF3..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vara_orgao">Vara / Órgão</Label>
              <Input
                id="vara_orgao"
                name="vara_orgao"
                placeholder="Ex: 1ª Vara Cível de Presidente Epitácio"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="parte_autora">Parte autora</Label>
              <Input
                id="parte_autora"
                name="parte_autora"
                placeholder="Nome do autor / requerente"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Send className="h-4 w-4 mr-1" />
                {loading ? 'Distribuindo...' : 'Distribuir e criar processo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
