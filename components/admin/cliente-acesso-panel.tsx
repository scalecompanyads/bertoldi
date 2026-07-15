'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { enviarConviteAcesso } from '@/lib/actions/cliente-acesso'
import { ConviteLinkDialog } from '@/components/admin/convite-link-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Cliente } from '@/lib/types'

const STORAGE_KEY = 'bertoldi_convite_link'

export function ClienteAcessoPanel({ cliente }: { cliente: Cliente }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [linkConvite, setLinkConvite] = useState<string | null>(null)

  const temAcesso = Boolean(cliente.usuario_id)
  const podeConvidar = Boolean(cliente.email?.trim() && cliente.cpf_cnpj?.trim())

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      setLinkConvite(stored)
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  async function handleConvite() {
    setLoading(true)
    const result = await enviarConviteAcesso(cliente.id)

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else if ('ok' in result && result.ok) {
      if (result.emailEnviado) {
        toast.success(result.message)
      } else {
        toast.warning(result.message)
      }
      if (result.linkConvite) {
        setLinkConvite(result.linkConvite)
      }
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <div className="rounded-lg border p-4 space-y-3 max-w-lg">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Acesso à área do cliente</h3>
          {temAcesso ? (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              Ativo
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <ShieldOff className="h-3 w-3" />
              Pendente
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {temAcesso
            ? 'O cliente pode entrar com CPF e senha. Reenvie o link se ele precisar redefinir a senha.'
            : 'Crie a conta de acesso e envie o link para o cliente definir a senha.'}
        </p>

        {!podeConvidar && (
          <p className="text-xs text-amber-600 dark:text-amber-500">
            Cadastre e-mail e CPF válidos nos dados do cliente para liberar o acesso.
          </p>
        )}

        <Button
          type="button"
          variant={temAcesso ? 'outline' : 'default'}
          size="sm"
          disabled={loading || !podeConvidar}
          onClick={handleConvite}
          className="gap-1.5"
        >
          <Mail className="h-3.5 w-3.5" />
          {loading
            ? 'Processando...'
            : temAcesso
              ? 'Gerar link de senha'
              : 'Criar acesso e gerar link'}
        </Button>
      </div>

      <ConviteLinkDialog
        link={linkConvite}
        email={cliente.email ?? undefined}
        onClose={() => setLinkConvite(null)}
      />
    </>
  )
}

export function salvarLinkConviteNaSessao(link: string) {
  sessionStorage.setItem(STORAGE_KEY, link)
}
