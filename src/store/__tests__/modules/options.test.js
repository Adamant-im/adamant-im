import { describe, it, beforeEach, expect } from 'vitest'
import module from '@/store/modules/options'

describe('Store: options.js', () => {
  let state = null

  beforeEach(() => {
    state = module.state()
  })

  it('should return initial state', () => {
    expect(typeof state === 'object').toBe(true)
  })

  it('should mutate existing option', () => {
    expect(state.stayLoggedIn).toBe(false)

    module.mutations.updateOption(state, {
      key: 'stayLoggedIn',
      value: false
    })

    expect(state.stayLoggedIn).toBe(false)
  })

  it('should not mutate non-existent option', () => {
    expect(state.nonExistentOption).toBe(undefined)

    module.mutations.updateOption(state, {
      key: 'nonExistentOption',
      value: true
    })

    expect(state.nonExistentOption).toBe(undefined)
  })

  it('stores the last visited settings route', () => {
    expect(state.settingsLastRoute).toBe('/options')

    module.mutations.setSettingsLastRoute(state, '/options/wallets')

    expect(state.settingsLastRoute).toBe('/options/wallets')
  })

  it('stores the last visited account route', () => {
    expect(state.accountLastRoute).toBe('/home')

    module.mutations.setAccountLastRoute(state, '/transactions/ADM')

    expect(state.accountLastRoute).toBe('/transactions/ADM')
  })

  it('stores account scroll positions per route', () => {
    expect(module.getters.accountScrollPosition(state)('/home')).toBe(0)

    module.mutations.setAccountScrollPosition(state, {
      path: '/transactions/ADM',
      top: 184
    })
    module.mutations.setAccountScrollPosition(state, {
      path: '/transactions/ADM/txid',
      top: 92
    })

    expect(module.getters.accountScrollPosition(state)('/transactions/ADM')).toBe(184)
    expect(module.getters.accountScrollPosition(state)('/transactions/ADM/txid')).toBe(92)
    expect(module.getters.accountScrollPosition(state)('/home')).toBe(0)
  })

  it('resets saved account route and scroll positions', () => {
    module.mutations.setAccountLastRoute(state, '/transactions/ADM')
    module.mutations.setAccountScrollPosition(state, {
      path: '/transactions/ADM',
      top: 260
    })
    module.mutations.setAccountScrollPosition(state, {
      path: '/transactions/ADM/txid',
      top: 120
    })

    module.mutations.resetAccountViewState(state)

    expect(state.accountLastRoute).toBe('/home')
    expect(state.accountScrollPositions).toEqual({})
  })

  it('stores settings scroll positions per route', () => {
    expect(module.getters.settingsScrollPosition(state)('/options')).toBe(0)

    module.mutations.setSettingsScrollPosition(state, {
      path: '/options/wallets',
      top: 184
    })
    module.mutations.setSettingsScrollPosition(state, {
      path: '/options/nodes',
      top: 92
    })

    expect(module.getters.settingsScrollPosition(state)('/options/wallets')).toBe(184)
    expect(module.getters.settingsScrollPosition(state)('/options/nodes')).toBe(92)
    expect(module.getters.settingsScrollPosition(state)('/options')).toBe(0)
  })

  it('resets saved settings route and scroll positions', () => {
    module.mutations.setSettingsLastRoute(state, '/options/nodes')
    module.mutations.setSettingsScrollPosition(state, {
      path: '/options',
      top: 260
    })
    module.mutations.setSettingsScrollPosition(state, {
      path: '/options/nodes',
      top: 120
    })

    module.mutations.resetSettingsViewState(state)

    expect(state.settingsLastRoute).toBe('/options')
    expect(state.settingsScrollPositions).toEqual({})
  })
})
