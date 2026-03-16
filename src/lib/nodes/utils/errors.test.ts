import { describe, expect, it } from 'vitest'

import { AllNodesDisabledError } from './errors'

describe('AllNodesDisabledError', () => {
  it('uppercases the node label in the user-facing message', () => {
    expect(new AllNodesDisabledError('adm').message).toBe('ADM: All nodes are disabled')
  })
})
