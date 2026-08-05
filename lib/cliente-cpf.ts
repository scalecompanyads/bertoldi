import { createAdminClient } from '@/lib/supabase/admin'
import { formatCpfInput, isValidCpf, normalizeCpfDigits } from '@/lib/cpf'

export function formatCpfExibicao(value: string | null | undefined): string {
  if (!value) return ''
  const digits = normalizeCpfDigits(value)
  if (digits.length !== 11) return value
  return formatCpfInput(digits)
}

export function validarCpfCliente(value: string | null | undefined): { error: string } | { ok: true; digits: string } {
  const digits = normalizeCpfDigits(value ?? '')
  if (digits.length !== 11) {
    return { error: 'CPF válido é obrigatório (11 dígitos).' }
  }
  if (!isValidCpf(digits)) {
    return { error: 'CPF inválido. Confira os números digitados.' }
  }
  return { ok: true, digits }
}

export async function buscarClientePorCpf(
  cpfDigits: string,
  ignorarId?: string
): Promise<{ id: string; nome: string } | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_cliente_por_cpf', { cpf_input: cpfDigits })

  if (!error && data?.length) {
    const encontrado = data[0] as { id: string; nome: string }
    if (!ignorarId || encontrado.id !== ignorarId) return encontrado
    return null
  }

  // Fallback antes da migration 0020 estar aplicada
  const { data: clientes } = await admin
    .from('clientes')
    .select('id, nome, cpf_cnpj')
    .not('cpf_cnpj', 'is', null)

  for (const cliente of clientes ?? []) {
    if (normalizeCpfDigits(cliente.cpf_cnpj ?? '') !== cpfDigits) continue
    if (ignorarId && cliente.id === ignorarId) continue
    return { id: cliente.id, nome: cliente.nome }
  }

  return null
}

export async function assertCpfClienteUnico(
  cpfDigits: string,
  ignorarId?: string
): Promise<{ error: string } | { ok: true }> {
  const existente = await buscarClientePorCpf(cpfDigits, ignorarId)
  if (!existente) return { ok: true }

  return {
    error: `Já existe um cliente cadastrado com este CPF (${existente.nome}). Abra o cadastro existente em vez de criar outro.`,
  }
}

export function erroCpfDuplicado(message: string): string | null {
  if (/idx_clientes_cpf_digits_unique|duplicate key.*cpf_digits/i.test(message)) {
    return 'Já existe um cliente cadastrado com este CPF.'
  }
  return null
}
