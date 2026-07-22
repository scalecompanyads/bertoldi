'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ClienteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
      <h1 className="text-lg font-semibold">Não foi possível carregar esta página</h1>
      <p className="text-sm text-muted-foreground">
        Seus dados não foram alterados. Tente novamente ou fale com o escritório se o erro continuar.
      </p>
      <Button type="button" onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
