import { BertoldiLogo } from '@/components/shared/bertoldi-logo'

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <BertoldiLogo size="lg" />
      <p className="text-muted-foreground">Plataforma em construção.</p>
    </main>
  )
}
