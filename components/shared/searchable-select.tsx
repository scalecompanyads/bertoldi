'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { matchesSearch } from '@/lib/search-normalize'

export interface SearchableSelectOption {
  value: string
  label: string
  /** Campos extras usados na busca (CNJ, CPF, etc.) */
  keywords?: string
}

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  id?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Selecionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Nenhum resultado.',
  className,
  id: idProp,
}: SearchableSelectProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const listboxId = `${id}-listbox`
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    return options.filter((o) => matchesSearch(search, o.label, o.keywords))
  }, [options, search])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function escolher(next: string) {
    onValueChange(next)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'dark:bg-input/30 dark:hover:bg-input/50',
          !selected && 'text-muted-foreground'
        )}
      >
        <span className="truncate text-left">{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          <div className="border-b p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 pl-8"
                aria-label={searchPlaceholder}
              />
            </div>
          </div>
          <ul
            id={listboxId}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</li>
            ) : (
              filtered.map((o) => {
                const ativo = o.value === value
                return (
                  <li key={o.value} role="option" aria-selected={ativo}>
                    <button
                      type="button"
                      onClick={() => escolher(o.value)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                        ativo && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <span className="flex-1 truncate">{o.label}</span>
                      {ativo && <Check className="h-4 w-4 shrink-0 opacity-70" />}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
