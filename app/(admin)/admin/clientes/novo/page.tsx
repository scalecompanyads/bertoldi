import { ClienteForm } from '@/components/admin/cliente-form'

export const metadata = { title: 'Novo cliente — Admin' }

export default function NovoClientePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Novo cliente</h1>
      <ClienteForm />
    </div>
  )
}
