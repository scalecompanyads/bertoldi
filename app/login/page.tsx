import { redirect } from 'next/navigation'

/** Compatibilidade: /login redireciona para a raiz. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { erro } = await searchParams
  redirect(erro ? `/?erro=${encodeURIComponent(erro)}` : '/')
}
