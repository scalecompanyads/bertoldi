'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ArchiveRestore } from 'lucide-react'
import { toast } from 'sonner'
import { arquivarCliente, restaurarCliente } from '@/lib/actions/clientes'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Cliente } from '@/lib/types'

export function ClienteArquivarBtn({ cliente }: { cliente: Cliente }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const result = cliente.arquivado
      ? await restaurarCliente(cliente.id)
      : await arquivarCliente(cliente.id)

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success(cliente.arquivado ? 'Cliente restaurado.' : 'Cliente arquivado.')
      setOpen(false)
      if (!cliente.arquivado) {
        router.push('/admin/clientes?ver=arquivados')
      } else {
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        {cliente.arquivado ? (
          <>
            <ArchiveRestore className="h-3.5 w-3.5" />
            Restaurar cliente
          </>
        ) : (
          <>
            <Archive className="h-3.5 w-3.5" />
            Arquivar cliente
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={!loading}>
          <DialogHeader>
            <DialogTitle>
              {cliente.arquivado ? 'Restaurar cliente?' : 'Arquivar cliente?'}
            </DialogTitle>
            <DialogDescription>
              {cliente.arquivado ? (
                <>
                  <strong>{cliente.nome}</strong> voltará a aparecer na listagem principal de clientes.
                </>
              ) : (
                <>
                  <strong>{cliente.nome}</strong> será ocultado da listagem principal. Processos e
                  documentos permanecem salvos e podem ser consultados em Arquivados.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t-0 bg-transparent p-0 pt-2 sm:justify-end">
            <Button type="button" variant="outline" disabled={loading} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={cliente.arquivado ? 'default' : 'destructive'}
              disabled={loading}
              onClick={handleConfirm}
            >
              {loading
                ? 'Salvando...'
                : cliente.arquivado
                  ? 'Restaurar'
                  : 'Arquivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
