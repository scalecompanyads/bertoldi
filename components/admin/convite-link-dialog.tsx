'use client'

import { useState } from 'react'
import { Copy, Check, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function ConviteLinkDialog({
  link,
  email,
  onClose,
}: {
  link: string | null
  email?: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function copiar() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Link copiado.')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={Boolean(link)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Link de acesso do cliente
          </DialogTitle>
          <DialogDescription>
            O e-mail automático não pôde ser enviado (configure SMTP no Supabase para habilitar).
            {email ? (
              <> Envie este link manualmente para <strong>{email}</strong>.</>
            ) : (
              ' Envie este link manualmente ao cliente.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value={link ?? ''} className="text-xs font-mono" />
          <Button type="button" variant="outline" size="icon" onClick={copiar}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <DialogFooter className="border-t-0 bg-transparent p-0 pt-2">
          <Button type="button" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
