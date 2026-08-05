export function normalizarEmail(email: string) {
  return email.trim().toLowerCase()
}

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
