// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { parsePinnedRevision, parseSubmoduleStatus } from './submodule.mjs'

const revision = 'd2e1b88919f059b0278cda1fb717664602852df2'

describe('parsePinnedRevision', () => {
  it('reads the submodule revision recorded in the git index', () => {
    expect(parsePinnedRevision(`160000 ${revision} 0\tadamant-wallets`)).toBe(revision)
  })

  it.each([
    ['an empty index entry', ''],
    ['a regular file', `100644 ${revision} 0\tadamant-wallets`],
    ['an unresolved merge stage', `160000 ${revision} 2\tadamant-wallets`],
    ['another path', `160000 ${revision} 0\tadamant-wallets-fork`]
  ])('rejects %s', (_description, output) => {
    expect(() => parsePinnedRevision(output)).toThrow('has no resolved submodule revision')
  })
})

describe('parseSubmoduleStatus', () => {
  it.each([
    [' ', 'current'],
    ['-', 'uninitialized'],
    ['+', 'different'],
    ['U', 'conflict']
  ])('maps the %j prefix to the %s state', (prefix, state) => {
    expect(parseSubmoduleStatus(`${prefix}${revision} adamant-wallets (heads/dev)`)).toEqual({
      state,
      revision
    })
  })

  it('rejects unexpected output', () => {
    expect(() => parseSubmoduleStatus('fatal: no submodule mapping found')).toThrow(
      'Unexpected git submodule status output'
    )
  })
})
