import { describe, expect, it } from 'vitest'

import Identicon from './identicon'

describe('Identicon', () => {
  it.each([
    [
      'U12345678901234567890',
      [
        '#ffffff',
        '#ffffff',
        '#ffffff',
        '#ffffff',
        '#ffffff',
        '#a3a5af',
        '#d1d2d7',
        '#474a5f',
        '#ffffff'
      ]
    ],
    [
      'U0',
      [
        '#fee7d6',
        '#ffffff',
        '#faa05a',
        '#ffffff',
        '#faa05a',
        '#faa05a',
        '#faa05a',
        '#faa05a',
        '#fdd0ad'
      ]
    ],
    [
      'U1',
      [
        '#d1d2d7',
        '#d1d2d7',
        '#ffffff',
        '#d1d2d7',
        '#474a5f',
        '#474a5f',
        '#d1d2d7',
        '#d1d2d7',
        '#ffffff'
      ]
    ],
    [
      'U99999999999999999999',
      [
        '#8bcef6',
        '#ffffff',
        '#179cec',
        '#8bcef6',
        '#c5e6fa',
        '#ffffff',
        '#8bcef6',
        '#8bcef6',
        '#179cec'
      ]
    ],
    [
      'U6727708642808744780',
      [
        '#d1d2d7',
        '#474a5f',
        '#a3a5af',
        '#474a5f',
        '#474a5f',
        '#a3a5af',
        '#ffffff',
        '#474a5f',
        '#ffffff'
      ]
    ]
  ])(
    'preserves the deterministic color vector for %s after the MD5 migration',
    (address, colors) => {
      const identicon = new Identicon()

      expect(identicon.triangleColors(0, address, 6)).toEqual(colors)
    }
  )
})
