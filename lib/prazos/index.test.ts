import { describe, expect, it } from 'vitest'
import { vencimentoPrazoDJEN } from './index'
import { expandirDiasNaoUteis } from './calendario'

describe('calendários forenses por comarca', () => {
  it('aplica feriado estadual durante a contagem', () => {
    const rj = expandirDiasNaoUteis([
      { data_inicio: '2026-04-23', data_fim: '2026-04-23' },
    ])
    expect(vencimentoPrazoDJEN('2026-04-20', 5, rj)).toEqual(new Date(2026, 3, 30))
  })

  it('diferencia calendários de duas comarcas', () => {
    const saoPauloCapital = expandirDiasNaoUteis([
      { data_inicio: '2027-01-25', data_fim: '2027-01-25' },
    ])
    const interiorSemFeriado = new Set<string>()

    expect(vencimentoPrazoDJEN('2027-01-22', 2, saoPauloCapital)).toEqual(new Date(2027, 0, 28))
    expect(vencimentoPrazoDJEN('2027-01-22', 2, interiorSemFeriado)).toEqual(new Date(2027, 0, 27))
  })

  it('expande e aplica intervalo de recesso', () => {
    const recesso = expandirDiasNaoUteis([
      { data_inicio: '2026-12-20', data_fim: '2027-01-06' },
    ])
    expect(recesso.has('2026-12-31')).toBe(true)
    expect(recesso.has('2027-01-06')).toBe(true)
    expect(vencimentoPrazoDJEN('2026-12-18', 5, recesso)).toEqual(new Date(2027, 0, 14))
  })
})
