'use client'

import { useMemo } from 'react'
import { SearchableSelect, type SearchableSelectOption } from '@/components/shared/searchable-select'
import type { Cliente } from '@/lib/types'

type ClienteOpcao = Pick<Cliente, 'id' | 'nome'> & { cpf_cnpj?: string | null }

interface ClienteSelectProps {
  clientes: ClienteOpcao[]
  value: string
  onValueChange: (value: string) => void
  /** Ex.: opção "Todos os clientes (global)" com value __global__ */
  globalOption?: { value: string; label: string }
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  id?: string
}

export function ClienteSelect({
  clientes,
  value,
  onValueChange,
  globalOption,
  placeholder = 'Selecionar cliente...',
  searchPlaceholder = 'Buscar por nome ou CPF/CNPJ...',
  className,
  id,
}: ClienteSelectProps) {
  const options = useMemo(() => {
    const lista: SearchableSelectOption[] = clientes.map((c) => ({
      value: c.id,
      label: c.nome,
      keywords: c.cpf_cnpj ?? undefined,
    }))
    if (globalOption) {
      return [{ value: globalOption.value, label: globalOption.label }, ...lista]
    }
    return lista
  }, [clientes, globalOption])

  return (
    <SearchableSelect
      id={id}
      className={className}
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage="Nenhum cliente encontrado."
    />
  )
}
