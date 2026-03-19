import { describe, expect, it } from 'vitest'
import { mapWallets, normalizeWalletsState } from './utils'
import { WalletsState } from './types'

describe('wallets utils', () => {
  it('removes unsupported and duplicated wallet symbols while preserving valid order', () => {
    const state: WalletsState = {
      symbols: [
        { symbol: 'BTC', isVisible: false },
        { symbol: 'LEGACY' as never, isVisible: true },
        { symbol: 'ADM', isVisible: true },
        { symbol: 'BTC', isVisible: true }
      ]
    }

    const normalizedState = normalizeWalletsState(state)

    expect(normalizedState.symbols[0]).toEqual({ symbol: 'BTC', isVisible: false })
    expect(normalizedState.symbols[1]).toEqual({ symbol: 'ADM', isVisible: true })
    expect(normalizedState.symbols.some((wallet) => wallet.symbol === ('LEGACY' as never))).toBe(
      false
    )
    expect(normalizedState.symbols.filter((wallet) => wallet.symbol === 'BTC')).toHaveLength(1)
  })

  it('appends missing supported wallets with default visibility', () => {
    const defaults = mapWallets()
    const state: WalletsState = {
      symbols: defaults.slice(0, 2)
    }

    const normalizedState = normalizeWalletsState(state)

    expect(normalizedState.symbols).toEqual(defaults)
    expect(normalizedState.symbols.slice(0, 2)).toEqual(defaults.slice(0, 2))
    expect(normalizedState.symbols.at(-1)?.isVisible).toBe(defaults.at(-1)?.isVisible)
  })
})
