import { describe, expect, it } from 'vitest'

import { resolveWalletsSourceBranch } from './sourceBranch.mjs'

describe('resolveWalletsSourceBranch', () => {
  it.each([
    ['master', 'master'],
    ['dev', 'dev'],
    ['fix/adm-tx-sync-status', 'dev'],
    ['', 'dev'],
    [undefined, 'dev']
  ])('maps PWA branch %s to adamant-wallets/%s', (pwaBranch, expectedBranch) => {
    expect(resolveWalletsSourceBranch({ pwaBranch })).toBe(expectedBranch)
  })

  it.each(['dev', 'master'])('uses an explicit %s override', (requestedBranch) => {
    expect(
      resolveWalletsSourceBranch({
        pwaBranch: requestedBranch === 'dev' ? 'master' : 'dev',
        requestedBranch
      })
    ).toBe(requestedBranch)
  })

  it.each(['release', 'main', ''])(
    'rejects an unsupported explicit %s override',
    (requestedBranch) => {
      expect(() => resolveWalletsSourceBranch({ requestedBranch })).toThrow(
        'Expected "dev" or "master".'
      )
    }
  )
})
