'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { loginAsCliente } from '@/lib/actions/auth'
import { formatCpfInput } from '@/lib/cpf'
import { EsqueciSenhaForm } from '@/components/login/esqueci-senha-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

function ClienteLoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [useEmail, setUseEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modo, setModo] = useState<'login' | 'recuperar'>('login')

  if (modo === 'recuperar') {
    return <EsqueciSenhaForm tipo="cliente" onVoltar={() => setModo('login')} />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await loginAsCliente(identifier, password)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    router.push('/cliente')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cliente-identifier">
          {useEmail ? 'E-mail' : 'CPF'}
        </Label>
        <Input
          id="cliente-identifier"
          type={useEmail ? 'email' : 'text'}
          inputMode={useEmail ? 'email' : 'numeric'}
          autoComplete={useEmail ? 'email' : 'username'}
          required
          value={identifier}
          onChange={(e) => {
            setIdentifier(useEmail ? e.target.value : formatCpfInput(e.target.value))
          }}
          placeholder={useEmail ? 'seu@email.com' : '000.000.000-00'}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cliente-password">Senha</Label>
        <Input
          id="cliente-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar como cliente'}
      </Button>
      <button
        type="button"
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setModo('recuperar')}
      >
        Esqueci minha senha
      </button>
      <button
        type="button"
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => {
          setUseEmail((v) => !v)
          setIdentifier('')
        }}
      >
        {useEmail ? 'Entrar com CPF' : 'Entrar com e-mail'}
      </button>
    </form>
  )
}

function EquipeLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [modo, setModo] = useState<'login' | 'recuperar'>('login')

  if (modo === 'recuperar') {
    return <EsqueciSenhaForm tipo="equipe" onVoltar={() => setModo('login')} />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const connectionError = /fetch failed|enotfound|econnrefused|network/i.test(
        error.message
      )
      toast.error(
        connectionError
          ? 'Não foi possível conectar ao Supabase. Verifique o .env.local e reinicie o servidor.'
          : 'Email ou senha incorretos.'
      )
      setLoading(false)
      return
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('papel')
      .eq('id', data.user.id)
      .single()

    if (!usuario || usuario.papel === 'cliente') {
      await supabase.auth.signOut()
      toast.error('Esta conta é de cliente. Use a aba Cliente para entrar.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="equipe-email">E-mail</Label>
        <Input
          id="equipe-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="equipe-password">Senha</Label>
        <Input
          id="equipe-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar como equipe'}
      </Button>
      <button
        type="button"
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setModo('recuperar')}
      >
        Esqueci minha senha
      </button>
    </form>
  )
}

export function LoginForm() {
  return (
    <Tabs defaultValue="cliente" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="cliente">Cliente</TabsTrigger>
        <TabsTrigger value="equipe">Equipe</TabsTrigger>
      </TabsList>
      <TabsContent value="cliente" className="mt-4">
        <ClienteLoginForm />
      </TabsContent>
      <TabsContent value="equipe" className="mt-4">
        <EquipeLoginForm />
      </TabsContent>
    </Tabs>
  )
}
