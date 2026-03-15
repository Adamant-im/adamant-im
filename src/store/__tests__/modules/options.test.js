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
