/** Mantém apenas dígitos do CPF/CNPJ. */
export function normalizeCpfDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Formata CPF enquanto digita: 000.000.000-00 */
export function formatCpfInput(value: string): string {
  const digits = normalizeCpfDigits(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function isValidCpf(cpf: string): boolean {
  const digits = normalizeCpfDigits(cpf)
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10) rest = 0
  if (rest !== Number(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10) rest = 0
  return rest === Number(digits[10])
}
