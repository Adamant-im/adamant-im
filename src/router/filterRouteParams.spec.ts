import type { RouteParamsGeneric } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { filterRouteParams } from '@/router/filterRouteParams'

describe('filterRouteParams', () => {
  it('keeps only params declared in the target route path', () => {
    expect(
      filterRouteParams('/transactions/:crypto?', {
        crypto: 'ADM',
        txId: 'abc123',
        cryptoCurrency: 'BTC'
      })
    ).toEqual({
      crypto: 'ADM'
    })
  })

  it('returns an empty object when the target route has no params', () => {
    expect(
      filterRouteParams('/options', {
        crypto: 'ADM',
        txId: 'abc123'
      })
    ).toEqual({})
  })

  it('supports repeatable params and custom regexp segments', () => {
    expect(
      filterRouteParams('/:pathMatch(.*)*', {
        pathMatch: ['foo', 'bar'],
        txId: 'abc123'
      })
    ).toEqual({
      pathMatch: ['foo', 'bar']
    })
  })

  it('drops param values that are not string, number, or string/number arrays', () => {
    expect(
      filterRouteParams('/transactions/:crypto', {
        crypto: true,
        txId: 'abc123'
      } as RouteParamsGeneric)
    ).toEqual({})

    expect(
      filterRouteParams('/transactions/:crypto', {
        crypto: { nested: 'object' },
        txId: 'abc123'
      } as RouteParamsGeneric)
    ).toEqual({})
  })

  it('drops array params when any element is not a string or number', () => {
    expect(
      filterRouteParams('/:pathMatch(.*)*', {
        pathMatch: ['ok', 2, { bad: true }],
        txId: 'abc123'
      } as RouteParamsGeneric)
    ).toEqual({})
  })
})
