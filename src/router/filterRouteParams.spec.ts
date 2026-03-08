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
})
