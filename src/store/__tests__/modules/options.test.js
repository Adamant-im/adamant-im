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
})
