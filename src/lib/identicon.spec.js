import { describe, expect, it } from 'vitest'

import Identicon from './identicon'

describe('Identicon', () => {
  it('preserves the deterministic color vector after the MD5 implementation migration', () => {
    const identicon = new Identicon()

    expect(identicon.triangleColors(0, 'U12345678901234567890', 6)).toEqual([
      '#ffffff',
      '#ffffff',
      '#ffffff',
      '#ffffff',
      '#ffffff',
      '#a3a5af',
      '#d1d2d7',
      '#474a5f',
      '#ffffff'
    ])
  })
})
