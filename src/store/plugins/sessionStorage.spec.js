import { describe, expect, it } from 'vitest'

import { reduceSessionState, restoreSessionState } from './sessionStorage'

function createStorage(initialValue) {
  const values = new Map()
  if (initialValue !== undefined) values.set('adm', initialValue)

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  }
}

describe('session storage persistence', () => {
  it('never writes the passphrase or password hash', () => {
    expect(
      reduceSessionState({
        address: 'U123',
        balance: 42,
        passphrase: 'encoded secret phrase',
        password: 'derived password hash'
      })
    ).toEqual({ address: 'U123', balance: 42 })
  })

  it('removes legacy secrets before restoring session state', () => {
    const storage = createStorage(
      JSON.stringify({
        address: 'U123',
        balance: 42,
        passphrase: 'encoded secret phrase',
        password: 'derived password hash'
      })
    )

    expect(restoreSessionState('adm', storage)).toEqual({ address: 'U123', balance: 42 })
    expect(JSON.parse(storage.getItem('adm'))).toEqual({ address: 'U123', balance: 42 })
  })

  it('drops malformed and unexpected persisted values', () => {
    const storage = createStorage('{broken')

    expect(restoreSessionState('adm', storage)).toEqual({})
    expect(storage.getItem('adm')).toBeNull()
  })
})
