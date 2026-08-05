'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { solicitarRecuperacaoSenha } from '@/lib/actions/recuperar-senha'
import { formatCpfInput } from '@/lib/cpf'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Props {
  tipo: 'cliente' | 'equipe'
  onVoltar: () => void
}

export function EsqueciSenhaForm({ tipo, onVoltar }: Props) {
  const [identifier, setIdentifier] = useState('')
  const [useEmail, setUseEmail] = useState(tipo === 'equipe')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await solicitarRecuperacaoSenha(identifier, honeypot)

    if ('error' in res) {
      toast.error(res.error)
      setLoading(false)
      return
    }

    setEnviado(true)
    toast.success(res.message)
    setLoading(false)
  }

  if (enviado) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Se existir uma conta com esses dados, você receberá um e-mail em instantes. Verifique também
          a caixa de spam.
        </p>
        <Button type="button" variant="outline" className="w-full" onClick={onVoltar}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Voltar ao login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {tipo === 'equipe'
          ? 'Informe o e-mail da sua conta. Enviaremos um link seguro para redefinir a senha.'
          : 'Informe o CPF ou e-mail cadastrados. Enviaremos um link seguro para redefinir a senha.'}
      </p>

      {/* Honeypot — invisível para pessoas, bots costumam preencher */}
      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor={`hp-${tipo}`}>Empresa</label>
        <input
          id={`hp-${tipo}`}
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`recuperar-${tipo}`}>
          {tipo === 'equipe' || useEmail ? 'E-mail' : 'CPF'}
        </Label>
        <Input
          id={`recuperar-${tipo}`}
          type={tipo === 'equipe' || useEmail ? 'email' : 'text'}
          inputMode={tipo === 'equipe' || useEmail ? 'email' : 'numeric'}
          autoComplete={tipo === 'equipe' || useEmail ? 'email' : 'username'}
          required
          value={identifier}
          onChange={(e) => {
            setIdentifier(
              tipo === 'equipe' || useEmail ? e.target.value : formatCpfInput(e.target.value)
            )
          }}
          placeholder={tipo === 'equipe' || useEmail ? 'seu@email.com' : '000.000.000-00'}
        />
      </div>

      {tipo === 'cliente' && (
        <button
          type="button"
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            setUseEmail((v) => !v)
            setIdentifier('')
          }}
        >
          {useEmail ? 'Usar CPF' : 'Usar e-mail'}
        </button>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onVoltar}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Voltar ao login
      </Button>
    </form>
  )
}
